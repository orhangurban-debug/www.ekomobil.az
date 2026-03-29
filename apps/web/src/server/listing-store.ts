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
    listingKind: row.listing_kind === "part" ? "part" : "vehicle",
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

  if (query.city && query.city !== "Hamısı") result = result.filter((item) => item.city === query.city);
  if (query.make && query.make !== "Hamısı") result = result.filter((item) => item.make === query.make);
  if (query.search) {
    const needle = query.search.toLowerCase();
    result = result.filter((item) => `${item.make} ${item.model} ${item.title}`.toLowerCase().includes(needle));
  }
  if (query.compareIds && query.compareIds.length > 0) {
    result = result.filter((item) => query.compareIds!.includes(item.id));
  }
  if (query.fuelType) result = result.filter((item) => item.fuelType === query.fuelType);
  if (query.transmission) result = result.filter((item) => item.transmission === query.transmission);
  if (query.minPrice) result = result.filter((item) => item.priceAzn >= query.minPrice!);
  if (query.maxPrice) result = result.filter((item) => item.priceAzn <= query.maxPrice!);
  if (query.minYear) result = result.filter((item) => item.year >= query.minYear!);
  if (query.maxYear) result = result.filter((item) => item.year <= query.maxYear!);
  if (query.vinVerified) result = result.filter((item) => item.vinVerified);
  if (query.sellerVerified) result = result.filter((item) => item.sellerVerified);
  if (query.sellerType) result = result.filter((item) => item.sellerType === query.sellerType);
  if (query.minMileage) result = result.filter((item) => item.mileageKm >= query.minMileage!);
  if (query.maxMileage) result = result.filter((item) => item.mileageKm <= query.maxMileage!);
  if (query.bodyType) result = result.filter((item) => item.bodyType === query.bodyType);
  if (query.driveType) result = result.filter((item) => item.driveType === query.driveType);
  if (query.color) result = result.filter((item) => item.color === query.color);
  if (query.condition) result = result.filter((item) => item.condition === query.condition);

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

    if (query.city && query.city !== "Hamısı") {
      values.push(query.city);
      where.push(`l.city = $${values.length}`);
    }
    if (query.make && query.make !== "Hamısı") {
      values.push(query.make);
      where.push(`l.make = $${values.length}`);
    }
    if (query.search) {
      values.push(`%${query.search.toLowerCase()}%`);
      where.push(`LOWER(l.title || ' ' || l.make || ' ' || l.model) LIKE $${values.length}`);
    }
    if (query.compareIds && query.compareIds.length > 0) {
      values.push(query.compareIds);
      where.push(`l.id = ANY($${values.length}::text[])`);
    }
    if (query.fuelType) {
      values.push(query.fuelType);
      where.push(`l.fuel_type = $${values.length}`);
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
          l.id, l.title, l.description, l.price_azn, l.city, l.year, l.mileage_km, l.fuel_type,
          l.transmission, l.make, l.model, l.vin, l.status, l.seller_type, l.owner_user_id, l.dealer_profile_id,
          l.body_type, l.drive_type, l.color, l.condition,
          l.listing_kind,
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
          l.id, l.title, l.description, l.price_azn, l.city, l.year, l.mileage_km, l.fuel_type,
          l.transmission, l.make, l.model, l.vin, l.status, l.seller_type, l.owner_user_id, l.dealer_profile_id,
          l.body_type, l.drive_type, l.color, l.condition,
          l.listing_kind,
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

    return {
      ...mapRowToSummary(row),
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
    return getCreatedListings().find((item) => item.id === id) ?? demoListingsDetailed.find((item) => item.id === id) ?? null;
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
  transmission: string;
  vin: string;
  sellerType: "private" | "dealer";
  status?: ListingStatus;
  planType?: PlanType;
  listingKind?: ListingKind;
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
  const planExpiresAt = calculatePlanExpiry(planType);

  try {
    await ensureSeedData();
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO listings (
          id, owner_user_id, dealer_profile_id, title, description, make, model, year, city, price_azn,
          mileage_km, fuel_type, transmission, vin, seller_type, status, plan_type, plan_expires_at, listing_kind
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
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
        input.transmission,
        input.vin,
        input.sellerType,
        status,
        planType,
        planExpiresAt,
        input.listingKind ?? "vehicle"
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
          l.id, l.title, l.description, l.price_azn, l.city, l.year, l.mileage_km, l.fuel_type,
          l.transmission, l.make, l.model, l.vin, l.status, l.seller_type, l.owner_user_id, l.dealer_profile_id,
          l.body_type, l.drive_type, l.color, l.condition,
          l.listing_kind,
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
          l.id, l.title, l.description, l.price_azn, l.city, l.year, l.mileage_km, l.fuel_type,
          l.transmission, l.make, l.model, l.vin, l.status, l.seller_type, l.owner_user_id, l.dealer_profile_id,
          l.body_type, l.drive_type, l.color, l.condition,
          l.listing_kind,
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
  transmission: string;
  vin: string;
  sellerType: "private" | "dealer";
  status?: ListingStatus;
  planType?: PlanType;
  listingKind?: ListingKind;
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
  const planExpiresAt = calculatePlanExpiry(planType);
  const item: ListingDetail = {
    id,
    listingKind: input.listingKind ?? "vehicle",
    title: input.title,
    description: input.description,
    priceAzn: input.priceAzn,
    city: input.city,
    year: input.year,
    mileageKm: input.mileageKm,
    fuelType: input.fuelType,
    transmission: input.transmission,
    make: input.make,
    model: input.model,
    vin: input.vin,
    status,
    sellerType: input.sellerType,
    ownerUserId: input.ownerUserId,
    dealerProfileId: input.dealerProfileId,
    planType,
    planExpiresAt: planExpiresAt.toISOString(),
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
           plan_expires_at = $2,
           status = CASE WHEN $4 THEN 'active' ELSE status END,
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
    listing.planExpiresAt = planExpiresAt.toISOString();
    if (options?.activate) listing.status = "active";
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
