import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import {
  ListingDetail,
  ListingKind,
  ListingQuery,
  ListingQueryResult,
  ListingStatus,
  ListingSummary,
  PriceInsight
} from "@/lib/marketplace-types";
import { calculatePlanExpiry, type PlanType } from "@/lib/listing-plans";
import { getCompatibleEngineTypes, getCompatibleTransmissions } from "@/lib/car-data";
import { ensureSeedData } from "@/server/bootstrap-seed";
import { getBoostOrderSql } from "@/server/listing-boost-store";
import { persistSupportUploadFile } from "@/server/support-upload-storage";

interface ListingRow {
  id: string;
  title: string;
  description: string;
  price_azn: number;
  city: string;
  year: number;
  mileage_km: number;
  fuel_type: string;
  engine_type?: string | null;
  transmission: string;
  make: string;
  model: string;
  vin: string;
  status: string;
  seller_type: string;
  owner_user_id: string | null;
  dealer_profile_id: string | null;
  dealer_owner_user_id?: string | null;
  body_type?: string | null;
  drive_type?: string | null;
  color?: string | null;
  condition?: string | null;
  engine_volume_cc?: number | null;
  interior_material?: string | null;
  has_sunroof?: boolean | null;
  credit_available?: boolean | null;
  barter_available?: boolean | null;
  seat_heating?: boolean | null;
  seat_cooling?: boolean | null;
  camera_360?: boolean | null;
  parking_sensors?: boolean | null;
  adaptive_cruise?: boolean | null;
  lane_assist?: boolean | null;
  owners_count?: number | null;
  has_service_book?: boolean | null;
  has_repair_history?: boolean | null;
  created_at: Date;
  updated_at: Date;
  plan_type?: string | null;
  plan_expires_at?: Date | null;
  image_url?: string | null;
  trust_score?: number | null;
  vin_verified?: boolean | null;
  seller_verified?: boolean | null;
  media_complete?: boolean | null;
  mileage_flag_severity?: string | null;
  mileage_flag_message?: string | null;
  service_history_summary?: string | null;
  risk_summary?: string | null;
  last_verified_at?: Date | null;
  listing_kind?: string | null;
  part_category?: string | null;
  part_subcategory?: string | null;
  part_brand?: string | null;
  part_condition?: "new" | "used" | "refurbished" | null;
  part_authenticity?: "original" | "oem" | "aftermarket" | null;
  part_oem_code?: string | null;
  part_sku?: string | null;
  part_quantity?: number | null;
  part_compatibility?: string | null;
  contact_phone?: string | null;
  whatsapp_phone?: string | null;
}

interface ServiceRecordRow {
  id: string;
  source_type: string;
  service_date: Date;
  mileage_km: number;
  summary: string;
}

const tableColumnAvailabilityCache = new Map<string, boolean>();

async function hasTableColumn(tableName: string, columnName: string): Promise<boolean> {
  const cacheKey = `${tableName}.${columnName}`;
  const cached = tableColumnAvailabilityCache.get(cacheKey);
  if (cached !== undefined) return cached;
  try {
    const pool = getPgPool();
    const result = await pool.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
            AND column_name = $2
        ) AS exists
      `,
      [tableName, columnName]
    );
    const exists = Boolean(result.rows[0]?.exists);
    tableColumnAvailabilityCache.set(cacheKey, exists);
    return exists;
  } catch {
    // Fail-open for compatibility; the query layer keeps legacy-safe defaults.
    tableColumnAvailabilityCache.set(cacheKey, false);
    return false;
  }
}

async function ensureListingBoostActivationsTable(): Promise<void> {
  try {
    const pool = getPgPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS listing_boost_activations (
        id             TEXT PRIMARY KEY,
        listing_id     TEXT NOT NULL,
        package_id     TEXT NOT NULL,
        boost_type     TEXT NOT NULL,
        starts_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ends_at        TIMESTAMPTZ,
        bumps_per_day  INTEGER NOT NULL DEFAULT 0,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS listing_boost_activations_listing_idx
        ON listing_boost_activations (listing_id);
      CREATE INDEX IF NOT EXISTS listing_boost_activations_active_idx
        ON listing_boost_activations (boost_type, starts_at, ends_at);
    `);
  } catch {
    // optional table, query layer should continue
  }
}

async function hasListingBoostActivationsTable(): Promise<boolean> {
  try {
    const pool = getPgPool();
    const result = await pool.query<{ exists: string | null }>(
      `SELECT to_regclass('public.listing_boost_activations')::text AS exists`
    );
    return Boolean(result.rows[0]?.exists);
  } catch {
    return false;
  }
}

function inferPriceInsight(priceAzn: number): PriceInsight {
  if (priceAzn < 22000) return "below_market";
  if (priceAzn > 33000) return "above_market";
  return "market_rate";
}

function sanitizeMediaUrl(url: string): string | null {
  const normalized = url.trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (/^\//.test(normalized)) return normalized;
  if (/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(normalized)) return normalized;
  return null;
}

function parseDataImageUrl(dataUrl: string): { mimeType: string; extension: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
  if (!match) return null;
  const imageType = match[1].toLowerCase();
  const base64Payload = match[2];
  if (!base64Payload) return null;
  try {
    const buffer = Buffer.from(base64Payload, "base64");
    if (buffer.length === 0) return null;
    const extension = imageType === "jpg" ? "jpg" : imageType;
    const mimeType = imageType === "jpg" ? "image/jpeg" : `image/${imageType}`;
    return { mimeType, extension, buffer };
  } catch {
    return null;
  }
}

async function normalizeAndPersistImageUrl(url: string): Promise<string | null> {
  const sanitized = sanitizeMediaUrl(url);
  if (!sanitized) return null;
  if (!sanitized.startsWith("data:image/")) return sanitized;
  const parsed = parseDataImageUrl(sanitized);
  if (!parsed) return null;
  const stored = await persistSupportUploadFile({
    folder: "listing-images",
    fileId: randomUUID(),
    originalFilename: `listing-image.${parsed.extension}`,
    buffer: parsed.buffer,
    mimeType: parsed.mimeType
  });
  return stored.url;
}

function mapRowToSummary(row: ListingRow): ListingSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priceAzn: row.price_azn,
    city: row.city,
    year: row.year,
    mileageKm: row.mileage_km,
    fuelType: row.fuel_type,
    engineType: row.engine_type ?? undefined,
    transmission: row.transmission,
    make: row.make,
    model: row.model,
    vin: row.vin,
    status: row.status as ListingSummary["status"],
    sellerType: row.seller_type as ListingSummary["sellerType"],
    ownerUserId: row.owner_user_id ?? undefined,
    dealerProfileId: row.dealer_profile_id ?? undefined,
    dealerOwnerUserId: row.dealer_owner_user_id ?? undefined,
    bodyType: row.body_type ?? undefined,
    driveType: row.drive_type ?? undefined,
    color: row.color ?? undefined,
    condition: row.condition ?? undefined,
    engineVolumeCc: row.engine_volume_cc ?? undefined,
    interiorMaterial: row.interior_material ?? undefined,
    hasSunroof: row.has_sunroof ?? undefined,
    creditAvailable: row.credit_available ?? undefined,
    barterAvailable: row.barter_available ?? undefined,
    vinProvided: Boolean(row.vin && row.vin !== "PARTS-NOVIN"),
    seatHeating: row.seat_heating ?? undefined,
    seatCooling: row.seat_cooling ?? undefined,
    camera360: row.camera_360 ?? undefined,
    parkingSensors: row.parking_sensors ?? undefined,
    adaptiveCruise: row.adaptive_cruise ?? undefined,
    laneAssist: row.lane_assist ?? undefined,
    ownersCount: row.owners_count ?? undefined,
    hasServiceBook: row.has_service_book ?? undefined,
    hasRepairHistory: row.has_repair_history ?? undefined,
    listingKind: row.listing_kind === "part" ? "part" : "vehicle",
    partCategory: row.part_category ?? undefined,
    partSubcategory: row.part_subcategory ?? undefined,
    partBrand: row.part_brand ?? undefined,
    partCondition: row.part_condition ?? undefined,
    partAuthenticity: row.part_authenticity ?? undefined,
    partOemCode: row.part_oem_code ?? undefined,
    partSku: row.part_sku ?? undefined,
    partQuantity: row.part_quantity ?? undefined,
    partCompatibility: row.part_compatibility ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    whatsappPhone: row.whatsapp_phone ?? undefined,
    planType: (row.plan_type as PlanType) ?? "free",
    planExpiresAt: row.plan_expires_at?.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    imageUrl: row.image_url ?? undefined,
    trustScore: row.trust_score ?? 50,
    vinVerified: row.vin_verified ?? false,
    sellerVerified: row.seller_verified ?? false,
    mediaComplete: row.media_complete ?? false,
    mileageFlagSeverity: (row.mileage_flag_severity as ListingSummary["mileageFlagSeverity"]) ?? undefined,
    mileageFlagMessage: row.mileage_flag_message ?? undefined,
    serviceHistorySummary: row.service_history_summary ?? undefined,
    riskSummary: row.risk_summary ?? undefined,
    lastVerifiedAt: row.last_verified_at?.toISOString(),
    priceInsight: inferPriceInsight(row.price_azn)
  };
}

export async function getActiveListingCount(): Promise<number> {
  try {
    await ensureSeedData();
    const pool = getPgPool();
    const r = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM listings WHERE status = 'active'`
    );
    return Number(r.rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function listListings(query: ListingQuery): Promise<ListingQueryResult> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 9;

  try {
    await ensureSeedData();
    await ensureListingBoostActivationsTable();
    const boostTableExists = await hasListingBoostActivationsTable();
    const pool = getPgPool();
    const values: unknown[] = [];
    const where: string[] = ["l.status = 'active'"];
    const listingKind = query.listingKind ?? "vehicle";
    values.push(listingKind);
    where.push(`COALESCE(l.listing_kind, 'vehicle') = $${values.length}`);

    if (query.city && query.city !== "Hamısı") {
      values.push(query.city);
      where.push(`l.city = $${values.length}`);
    }
    if (query.make && query.make !== "Hamısı") {
      values.push(query.make);
      where.push(`l.make = $${values.length}`);
    }
    if (query.model && query.model !== "Hamısı") {
      values.push(query.model);
      where.push(`LOWER(l.model) = LOWER($${values.length})`);
    }
    if (query.search) {
      values.push(`%${query.search.toLowerCase()}%`);
      where.push(
        `LOWER(
          l.title || ' ' || l.make || ' ' || l.model || ' ' ||
          COALESCE(l.part_category, '') || ' ' || COALESCE(l.part_subcategory, '') || ' ' ||
          COALESCE(l.part_brand, '') || ' ' || COALESCE(l.part_oem_code, '') || ' ' || COALESCE(l.part_sku, '')
        ) LIKE $${values.length}`
      );
    }
    if (query.compareIds && query.compareIds.length > 0) {
      values.push(query.compareIds);
      where.push(`l.id = ANY($${values.length}::text[])`);
    }
    if (query.fuelType) {
      values.push(query.fuelType);
      where.push(`l.fuel_type = $${values.length}`);
    }
    if (query.engineType) {
      values.push(query.engineType);
      where.push(`COALESCE(l.engine_type, '') = $${values.length}`);
    }
    if (query.transmission) {
      values.push(query.transmission);
      where.push(`l.transmission = $${values.length}`);
    }
    if (query.minPrice) {
      values.push(query.minPrice);
      where.push(`l.price_azn >= $${values.length}`);
    }
    if (query.maxPrice) {
      values.push(query.maxPrice);
      where.push(`l.price_azn <= $${values.length}`);
    }
    if (query.minYear) {
      values.push(query.minYear);
      where.push(`l.year >= $${values.length}`);
    }
    if (query.maxYear) {
      values.push(query.maxYear);
      where.push(`l.year <= $${values.length}`);
    }
    if (query.vinVerified) where.push("COALESCE(ts.vin_verified, false) = true");
    if (query.sellerVerified) where.push("COALESCE(ts.seller_verified, false) = true");
    if (query.sellerType) {
      values.push(query.sellerType);
      where.push(`l.seller_type = $${values.length}`);
    }
    if (query.partCategory) {
      values.push(query.partCategory);
      where.push(`COALESCE(l.part_category, '') = $${values.length}`);
    }
    if (query.partSubcategory) {
      values.push(query.partSubcategory);
      where.push(`COALESCE(l.part_subcategory, '') = $${values.length}`);
    }
    if (query.partBrand) {
      values.push(query.partBrand);
      where.push(`COALESCE(l.part_brand, '') = $${values.length}`);
    }
    if (query.partCondition) {
      values.push(query.partCondition);
      where.push(`COALESCE(l.part_condition, '') = $${values.length}`);
    }
    if (query.partAuthenticity) {
      values.push(query.partAuthenticity);
      where.push(`COALESCE(l.part_authenticity, '') = $${values.length}`);
    }
    if (query.inStock) {
      where.push(`COALESCE(l.part_quantity, 0) > 0`);
    }
    if (query.minMileage) {
      values.push(query.minMileage);
      where.push(`l.mileage_km >= $${values.length}`);
    }
    if (query.maxMileage) {
      values.push(query.maxMileage);
      where.push(`l.mileage_km <= $${values.length}`);
    }
    if (query.bodyType) {
      values.push(query.bodyType);
      where.push(`COALESCE(l.body_type, '') = $${values.length}`);
    }
    if (query.driveType) {
      values.push(query.driveType);
      where.push(`COALESCE(l.drive_type, '') = $${values.length}`);
    }
    if (query.color) {
      values.push(query.color);
      where.push(`COALESCE(l.color, '') = $${values.length}`);
    }
    if (query.condition) {
      values.push(query.condition);
      where.push(`COALESCE(l.condition, '') = $${values.length}`);
    }
    if (query.minEngineVolumeCc) {
      values.push(query.minEngineVolumeCc);
      where.push(`COALESCE(l.engine_volume_cc, 0) >= $${values.length}`);
    }
    if (query.maxEngineVolumeCc) {
      values.push(query.maxEngineVolumeCc);
      where.push(`COALESCE(l.engine_volume_cc, 0) <= $${values.length}`);
    }
    if (query.interiorMaterial) {
      values.push(query.interiorMaterial);
      where.push(`COALESCE(l.interior_material, '') = $${values.length}`);
    }
    if (query.hasSunroof) {
      where.push(`COALESCE(l.has_sunroof, false) = true`);
    }
    if (query.creditAvailable) {
      where.push(`COALESCE(l.credit_available, false) = true`);
    }
    if (query.barterAvailable) {
      where.push(`COALESCE(l.barter_available, false) = true`);
    }
    if (query.vinProvided) {
      where.push(`COALESCE(NULLIF(TRIM(l.vin), ''), 'PARTS-NOVIN') <> 'PARTS-NOVIN'`);
    }
    if (query.seatHeating) {
      where.push(`COALESCE(l.seat_heating, false) = true`);
    }
    if (query.seatCooling) {
      where.push(`COALESCE(l.seat_cooling, false) = true`);
    }
    if (query.camera360) {
      where.push(`COALESCE(l.camera_360, false) = true`);
    }
    if (query.parkingSensors) {
      where.push(`COALESCE(l.parking_sensors, false) = true`);
    }
    if (query.adaptiveCruise) {
      where.push(`COALESCE(l.adaptive_cruise, false) = true`);
    }
    if (query.laneAssist) {
      where.push(`COALESCE(l.lane_assist, false) = true`);
    }
    if (query.maxOwnersCount) {
      values.push(query.maxOwnersCount);
      where.push(`COALESCE(l.owners_count, 999) <= $${values.length}`);
    }
    if (query.hasServiceBook) {
      where.push(`COALESCE(l.has_service_book, false) = true`);
    }
    if (query.hasRepairHistory) {
      where.push(`COALESCE(l.has_repair_history, false) = true`);
    }

    const planOrder = "CASE COALESCE(l.plan_type, 'free') WHEN 'vip' THEN 1 WHEN 'standard' THEN 2 ELSE 3 END ASC";
    const boostOrder = getBoostOrderSql("l");
    const sortMap: Record<string, string> = {
      price_asc: "l.price_azn ASC",
      price_desc: "l.price_azn DESC",
      year_desc: "l.year DESC",
      mileage_asc: "l.mileage_km ASC",
      trust_desc: "COALESCE(ts.trust_score, 50) DESC",
      recent: boostTableExists ? `${boostOrder}, ${planOrder}, l.created_at DESC` : `${planOrder}, l.created_at DESC`
    };
    const sortSql = sortMap[query.sort ?? "recent"] ?? sortMap.recent;

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const countResult = await pool.query<{ count: string }>(
      `
        SELECT COUNT(*)::text as count
        FROM listings l
        LEFT JOIN listing_trust_signals ts ON ts.listing_id = l.id
        ${whereSql}
      `,
      values
    );

    values.push(pageSize);
    values.push((page - 1) * pageSize);

    const result = await pool.query<ListingRow>(
      `
        SELECT
          l.id, l.title, l.description, l.price_azn, l.city, l.year, l.mileage_km, l.fuel_type, l.engine_type,
          l.transmission, l.make, l.model, l.vin, l.status, l.seller_type, l.owner_user_id, l.dealer_profile_id,
          l.body_type, l.drive_type, l.color, l.condition, l.engine_volume_cc, l.interior_material, l.has_sunroof,
          l.credit_available, l.barter_available,
          l.seat_heating, l.seat_cooling, l.camera_360, l.parking_sensors, l.adaptive_cruise, l.lane_assist,
          l.owners_count, l.has_service_book, l.has_repair_history,
          l.listing_kind, l.part_category, l.part_subcategory, l.part_brand, l.part_condition, l.part_authenticity,
          l.part_oem_code, l.part_sku, l.part_quantity, l.part_compatibility,
          l.plan_type, l.plan_expires_at, l.created_at, l.updated_at,
          (
            SELECT lm.url
            FROM listing_media lm
            WHERE lm.listing_id = l.id AND lm.media_type = 'image'
            ORDER BY lm.sort_order ASC
            LIMIT 1
          ) as image_url,
          ts.trust_score, ts.vin_verified, ts.seller_verified, ts.media_complete,
          ts.mileage_flag_severity, ts.mileage_flag_message, ts.service_history_summary, ts.risk_summary, ts.last_verified_at
        FROM listings l
        LEFT JOIN listing_trust_signals ts ON ts.listing_id = l.id
        ${whereSql}
        ORDER BY ${sortSql}
        LIMIT $${values.length - 1}
        OFFSET $${values.length}
      `,
      values
    );

    return {
      items: result.rows.map(mapRowToSummary),
      total: Number(countResult.rows[0]?.count ?? "0"),
      page,
      pageSize
    };
  } catch {
    return {
      items: [],
      total: 0,
      page,
      pageSize
    };
  }
}

export async function getListingDetail(id: string): Promise<ListingDetail | null> {
  try {
    await ensureSeedData();
    const pool = getPgPool();
    const [hasPhoneNormalized, hasDealerShowWhatsapp, hasDealerWhatsappPhone] = await Promise.all([
      hasTableColumn("users", "phone_normalized"),
      hasTableColumn("dealer_profiles", "show_whatsapp"),
      hasTableColumn("dealer_profiles", "whatsapp_phone")
    ]);
    const ownerPhoneNormalizedExpr = hasPhoneNormalized ? "NULLIF(ou.phone_normalized, '')" : "NULL";
    const dealerPhoneNormalizedExpr = hasPhoneNormalized ? "NULLIF(dpu.phone_normalized, '')" : "NULL";
    const dealerShowWhatsappExpr = hasDealerShowWhatsapp ? "COALESCE(dp.show_whatsapp, FALSE)" : "FALSE";
    const dealerWhatsappPhoneExpr = hasDealerWhatsappPhone ? "NULLIF(BTRIM(dp.whatsapp_phone), '')" : "NULL";
    const listingResult = await pool.query<ListingRow>(
      `
        SELECT
          l.id, l.title, l.description, l.price_azn, l.city, l.year, l.mileage_km, l.fuel_type, l.engine_type,
          l.transmission, l.make, l.model, l.vin, l.status, l.seller_type, l.owner_user_id, l.dealer_profile_id,
          l.body_type, l.drive_type, l.color, l.condition, l.engine_volume_cc, l.interior_material, l.has_sunroof,
          l.credit_available, l.barter_available,
          l.seat_heating, l.seat_cooling, l.camera_360, l.parking_sensors, l.adaptive_cruise, l.lane_assist,
          l.owners_count, l.has_service_book, l.has_repair_history,
          l.listing_kind, l.part_category, l.part_subcategory, l.part_brand, l.part_condition, l.part_authenticity,
          l.part_oem_code, l.part_sku, l.part_quantity, l.part_compatibility,
          l.plan_type, l.plan_expires_at, l.created_at, l.updated_at,
          (
            SELECT lm.url
            FROM listing_media lm
            WHERE lm.listing_id = l.id AND lm.media_type = 'image'
            ORDER BY lm.sort_order ASC
            LIMIT 1
          ) as image_url,
          ts.trust_score, ts.vin_verified, ts.seller_verified, ts.media_complete,
          ts.mileage_flag_severity, ts.mileage_flag_message, ts.service_history_summary, ts.risk_summary, ts.last_verified_at,
          dp.owner_user_id AS dealer_owner_user_id,
          COALESCE(NULLIF(ou.phone, ''), ${ownerPhoneNormalizedExpr}, NULLIF(dpu.phone, ''), ${dealerPhoneNormalizedExpr}) AS contact_phone,
          CASE
            WHEN dp.id IS NOT NULL AND ${dealerShowWhatsappExpr} = TRUE AND ${dealerWhatsappPhoneExpr} IS NOT NULL
              THEN ${dealerWhatsappPhoneExpr}
            ELSE COALESCE(NULLIF(ou.phone, ''), ${ownerPhoneNormalizedExpr}, NULLIF(dpu.phone, ''), ${dealerPhoneNormalizedExpr})
          END AS whatsapp_phone
        FROM listings l
        LEFT JOIN listing_trust_signals ts ON ts.listing_id = l.id
        LEFT JOIN dealer_profiles dp ON dp.id = l.dealer_profile_id
        LEFT JOIN users ou ON ou.id = l.owner_user_id
        LEFT JOIN users dpu ON dpu.id = dp.owner_user_id
        WHERE l.id = $1
        LIMIT 1
      `,
      [id]
    );

    const row = listingResult.rows[0];
    if (!row) return null;

    const [serviceRows, mediaRows, relatedRows] = await Promise.all([
      pool.query<ServiceRecordRow>(
        `
          SELECT id, source_type, service_date, mileage_km, summary
          FROM listing_service_records
          WHERE listing_id = $1
          ORDER BY service_date DESC
        `,
        [id]
      ),
      pool.query<{ id: string; url: string }>(
        `
          SELECT id, url
          FROM listing_media
          WHERE listing_id = $1 AND media_type = 'image'
          ORDER BY sort_order ASC
          LIMIT 24
        `,
        [id]
      ),
      pool.query<{ id: string }>(
        `
          SELECT id
          FROM listings
          WHERE id <> $1 AND status = 'active' AND (make = $2 OR city = $3)
          ORDER BY created_at DESC
          LIMIT 3
        `,
        [id, row.make, row.city]
      )
    ]);

    const mediaUrls = (
      await Promise.all(
        mediaRows.rows.map(async (entry) => {
          const normalized = await normalizeAndPersistImageUrl(entry.url);
          if (normalized && normalized !== entry.url) {
            await pool.query(`UPDATE listing_media SET url = $1 WHERE id = $2`, [normalized, entry.id]);
          }
          return normalized;
        })
      )
    ).filter((entry): entry is string => Boolean(entry));

    return {
      ...mapRowToSummary(row),
      mediaUrls,
      contactPhone: row.contact_phone ?? undefined,
      whatsappPhone: row.whatsapp_phone ?? undefined,
      serviceRecords: serviceRows.rows.map((entry) => ({
        id: entry.id,
        sourceType: entry.source_type,
        serviceDate: entry.service_date.toISOString(),
        mileageKm: entry.mileage_km,
        summary: entry.summary
      })),
      relatedIds: relatedRows.rows.map((entry) => entry.id)
    };
  } catch {
    return null;
  }
}

export async function createListingRecord(input: {
  ownerUserId?: string;
  dealerProfileId?: string;
  title: string;
  description: string;
  make: string;
  model: string;
  year: number;
  city: string;
  priceAzn: number;
  mileageKm: number;
  fuelType: string;
  engineType?: string;
  transmission: string;
  vin: string;
  sellerType: "private" | "dealer";
  bodyType?: string;
  driveType?: string;
  color?: string;
  condition?: string;
  engineVolumeCc?: number;
  interiorMaterial?: string;
  hasSunroof?: boolean;
  creditAvailable?: boolean;
  barterAvailable?: boolean;
  vinProvided?: boolean;
  seatHeating?: boolean;
  seatCooling?: boolean;
  camera360?: boolean;
  parkingSensors?: boolean;
  adaptiveCruise?: boolean;
  laneAssist?: boolean;
  ownersCount?: number;
  hasServiceBook?: boolean;
  hasRepairHistory?: boolean;
  status?: ListingStatus;
  planType?: PlanType;
  listingKind?: ListingKind;
  partCategory?: string;
  partSubcategory?: string;
  partBrand?: string;
  partCondition?: "new" | "used" | "refurbished";
  partAuthenticity?: "original" | "oem" | "aftermarket";
  partOemCode?: string;
  partSku?: string;
  partQuantity?: number;
  partCompatibility?: string;
  imageUrls?: string[];
  imageHashes?: string[];
  trust: {
    trustScore: number;
    vinVerified: boolean;
    sellerVerified: boolean;
    mediaComplete: boolean;
    mileageFlagSeverity?: string;
    mileageFlagMessage?: string;
    serviceHistorySummary?: string;
    riskSummary?: string;
  };
}): Promise<{ id: string }> {
  const id = randomUUID();
  const pool = getPgPool();
  const client = await pool.connect();

  const status = input.status ?? "active";
  const planType = input.planType ?? "free";
  const planExpiresAt = status === "active" ? calculatePlanExpiry(planType) : null;

  try {
    await ensureSeedData();
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO listings (
          id, owner_user_id, dealer_profile_id, title, description, make, model, year, city, price_azn,
          mileage_km, fuel_type, engine_type, transmission, vin, seller_type, status, plan_type, plan_expires_at, listing_kind,
          part_category, part_subcategory, part_brand, part_condition, part_authenticity, part_oem_code, part_sku, part_quantity, part_compatibility,
          body_type, drive_type, color, condition, engine_volume_cc, interior_material, has_sunroof, credit_available, barter_available,
          seat_heating, seat_cooling, camera_360, parking_sensors, adaptive_cruise, lane_assist,
          owners_count, has_service_book, has_repair_history
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47)
      `,
      [
        id,
        input.ownerUserId ?? null,
        input.dealerProfileId ?? null,
        input.title,
        input.description,
        input.make,
        input.model,
        input.year,
        input.city,
        input.priceAzn,
        input.mileageKm,
        input.fuelType,
        input.engineType ?? null,
        input.transmission,
        input.vin,
        input.sellerType,
        status,
        planType,
        planExpiresAt,
        input.listingKind ?? "vehicle",
        input.partCategory ?? null,
        input.partSubcategory ?? null,
        input.partBrand ?? null,
        input.partCondition ?? null,
        input.partAuthenticity ?? null,
        input.partOemCode ?? null,
        input.partSku ?? null,
        input.partQuantity ?? null,
        input.partCompatibility ?? null,
        input.bodyType ?? null,
        input.driveType ?? null,
        input.color ?? null,
        input.condition ?? null,
        input.engineVolumeCc ?? null,
        input.interiorMaterial ?? null,
        input.hasSunroof ?? null,
        input.creditAvailable ?? null,
        input.barterAvailable ?? null,
        input.seatHeating ?? null,
        input.seatCooling ?? null,
        input.camera360 ?? null,
        input.parkingSensors ?? null,
        input.adaptiveCruise ?? null,
        input.laneAssist ?? null,
        input.ownersCount ?? null,
        input.hasServiceBook ?? null,
        input.hasRepairHistory ?? null
      ]
    );

    await client.query(
      `
        INSERT INTO listing_trust_signals (
          listing_id, trust_score, vin_verified, seller_verified, media_complete,
          mileage_flag_severity, mileage_flag_message, service_history_summary, risk_summary, last_verified_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `,
      [
        id,
        input.trust.trustScore,
        input.trust.vinVerified,
        input.trust.sellerVerified,
        input.trust.mediaComplete,
        input.trust.mileageFlagSeverity ?? null,
        input.trust.mileageFlagMessage ?? null,
        input.trust.serviceHistorySummary ?? null,
        input.trust.riskSummary ?? null
      ]
    );

    const normalizedImageUrls = await Promise.all(
      (input.imageUrls ?? []).map(async (entry) => await normalizeAndPersistImageUrl(entry))
    );
    const imageUrls = normalizedImageUrls.filter((entry): entry is string => Boolean(entry)).slice(0, 24);
    const imageHashes = (input.imageHashes ?? []).map((entry) => entry.trim().toLowerCase()).slice(0, 24);
    if (imageUrls.length > 0) {
      for (let index = 0; index < imageUrls.length; index += 1) {
        const perceptualHash = imageHashes[index];
        await client.query(
          `
            INSERT INTO listing_media (id, listing_id, media_type, url, sort_order, perceptual_hash)
            VALUES ($1, $2, 'image', $3, $4, $5)
          `,
          [randomUUID(), id, imageUrls[index], index, perceptualHash ?? null]
        );
      }
    }

    await client.query("COMMIT");
    return { id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getRelatedListings(ids: string[]): Promise<ListingSummary[]> {
  if (ids.length === 0) return [];
  try {
    await ensureSeedData();
    const pool = getPgPool();
    const result = await pool.query<ListingRow>(
      `
        SELECT
          l.id, l.title, l.description, l.price_azn, l.city, l.year, l.mileage_km, l.fuel_type, l.engine_type,
          l.transmission, l.make, l.model, l.vin, l.status, l.seller_type, l.owner_user_id, l.dealer_profile_id,
          l.body_type, l.drive_type, l.color, l.condition, l.engine_volume_cc, l.interior_material, l.has_sunroof,
          l.credit_available, l.barter_available,
          l.seat_heating, l.seat_cooling, l.camera_360, l.parking_sensors, l.adaptive_cruise, l.lane_assist,
          l.owners_count, l.has_service_book, l.has_repair_history,
          l.listing_kind, l.part_category, l.part_subcategory, l.part_brand, l.part_condition, l.part_authenticity,
          l.part_oem_code, l.part_sku, l.part_quantity, l.part_compatibility,
          l.plan_type, l.plan_expires_at, l.created_at, l.updated_at,
          (
            SELECT lm.url
            FROM listing_media lm
            WHERE lm.listing_id = l.id AND lm.media_type = 'image'
            ORDER BY lm.sort_order ASC
            LIMIT 1
          ) as image_url,
          ts.trust_score, ts.vin_verified, ts.seller_verified, ts.media_complete,
          ts.mileage_flag_severity, ts.mileage_flag_message, ts.service_history_summary, ts.risk_summary, ts.last_verified_at
        FROM listings l
        LEFT JOIN listing_trust_signals ts ON ts.listing_id = l.id
        WHERE l.id = ANY($1::text[])
      `,
      [ids]
    );
    return result.rows.map(mapRowToSummary);
  } catch {
    return [];
  }
}

export async function listListingsForUser(userId: string): Promise<ListingSummary[]> {
  try {
    await ensureSeedData();
    const pool = getPgPool();
    const result = await pool.query<ListingRow>(
      `
        SELECT
          l.id, l.title, l.description, l.price_azn, l.city, l.year, l.mileage_km, l.fuel_type, l.engine_type,
          l.transmission, l.make, l.model, l.vin, l.status, l.seller_type, l.owner_user_id, l.dealer_profile_id,
          l.body_type, l.drive_type, l.color, l.condition, l.engine_volume_cc, l.interior_material, l.has_sunroof,
          l.credit_available, l.barter_available,
          l.seat_heating, l.seat_cooling, l.camera_360, l.parking_sensors, l.adaptive_cruise, l.lane_assist,
          l.owners_count, l.has_service_book, l.has_repair_history,
          l.listing_kind, l.part_category, l.part_subcategory, l.part_brand, l.part_condition, l.part_authenticity,
          l.part_oem_code, l.part_sku, l.part_quantity, l.part_compatibility,
          l.plan_type, l.plan_expires_at, l.created_at, l.updated_at,
          (
            SELECT lm.url
            FROM listing_media lm
            WHERE lm.listing_id = l.id AND lm.media_type = 'image'
            ORDER BY lm.sort_order ASC
            LIMIT 1
          ) as image_url,
          ts.trust_score, ts.vin_verified, ts.seller_verified, ts.media_complete,
          ts.mileage_flag_severity, ts.mileage_flag_message, ts.service_history_summary, ts.risk_summary, ts.last_verified_at
        FROM listings l
        LEFT JOIN listing_trust_signals ts ON ts.listing_id = l.id
        WHERE l.owner_user_id = $1 OR l.dealer_profile_id IN (
          SELECT id FROM dealer_profiles WHERE owner_user_id = $1
        )
        ORDER BY l.created_at DESC
      `,
      [userId]
    );
    return result.rows.map(mapRowToSummary);
  } catch {
    return [];
  }
}

export async function countConcurrentFreeVehicleListingsForUser(userId: string): Promise<number> {
  try {
    await ensureSeedData();
    const pool = getPgPool();
    const result = await pool.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM listings l
        WHERE COALESCE(l.plan_type, 'free') = 'free'
          AND COALESCE(l.listing_kind, 'vehicle') = 'vehicle'
          AND l.status IN ('active', 'pending_review')
          AND (
            l.owner_user_id = $1 OR l.dealer_profile_id IN (
              SELECT id FROM dealer_profiles WHERE owner_user_id = $1
            )
          )
      `,
      [userId]
    );
    return Number(result.rows[0]?.count ?? "0");
  } catch {
    return 0;
  }
}

export async function countDealerListingsForUserByKind(
  userId: string,
  kind: ListingKind
): Promise<number> {
  try {
    await ensureSeedData();
    const pool = getPgPool();
    const result = await pool.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM listings l
        WHERE COALESCE(l.listing_kind, 'vehicle') = $1
          AND l.seller_type = 'dealer'
          AND l.status IN ('active', 'pending_review', 'draft')
          AND (
            l.owner_user_id = $2 OR l.dealer_profile_id IN (
              SELECT id FROM dealer_profiles WHERE owner_user_id = $2
            )
          )
      `,
      [kind, userId]
    );
    return Number(result.rows[0]?.count ?? "0");
  } catch {
    return 0;
  }
}

const DUPLICATE_LOOKBACK_DAYS = 90;

export async function hasRecentVehicleDuplicate(input: {
  userId?: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  globalScope?: boolean;
}): Promise<boolean> {
  try {
    await ensureSeedData();
    const pool = getPgPool();
    const values: unknown[] = [DUPLICATE_LOOKBACK_DAYS];
    const where: string[] = [
      `l.created_at >= NOW() - ($1::text || ' days')::interval`,
      `COALESCE(l.listing_kind, 'vehicle') = 'vehicle'`
    ];

    if (!input.globalScope) {
      if (input.userId) {
        values.push(input.userId);
        where.push(`(l.owner_user_id = $${values.length} OR l.dealer_profile_id IN (SELECT id FROM dealer_profiles WHERE owner_user_id = $${values.length}))`);
      } else {
        where.push(`l.owner_user_id IS NULL`);
      }
    }

    const cleanVin = input.vin.trim().toUpperCase();
    if (cleanVin) {
      values.push(cleanVin);
      where.push(`UPPER(l.vin) = $${values.length}`);
    } else {
      values.push(input.make.trim());
      where.push(`LOWER(l.make) = LOWER($${values.length})`);
      values.push(input.model.trim());
      where.push(`LOWER(l.model) = LOWER($${values.length})`);
      values.push(input.year);
      where.push(`l.year = $${values.length}`);
    }

    const r = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM listings l WHERE ${where.join(" AND ")}`,
      values
    );
    return Number(r.rows[0]?.count ?? "0") > 0;
  } catch {
    return false;
  }
}

export async function hasRecentPartDuplicate(input: {
  userId?: string;
  partOemCode?: string;
  partSku?: string;
  partCategory: string;
  partName: string;
  globalScope?: boolean;
}): Promise<boolean> {
  try {
    await ensureSeedData();
    const pool = getPgPool();
    const values: unknown[] = [DUPLICATE_LOOKBACK_DAYS];
    const where: string[] = [
      `l.created_at >= NOW() - ($1::text || ' days')::interval`,
      `COALESCE(l.listing_kind, 'vehicle') = 'part'`
    ];

    if (!input.globalScope) {
      if (input.userId) {
        values.push(input.userId);
        where.push(`(l.owner_user_id = $${values.length} OR l.dealer_profile_id IN (SELECT id FROM dealer_profiles WHERE owner_user_id = $${values.length}))`);
      } else {
        where.push(`l.owner_user_id IS NULL`);
      }
    }

    const oem = input.partOemCode?.trim();
    const sku = input.partSku?.trim();
    if (oem || sku) {
      const oemParts: string[] = [];
      if (oem) {
        values.push(oem);
        oemParts.push(`LOWER(COALESCE(l.part_oem_code, '')) = LOWER($${values.length})`);
      }
      if (sku) {
        values.push(sku);
        oemParts.push(`LOWER(COALESCE(l.part_sku, '')) = LOWER($${values.length})`);
      }
      where.push(`(${oemParts.join(" OR ")})`);
    } else {
      values.push(input.partCategory.trim());
      where.push(`LOWER(COALESCE(l.part_category, '')) = LOWER($${values.length})`);
      values.push(input.partName.trim());
      where.push(`LOWER(l.model) = LOWER($${values.length})`);
    }

    const r = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM listings l WHERE ${where.join(" AND ")}`,
      values
    );
    return Number(r.rows[0]?.count ?? "0") > 0;
  } catch {
    return false;
  }
}

export async function hasRecentImageHashDuplicate(input: {
  imageHashes: string[];
  lookbackDays?: number;
}): Promise<boolean> {
  const normalizedHashes = input.imageHashes
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => /^[0-9a-f]{16}$/.test(entry));
  if (normalizedHashes.length === 0) return false;

  try {
    await ensureSeedData();
    const pool = getPgPool();
    const lookbackDays = Math.max(1, Math.min(365, input.lookbackDays ?? 90));
    const result = await pool.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM listing_media lm
        JOIN listings l ON l.id = lm.listing_id
        WHERE lm.media_type = 'image'
          AND lm.perceptual_hash = ANY($1::text[])
          AND l.created_at >= NOW() - ($2::text || ' days')::interval
          AND COALESCE(l.listing_kind, 'vehicle') = 'vehicle'
      `,
      [normalizedHashes, lookbackDays]
    );
    return Number(result.rows[0]?.count ?? "0") > 0;
  } catch {
    return false;
  }
}

async function resolveListingOwnership(
  listingId: string,
  userId: string
): Promise<{ listing: { status: ListingStatus; dealerProfileId?: string; ownerUserId?: string } | null; isOwner: boolean }> {
  try {
    await ensureSeedData();
    const pool = getPgPool();
    const check = await pool.query<{ owner_user_id: string | null; dealer_profile_id: string | null; status: string }>(
      `SELECT owner_user_id, dealer_profile_id, status FROM listings WHERE id = $1`,
      [listingId]
    );
    const row = check.rows[0];
    if (!row) return { listing: null, isOwner: false };

    const isOwner = row.owner_user_id === userId;
    const isDealerOwner = row.dealer_profile_id
      ? await (async () => {
          const r = await pool.query<{ owner_user_id: string }>(
            `SELECT owner_user_id FROM dealer_profiles WHERE id = $1`,
            [row.dealer_profile_id]
          );
          return r.rows[0]?.owner_user_id === userId;
        })()
      : false;

    return {
      listing: {
        status: row.status as ListingStatus,
        ownerUserId: row.owner_user_id ?? undefined,
        dealerProfileId: row.dealer_profile_id ?? undefined
      },
      isOwner: isOwner || isDealerOwner
    };
  } catch {
    return { listing: null, isOwner: false };
  }
}

export async function validateListingOwnership(
  listingId: string,
  userId: string
): Promise<{ ok: boolean; error?: string; status?: ListingStatus }> {
  const { listing, isOwner } = await resolveListingOwnership(listingId, userId);
  if (!listing) return { ok: false, error: "Elan tapılmadı" };
  if (!isOwner) {
    return { ok: false, error: "Bu elanı redaktə etmə icazəniz yoxdur" };
  }
  return { ok: true, status: listing.status };
}

export async function applyListingPlanForOwner(
  listingId: string,
  userId: string,
  planType: PlanType,
  options?: { activate?: boolean }
): Promise<{ ok: boolean; error?: string }> {
  if (planType === "free") {
    return { ok: false, error: "Plan upgrade tələb olunur (standard və ya vip)" };
  }

  const ownership = await validateListingOwnership(listingId, userId);
  if (!ownership.ok) return ownership;

  try {
    await ensureSeedData();
    const pool = getPgPool();
    const planExpiresAt = calculatePlanExpiry(planType);
    await pool.query(
      `UPDATE listings
       SET plan_type = $1,
           plan_expires_at = CASE WHEN $4 THEN NULL ELSE $2 END,
           status = CASE WHEN $4 THEN 'pending_review' ELSE status END,
           updated_at = NOW()
       WHERE id = $3`,
      [planType, planExpiresAt, listingId, options?.activate === true]
    );
    return { ok: true };
  } catch {
    return { ok: false, error: "Plan yenilənərkən xəta baş verdi" };
  }
}

export async function updateListingPlan(
  listingId: string,
  userId: string,
  planType: PlanType
): Promise<{ ok: boolean; error?: string }> {
  return applyListingPlanForOwner(listingId, userId, planType);
}

export async function updateListingForOwner(
  listingId: string,
  userId: string,
  input: {
    title?: string;
    description?: string;
    priceAzn?: number;
    city?: string;
    make?: string;
    model?: string;
    year?: number;
    mileageKm?: number;
    fuelType?: string;
    engineType?: string;
    transmission?: string;
    vin?: string;
    bodyType?: string;
    driveType?: string;
    color?: string;
    condition?: string;
    engineVolumeCc?: number;
    interiorMaterial?: string;
    hasSunroof?: boolean;
    creditAvailable?: boolean;
    barterAvailable?: boolean;
    seatHeating?: boolean;
    seatCooling?: boolean;
    camera360?: boolean;
    parkingSensors?: boolean;
    adaptiveCruise?: boolean;
    laneAssist?: boolean;
    ownersCount?: number;
    hasServiceBook?: boolean;
    hasRepairHistory?: boolean;
  }
): Promise<{ ok: boolean; error?: string }> {
  const ownership = await validateListingOwnership(listingId, userId);
  if (!ownership.ok) return ownership;

  const title = input.title?.trim();
  const description = input.description?.trim();
  const city = input.city?.trim();
  const make = input.make?.trim();
  const model = input.model?.trim();
  const priceAzn = input.priceAzn;
  const year = input.year;
  const mileageKm = input.mileageKm;
  const fuelType = input.fuelType?.trim();
  const requestedEngineType = input.engineType?.trim();
  const requestedTransmission = input.transmission?.trim();
  const vin = input.vin !== undefined ? input.vin.trim().toUpperCase() : undefined;
  const bodyType = input.bodyType?.trim();
  const driveType = input.driveType?.trim();
  const color = input.color?.trim();
  const condition = input.condition?.trim();
  const engineVolumeCc = input.engineVolumeCc;
  const interiorMaterial = input.interiorMaterial?.trim();

  if (title !== undefined && !title) return { ok: false, error: "Başlıq boş ola bilməz." };
  if (description !== undefined && !description) return { ok: false, error: "Təsvir boş ola bilməz." };
  if (city !== undefined && !city) return { ok: false, error: "Şəhər boş ola bilməz." };
  if (make !== undefined && !make) return { ok: false, error: "Marka boş ola bilməz." };
  if (model !== undefined && !model) return { ok: false, error: "Model boş ola bilməz." };
  if (priceAzn !== undefined && (!Number.isFinite(priceAzn) || priceAzn <= 0)) {
    return { ok: false, error: "Qiymət düzgün deyil." };
  }
  if (year !== undefined && (!Number.isFinite(year) || year < 1950 || year > new Date().getFullYear() + 1)) {
    return { ok: false, error: "İl məlumatı düzgün deyil." };
  }
  if (mileageKm !== undefined && (!Number.isFinite(mileageKm) || mileageKm < 0)) {
    return { ok: false, error: "Yürüş məlumatı düzgün deyil." };
  }
  if (vin !== undefined && vin.length > 0 && !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return { ok: false, error: "VIN formatı düzgün deyil." };
  }

  const shouldNormalizePowertrain =
    fuelType !== undefined || requestedEngineType !== undefined || requestedTransmission !== undefined;
  const effectiveFuelType = fuelType ?? "Benzin";
  const compatibleEngineTypes = shouldNormalizePowertrain ? getCompatibleEngineTypes(effectiveFuelType) : [];
  const normalizedEngineType = shouldNormalizePowertrain
    ? requestedEngineType && compatibleEngineTypes.some((item) => item === requestedEngineType)
      ? requestedEngineType
      : compatibleEngineTypes[0] ?? null
    : null;
  const compatibleTransmissions = shouldNormalizePowertrain ? getCompatibleTransmissions(effectiveFuelType) : [];
  const normalizedTransmission = shouldNormalizePowertrain
    ? requestedTransmission && compatibleTransmissions.some((item) => item === requestedTransmission)
      ? requestedTransmission
      : compatibleTransmissions[0] ?? requestedTransmission ?? null
    : null;
  const normalizedEngineVolumeCc =
    engineVolumeCc !== undefined
      ? effectiveFuelType !== "Elektrik"
        ? Math.max(0, Math.round(engineVolumeCc))
        : null
      : undefined;

  try {
    await ensureSeedData();
    const pool = getPgPool();
    await pool.query(
      `
        UPDATE listings
        SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          city = COALESCE($3, city),
          price_azn = COALESCE($4, price_azn),
          make = COALESCE($5, make),
          model = COALESCE($6, model),
          year = COALESCE($7, year),
          mileage_km = COALESCE($8, mileage_km),
          fuel_type = COALESCE($9, fuel_type),
          engine_type = COALESCE($10, engine_type),
          transmission = COALESCE($11, transmission),
          vin = COALESCE($12, vin),
          body_type = COALESCE($13, body_type),
          drive_type = COALESCE($14, drive_type),
          color = COALESCE($15, color),
          condition = COALESCE($16, condition),
          engine_volume_cc = CASE
            WHEN COALESCE($9, fuel_type) = 'Elektrik' THEN NULL
            ELSE COALESCE($17, engine_volume_cc)
          END,
          interior_material = COALESCE($18, interior_material),
          has_sunroof = COALESCE($19, has_sunroof),
          credit_available = COALESCE($20, credit_available),
          barter_available = COALESCE($21, barter_available),
          seat_heating = COALESCE($22, seat_heating),
          seat_cooling = COALESCE($23, seat_cooling),
          camera_360 = COALESCE($24, camera_360),
          parking_sensors = COALESCE($25, parking_sensors),
          adaptive_cruise = COALESCE($26, adaptive_cruise),
          lane_assist = COALESCE($27, lane_assist),
          owners_count = COALESCE($28, owners_count),
          has_service_book = COALESCE($29, has_service_book),
          has_repair_history = COALESCE($30, has_repair_history),
          status = 'pending_review',
          updated_at = NOW()
        WHERE id = $31
      `,
      [
        title ?? null,
        description ?? null,
        city ?? null,
        priceAzn ?? null,
        make ?? null,
        model ?? null,
        year ?? null,
        mileageKm ?? null,
        fuelType ?? null,
        normalizedEngineType,
        normalizedTransmission,
        vin ?? null,
        bodyType ?? null,
        driveType ?? null,
        color ?? null,
        condition ?? null,
        normalizedEngineVolumeCc,
        interiorMaterial ?? null,
        input.hasSunroof ?? null,
        input.creditAvailable ?? null,
        input.barterAvailable ?? null,
        input.seatHeating ?? null,
        input.seatCooling ?? null,
        input.camera360 ?? null,
        input.parkingSensors ?? null,
        input.adaptiveCruise ?? null,
        input.laneAssist ?? null,
        input.ownersCount ?? null,
        input.hasServiceBook ?? null,
        input.hasRepairHistory ?? null,
        listingId
      ]
    );
    return { ok: true };
  } catch {
    return { ok: false, error: "Elan yenilənərkən xəta baş verdi" };
  }
}
