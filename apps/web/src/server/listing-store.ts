import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { demoListings, demoListingsDetailed } from "@/lib/demo-marketplace";
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
import { ensureSeedData } from "@/server/bootstrap-seed";

const globalForListings = globalThis as unknown as {
  ekomobilCreatedListings?: ListingDetail[];
};

function getCreatedListings(): ListingDetail[] {
  if (!globalForListings.ekomobilCreatedListings) {
    globalForListings.ekomobilCreatedListings = [];
  }
  return globalForListings.ekomobilCreatedListings;
}

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

function inferPriceInsight(priceAzn: number): PriceInsight {
  if (priceAzn < 22000) return "below_market";
  if (priceAzn > 33000) return "above_market";
  return "market_rate";
}

function sanitizeMediaUrl(url: string): string | null {
  const normalized = url.trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(normalized)) return normalized;
  return null;
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

function filterDemo(items: ListingSummary[], query: ListingQuery): ListingSummary[] {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 9;
  let result = [...items];

  const listingKind = query.listingKind ?? "vehicle";
  result = result.filter((item) => (item.listingKind ?? "vehicle") === listingKind);

  if (query.city && query.city !== "Hamısı") result = result.filter((item) => item.city === query.city);
  if (query.make && query.make !== "Hamısı") result = result.filter((item) => item.make === query.make);
  if (query.model && query.model !== "Hamısı") result = result.filter((item) => item.model.toLowerCase() === query.model!.toLowerCase());
  if (query.search) {
    const needle = query.search.toLowerCase();
    result = result.filter((item) => `${item.make} ${item.model} ${item.title}`.toLowerCase().includes(needle));
  }
  if (query.compareIds && query.compareIds.length > 0) {
    result = result.filter((item) => query.compareIds!.includes(item.id));
  }
  if (query.fuelType) result = result.filter((item) => item.fuelType === query.fuelType);
  if (query.engineType) result = result.filter((item) => item.engineType === query.engineType);
  if (query.transmission) result = result.filter((item) => item.transmission === query.transmission);
  if (query.minPrice) result = result.filter((item) => item.priceAzn >= query.minPrice!);
  if (query.maxPrice) result = result.filter((item) => item.priceAzn <= query.maxPrice!);
  if (query.minYear) result = result.filter((item) => item.year >= query.minYear!);
  if (query.maxYear) result = result.filter((item) => item.year <= query.maxYear!);
  if (query.vinVerified) result = result.filter((item) => item.vinVerified);
  if (query.sellerVerified) result = result.filter((item) => item.sellerVerified);
  if (query.sellerType) result = result.filter((item) => item.sellerType === query.sellerType);
  if (query.partCategory) result = result.filter((item) => item.partCategory === query.partCategory);
  if (query.partSubcategory) result = result.filter((item) => item.partSubcategory === query.partSubcategory);
  if (query.partBrand) result = result.filter((item) => item.partBrand === query.partBrand);
  if (query.partCondition) result = result.filter((item) => item.partCondition === query.partCondition);
  if (query.partAuthenticity) result = result.filter((item) => item.partAuthenticity === query.partAuthenticity);
  if (query.inStock) result = result.filter((item) => (item.partQuantity ?? 0) > 0);
  if (query.minMileage) result = result.filter((item) => item.mileageKm >= query.minMileage!);
  if (query.maxMileage) result = result.filter((item) => item.mileageKm <= query.maxMileage!);
  if (query.bodyType) result = result.filter((item) => item.bodyType === query.bodyType);
  if (query.driveType) result = result.filter((item) => item.driveType === query.driveType);
  if (query.color) result = result.filter((item) => item.color === query.color);
  if (query.condition) result = result.filter((item) => item.condition === query.condition);
  if (query.minEngineVolumeCc) result = result.filter((item) => (item.engineVolumeCc ?? 0) >= query.minEngineVolumeCc!);
  if (query.maxEngineVolumeCc) result = result.filter((item) => (item.engineVolumeCc ?? 0) <= query.maxEngineVolumeCc!);
  if (query.interiorMaterial) result = result.filter((item) => item.interiorMaterial === query.interiorMaterial);
  if (query.hasSunroof) result = result.filter((item) => item.hasSunroof === true);
  if (query.creditAvailable) result = result.filter((item) => item.creditAvailable === true);
  if (query.barterAvailable) result = result.filter((item) => item.barterAvailable === true);
  if (query.vinProvided) result = result.filter((item) => item.vinProvided === true);
  if (query.seatHeating) result = result.filter((item) => item.seatHeating === true);
  if (query.seatCooling) result = result.filter((item) => item.seatCooling === true);
  if (query.camera360) result = result.filter((item) => item.camera360 === true);
  if (query.parkingSensors) result = result.filter((item) => item.parkingSensors === true);
  if (query.adaptiveCruise) result = result.filter((item) => item.adaptiveCruise === true);
  if (query.laneAssist) result = result.filter((item) => item.laneAssist === true);
  if (query.maxOwnersCount) result = result.filter((item) => (item.ownersCount ?? 99) <= query.maxOwnersCount!);
  if (query.hasServiceBook) result = result.filter((item) => item.hasServiceBook === true);
  if (query.hasRepairHistory) result = result.filter((item) => item.hasRepairHistory === true);

  switch (query.sort) {
    case "price_asc":
      result.sort((a, b) => a.priceAzn - b.priceAzn);
      break;
    case "price_desc":
      result.sort((a, b) => b.priceAzn - a.priceAzn);
      break;
    case "year_desc":
      result.sort((a, b) => b.year - a.year);
      break;
    case "trust_desc":
      result.sort((a, b) => b.trustScore - a.trustScore);
      break;
    case "mileage_asc":
      result.sort((a, b) => a.mileageKm - b.mileageKm);
      break;
    default:
      result.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  const start = (page - 1) * pageSize;
  return result.slice(start, start + pageSize);
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
    const sortMap: Record<string, string> = {
      price_asc: "l.price_azn ASC",
      price_desc: "l.price_azn DESC",
      year_desc: "l.year DESC",
      mileage_asc: "l.mileage_km ASC",
      trust_desc: "COALESCE(ts.trust_score, 50) DESC",
      recent: `${planOrder}, l.created_at DESC`
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
    const fallbackItems = [...getCreatedListings(), ...demoListings];
    const filtered = filterDemo(fallbackItems, query);
    return {
      items: filtered,
      total: filterDemo(fallbackItems, { ...query, page: 1, pageSize: 999 }).length,
      page,
      pageSize
    };
  }
}

export async function getListingDetail(id: string): Promise<ListingDetail | null> {
  try {
    await ensureSeedData();
    const pool = getPgPool();
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
          COALESCE(NULLIF(ou.phone, ''), NULLIF(ou.phone_normalized, ''), NULLIF(dpu.phone, ''), NULLIF(dpu.phone_normalized, '')) AS contact_phone,
          CASE
            WHEN dp.id IS NOT NULL AND COALESCE(dp.show_whatsapp, FALSE) = TRUE AND NULLIF(BTRIM(dp.whatsapp_phone), '') IS NOT NULL
              THEN dp.whatsapp_phone
            ELSE COALESCE(NULLIF(ou.phone, ''), NULLIF(ou.phone_normalized, ''), NULLIF(dpu.phone, ''), NULLIF(dpu.phone_normalized, ''))
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

    const serviceRows = await pool.query<ServiceRecordRow>(
      `
        SELECT id, source_type, service_date, mileage_km, summary
        FROM listing_service_records
        WHERE listing_id = $1
        ORDER BY service_date DESC
      `,
      [id]
    );

    const mediaRows = await pool.query<{ url: string }>(
      `
        SELECT url
        FROM listing_media
        WHERE listing_id = $1 AND media_type = 'image'
        ORDER BY sort_order ASC
        LIMIT 24
      `,
      [id]
    );

    const relatedRows = await pool.query<{ id: string }>(
      `
        SELECT id
        FROM listings
        WHERE id <> $1 AND status = 'active' AND (make = $2 OR city = $3)
        ORDER BY created_at DESC
        LIMIT 3
      `,
      [id, row.make, row.city]
    );

    const mediaUrls = mediaRows.rows.map((entry) => entry.url);

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
    const found = getCreatedListings().find((item) => item.id === id) ?? null;
    if (found) return found;
    const demo = demoListingsDetailed.find((item) => item.id === id);
    if (!demo) return null;
    return { ...demo, mediaUrls: demo.imageUrl ? [demo.imageUrl] : [] };
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

    const imageUrls = (input.imageUrls ?? [])
      .map(sanitizeMediaUrl)
      .filter((entry): entry is string => Boolean(entry))
      .slice(0, 24);
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
    return [...getCreatedListings(), ...demoListings].filter((item) => ids.includes(item.id));
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
    return getCreatedListings().filter((item) => item.ownerUserId === userId || item.dealerProfileId === "dealer-1");
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
    return getCreatedListings().filter(
      (item) =>
        (item.ownerUserId === userId || item.dealerProfileId === "dealer-1") &&
        (item.planType ?? "free") === "free" &&
        (item.listingKind ?? "vehicle") === "vehicle" &&
        (item.status === "active" || item.status === "pending_review")
    ).length;
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

export function createListingFallback(input: {
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
}): { id: string } {
  const id = randomUUID();
  const status = input.status ?? "active";
  const planType = input.planType ?? "free";
  const planExpiresAt = status === "active" ? calculatePlanExpiry(planType) : null;
  const item: ListingDetail = {
    id,
    listingKind: input.listingKind ?? "vehicle",
    partCategory: input.partCategory,
    partSubcategory: input.partSubcategory,
    partBrand: input.partBrand,
    partCondition: input.partCondition,
    partAuthenticity: input.partAuthenticity,
    partOemCode: input.partOemCode,
    partSku: input.partSku,
    partQuantity: input.partQuantity,
    partCompatibility: input.partCompatibility,
    title: input.title,
    description: input.description,
    priceAzn: input.priceAzn,
    city: input.city,
    year: input.year,
    mileageKm: input.mileageKm,
    fuelType: input.fuelType,
    engineType: input.engineType,
    transmission: input.transmission,
    make: input.make,
    model: input.model,
    vin: input.vin,
    status,
    sellerType: input.sellerType,
    bodyType: input.bodyType,
    driveType: input.driveType,
    color: input.color,
    condition: input.condition,
    engineVolumeCc: input.engineVolumeCc,
    interiorMaterial: input.interiorMaterial,
    hasSunroof: input.hasSunroof,
    creditAvailable: input.creditAvailable,
    barterAvailable: input.barterAvailable,
    vinProvided: input.vinProvided ?? Boolean(input.vin),
    seatHeating: input.seatHeating,
    seatCooling: input.seatCooling,
    camera360: input.camera360,
    parkingSensors: input.parkingSensors,
    adaptiveCruise: input.adaptiveCruise,
    laneAssist: input.laneAssist,
    ownersCount: input.ownersCount,
    hasServiceBook: input.hasServiceBook,
    hasRepairHistory: input.hasRepairHistory,
    ownerUserId: input.ownerUserId,
    dealerProfileId: input.dealerProfileId,
    planType,
    planExpiresAt: planExpiresAt?.toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    trustScore: input.trust.trustScore,
    vinVerified: input.trust.vinVerified,
    sellerVerified: input.trust.sellerVerified,
    mediaComplete: input.trust.mediaComplete,
    mileageFlagSeverity: input.trust.mileageFlagSeverity as ListingDetail["mileageFlagSeverity"],
    mileageFlagMessage: input.trust.mileageFlagMessage,
    serviceHistorySummary: input.trust.serviceHistorySummary,
    riskSummary: input.trust.riskSummary,
    lastVerifiedAt: new Date().toISOString(),
    priceInsight: inferPriceInsight(input.priceAzn),
    imageUrl: input.imageUrls?.[0],
    mediaUrls: input.imageUrls ?? [],
    serviceRecords: [],
    relatedIds: []
  };
  getCreatedListings().unshift(item);
  return { id };
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
    const listing = getCreatedListings().find((item) => item.id === listingId) ?? null;
    if (!listing) return { listing: null, isOwner: false };
    const isOwner = listing.ownerUserId === userId;
    return { listing, isOwner };
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
    const listing = getCreatedListings().find((item) => item.id === listingId);
    if (!listing) return { ok: false, error: "Elan tapılmadı" };
    if (listing.ownerUserId !== userId) {
      return { ok: false, error: "Bu elanı redaktə etmə icazəniz yoxdur" };
    }
    const planExpiresAt = calculatePlanExpiry(planType);
    listing.planType = planType;
    listing.planExpiresAt = options?.activate ? undefined : planExpiresAt.toISOString();
    if (options?.activate) listing.status = "pending_review";
    listing.updatedAt = new Date().toISOString();
    return { ok: true };
  }
}

export async function updateListingPlan(
  listingId: string,
  userId: string,
  planType: PlanType
): Promise<{ ok: boolean; error?: string }> {
  return applyListingPlanForOwner(listingId, userId, planType);
}
