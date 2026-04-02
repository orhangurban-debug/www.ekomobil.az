import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { demoLeads, demoListings } from "@/lib/demo-marketplace";
import { LeadRecord, ListingSummary } from "@/lib/marketplace-types";
import { ensureSeedData } from "@/server/bootstrap-seed";
import { createListingRecord } from "@/server/listing-store";

interface DealerProfileRow {
  id: string;
  name: string;
  city: string;
  verified: boolean;
  response_sla_minutes: number;
}

interface LeadRow {
  id: string;
  listing_id: string;
  dealer_profile_id: string | null;
  buyer_user_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  note: string | null;
  stage: string;
  source: string;
  response_time_minutes: number | null;
  created_at: Date;
  updated_at: Date;
}

function mapLead(row: LeadRow): LeadRecord {
  return {
    id: row.id,
    listingId: row.listing_id,
    dealerProfileId: row.dealer_profile_id ?? undefined,
    buyerUserId: row.buyer_user_id ?? undefined,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? undefined,
    customerEmail: row.customer_email ?? undefined,
    note: row.note ?? undefined,
    stage: row.stage as LeadRecord["stage"],
    source: row.source,
    responseTimeMinutes: row.response_time_minutes ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function getDealerDashboard(userId: string): Promise<{
  dealerName: string;
  city: string;
  verified: boolean;
  inventory: ListingSummary[];
  leads: LeadRecord[];
}> {
  try {
    await ensureSeedData();
    const pool = getPgPool();
    const dealerResult = await pool.query<DealerProfileRow>(
      `
        SELECT id, name, city, verified, response_sla_minutes
        FROM dealer_profiles
        WHERE owner_user_id = $1
        LIMIT 1
      `,
      [userId]
    );
    const dealer = dealerResult.rows[0];
    if (!dealer) {
      return { dealerName: "Dealer hesabı tapılmadı", city: "Bakı", verified: false, inventory: [], leads: [] };
    }

    const inventoryResult = await pool.query<{
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
      plan_type: string | null;
      listing_kind: string | null;
      created_at: Date;
      updated_at: Date;
      trust_score: number | null;
      vin_verified: boolean | null;
      seller_verified: boolean | null;
      media_complete: boolean | null;
    }>(
      `
        SELECT
          l.id, l.title, l.description, l.price_azn, l.city, l.year, l.mileage_km, l.fuel_type,
          l.transmission, l.make, l.model, l.vin, l.status, l.seller_type, l.owner_user_id, l.dealer_profile_id,
          l.plan_type, l.listing_kind, l.created_at, l.updated_at,
          ts.trust_score, ts.vin_verified, ts.seller_verified, ts.media_complete
        FROM listings l
        LEFT JOIN listing_trust_signals ts ON ts.listing_id = l.id
        WHERE l.dealer_profile_id = $1
        ORDER BY l.created_at DESC
      `,
      [dealer.id]
    );

    const leadsResult = await pool.query<LeadRow>(
      `
        SELECT *
        FROM leads
        WHERE dealer_profile_id = $1
        ORDER BY created_at DESC
      `,
      [dealer.id]
    );

    return {
      dealerName: dealer.name,
      city: dealer.city,
      verified: dealer.verified,
      inventory: inventoryResult.rows.map((row) => ({
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
        planType: (row.plan_type as ListingSummary["planType"]) ?? "free",
        listingKind: row.listing_kind === "part" ? "part" : "vehicle",
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        trustScore: row.trust_score ?? 50,
        vinVerified: row.vin_verified ?? false,
        sellerVerified: row.seller_verified ?? false,
        mediaComplete: row.media_complete ?? false,
        priceInsight: row.price_azn < 25000 ? "below_market" : row.price_azn > 35000 ? "above_market" : "market_rate"
      })),
      leads: leadsResult.rows.map(mapLead)
    };
  } catch {
    return {
      dealerName: "Eko Premium Motors",
      city: "Bakı",
      verified: true,
      inventory: demoListings.filter((item) => item.sellerType === "dealer"),
      leads: demoLeads
    };
  }
}

export async function updateLeadStage(input: {
  leadId: string;
  stage: LeadRecord["stage"];
  note?: string;
}): Promise<void> {
  await ensureSeedData();
  const pool = getPgPool();
  // Əgər lead ilk dəfə 'new' mərhələsindən çıxırsa, real cavab vaxtını yazırıq.
  // response_time_minutes = (indi − lead yaradılma tarixi) / 60 saniyə
  await pool.query(
    `
      UPDATE leads
      SET
        stage = $2,
        note  = COALESCE($3, note),
        updated_at = NOW(),
        response_time_minutes = CASE
          WHEN stage = 'new' AND $2 <> 'new' AND response_time_minutes IS NULL
          THEN ROUND(EXTRACT(EPOCH FROM (NOW() - created_at)) / 60)::integer
          ELSE response_time_minutes
        END
      WHERE id = $1
    `,
    [input.leadId, input.stage, input.note ?? null]
  );
}

export async function importDealerInventoryCsv(userId: string, csv: string): Promise<{ created: number; errors: string[] }> {
  await ensureSeedData();
  const pool = getPgPool();
  const dealerResult = await pool.query<{ id: string }>(
    "SELECT id FROM dealer_profiles WHERE owner_user_id = $1 LIMIT 1",
    [userId]
  );
  const dealerId = dealerResult.rows[0]?.id;
  if (!dealerId) {
    return { created: 0, errors: ["Dealer profile tapılmadı."] };
  }

  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { created: 0, errors: ["CSV boşdur və ya yalnız başlıq sətri var."] };
  }

  const [header, ...rows] = lines;
  const columns = header.split(",").map((item) => item.trim());
  const required = ["title", "make", "model", "year", "city", "priceAzn", "mileageKm", "fuelType", "transmission", "vin"];
  const missing = required.filter((item) => !columns.includes(item));
  if (missing.length > 0) {
    return { created: 0, errors: [`CSV başlığında çatışmayan sahələr: ${missing.join(", ")}`] };
  }

  let created = 0;
  const errors: string[] = [];
  for (const [index, row] of rows.entries()) {
    const parts = row.split(",").map((item) => item.trim());
    const get = (key: string) => parts[columns.indexOf(key)] || "";
    const vin = get("vin");
    if (!vin) {
      errors.push(`Sətir ${index + 2}: VIN tələb olunur.`);
      continue;
    }

    try {
      await createListingRecord({
        ownerUserId: userId,
        dealerProfileId: dealerId,
        title: get("title"),
        description: get("description"),
        make: get("make"),
        model: get("model"),
        year: Number(get("year")),
        city: get("city"),
        priceAzn: Number(get("priceAzn")),
        mileageKm: Number(get("mileageKm")),
        fuelType: get("fuelType"),
        transmission: get("transmission"),
        vin,
        sellerType: "dealer",
        trust: {
          // CSV yükləmə zamanı VIN DOĞRULANMIR — yalnız nömrə saxlanılır.
          // vinVerified ancaq real xarici API (CarVertical, DVX) yoxlamasından sonra true ola bilər.
          trustScore: 60,
          vinVerified: false,
          sellerVerified: true,
          mediaComplete: false,
          serviceHistorySummary: "Salon tərəfindən import edildi — VIN hələ yoxlanılmayıb",
          riskSummary: "VIN manual daxil edilib, xarici yoxlama yoxdur",
          mileageFlagSeverity: undefined,
          mileageFlagMessage: undefined
        }
      });
      created += 1;
    } catch {
      errors.push(`Sətir ${index + 2}: import mümkün olmadı.`);
    }
  }

  return { created, errors };
}

export async function createLeadForListing(input: {
  listingId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  note?: string;
  source?: string;
}): Promise<void> {
  await ensureSeedData();
  const pool = getPgPool();
  const listing = await pool.query<{ dealer_profile_id: string | null }>(
    "SELECT dealer_profile_id FROM listings WHERE id = $1 LIMIT 1",
    [input.listingId]
  );
  const source = input.source ?? "listing_detail";
  await pool.query(
    `
      INSERT INTO leads (
        id, listing_id, dealer_profile_id, customer_name, customer_phone, customer_email, note, stage, source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', $8)
    `,
    [
      randomUUID(),
      input.listingId,
      listing.rows[0]?.dealer_profile_id ?? null,
      input.customerName,
      input.customerPhone ?? null,
      input.customerEmail ?? null,
      input.note ?? null,
      source
    ]
  );
}

// ── Public profile ─────────────────────────────────────────────────────────

export interface PublicDealerProfile {
  id: string;
  name: string;
  city: string;
  verified: boolean;
  responseSlaMinutes: number;
  activeListingCount: number;
  memberSince: string | null;
  inventory: ListingSummary[];
}

export async function getPublicDealerProfile(
  dealerId: string
): Promise<PublicDealerProfile | null> {
  try {
    await ensureSeedData();
    const pool = getPgPool();

    const dealerResult = await pool.query<{
      id: string; name: string; city: string; verified: boolean;
      response_sla_minutes: number; created_at: Date | null;
    }>(
      `SELECT id, name, city, verified, response_sla_minutes, created_at
       FROM dealer_profiles WHERE id = $1 LIMIT 1`,
      [dealerId]
    );
    const dealer = dealerResult.rows[0];
    if (!dealer) return null;

    const inventoryResult = await pool.query<{
      id: string; title: string; description: string; price_azn: number;
      city: string; year: number; mileage_km: number; fuel_type: string;
      transmission: string; make: string; model: string; vin: string;
      status: string; seller_type: string; owner_user_id: string | null;
      dealer_profile_id: string | null; plan_type: string | null;
      listing_kind: string | null; created_at: Date; updated_at: Date;
      trust_score: number | null; vin_verified: boolean | null;
      seller_verified: boolean | null; media_complete: boolean | null;
    }>(
      `SELECT l.id, l.title, l.description, l.price_azn, l.city, l.year,
              l.mileage_km, l.fuel_type, l.transmission, l.make, l.model,
              l.vin, l.status, l.seller_type, l.owner_user_id, l.dealer_profile_id,
              l.plan_type, l.listing_kind, l.created_at, l.updated_at,
              ts.trust_score, ts.vin_verified, ts.seller_verified, ts.media_complete
       FROM listings l
       LEFT JOIN listing_trust_signals ts ON ts.listing_id = l.id
       WHERE l.dealer_profile_id = $1 AND l.status = 'active'
       ORDER BY CASE COALESCE(l.plan_type,'free') WHEN 'vip' THEN 1 WHEN 'standard' THEN 2 ELSE 3 END, l.created_at DESC
       LIMIT 50`,
      [dealerId]
    );

    const inventory: ListingSummary[] = inventoryResult.rows.map((r) => ({
      id: r.id, title: r.title, description: r.description,
      priceAzn: r.price_azn, city: r.city, year: r.year,
      mileageKm: r.mileage_km, fuelType: r.fuel_type,
      transmission: r.transmission, make: r.make, model: r.model,
      status: r.status as ListingSummary["status"],
      sellerType: r.seller_type as ListingSummary["sellerType"],
      dealerProfileId: r.dealer_profile_id ?? undefined,
      planType: (r.plan_type ?? "free") as ListingSummary["planType"],
      listingKind: (r.listing_kind ?? "vehicle") as ListingSummary["listingKind"],
      vin: r.vin,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      trustScore: r.trust_score ?? 50,
      vinVerified: r.vin_verified ?? false,
      sellerVerified: r.seller_verified ?? false,
      mediaComplete: r.media_complete ?? false,
      priceInsight: r.price_azn < 22000 ? "below_market" : r.price_azn > 50000 ? "above_market" : "market_rate"
    }));

    return {
      id: dealer.id, name: dealer.name, city: dealer.city,
      verified: dealer.verified, responseSlaMinutes: dealer.response_sla_minutes,
      activeListingCount: inventory.length,
      memberSince: dealer.created_at?.toISOString() ?? null,
      inventory
    };
  } catch {
    return null;
  }
}
