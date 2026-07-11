import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { LeadRecord, ListingSummary } from "@/lib/marketplace-types";
import { ensureSeedData } from "@/server/bootstrap-seed";
import { createListingRecord, inferPriceInsight } from "@/server/listing-store";
import type { BusinessProfileEntitlements } from "@/server/business-plan-store";
import {
  createLeadForListing,
  listLeadsForDealerProfile,
  updateLeadStage as updateLeadStageCore
} from "@/server/business-leads-store";
import { getEffectiveDealerPlan } from "@/server/business-plan-store";
import { isDealerListingStale } from "@/lib/dealer-plans";

interface DealerProfileRow {
  id: string;
  owner_user_id: string | null;
  name: string;
  city: string;
  verified: boolean;
  response_sla_minutes: number;
  logo_url?: string | null;
  cover_url?: string | null;
  description?: string | null;
  whatsapp_phone?: string | null;
  website_url?: string | null;
  address?: string | null;
  working_hours?: string | null;
  show_whatsapp?: boolean | null;
  show_website?: boolean | null;
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
  dealerName: string | null;
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
        SELECT id, owner_user_id, name, city, verified, response_sla_minutes
        FROM dealer_profiles
        WHERE owner_user_id = $1
        LIMIT 1
      `,
      [userId]
    );
    const dealer = dealerResult.rows[0];
    if (!dealer) {
      // Profile not yet created — happens for dealers who existed before B-1 fix
      return { dealerName: null, city: "Bakı", verified: false, inventory: [], leads: [] };
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
      part_category: string | null;
      part_subcategory: string | null;
      part_brand: string | null;
      part_condition: "new" | "used" | "refurbished" | null;
      part_authenticity: "original" | "oem" | "aftermarket" | null;
      part_oem_code: string | null;
      part_sku: string | null;
      part_quantity: number | null;
      part_compatibility: string | null;
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
          l.plan_type, l.listing_kind, l.part_category, l.part_subcategory, l.part_brand, l.part_condition, l.part_authenticity,
          l.part_oem_code, l.part_sku, l.part_quantity, l.part_compatibility, l.created_at, l.updated_at,
          ts.trust_score, ts.vin_verified, ts.seller_verified, ts.media_complete
        FROM listings l
        LEFT JOIN listing_trust_signals ts ON ts.listing_id = l.id
        WHERE l.dealer_profile_id = $1
        ORDER BY l.created_at DESC
      `,
      [dealer.id]
    );

    const leads = await listLeadsForDealerProfile(dealer.id);

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
        partCategory: row.part_category ?? undefined,
        partSubcategory: row.part_subcategory ?? undefined,
        partBrand: row.part_brand ?? undefined,
        partCondition: row.part_condition ?? undefined,
        partAuthenticity: row.part_authenticity ?? undefined,
        partOemCode: row.part_oem_code ?? undefined,
        partSku: row.part_sku ?? undefined,
        partQuantity: row.part_quantity ?? undefined,
        partCompatibility: row.part_compatibility ?? undefined,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        trustScore: row.trust_score ?? 50,
        vinVerified: row.vin_verified ?? false,
        sellerVerified: row.seller_verified ?? false,
        mediaComplete: row.media_complete ?? false,
        priceInsight: row.listing_kind === "part" ? undefined : inferPriceInsight(row.price_azn)
      })),
      leads
    };
  } catch (error) {
    console.error("getDealerDashboard failed:", error);
    return {
      dealerName: "Dealer hesabı tapılmadı",
      city: "",
      verified: false,
      inventory: [],
      leads: []
    };
  }
}

export async function getDealerProfileIdForUser(userId: string): Promise<string | null> {
  const pool = getPgPool();
  const result = await pool.query<{ id: string }>(
    "SELECT id FROM dealer_profiles WHERE owner_user_id = $1 LIMIT 1",
    [userId]
  );
  return result.rows[0]?.id ?? null;
}

export async function updateLeadStage(input: {
  leadId: string;
  stage: LeadRecord["stage"];
  note?: string;
  dealerProfileId?: string;
}): Promise<boolean> {
  return updateLeadStageCore({
    leadId: input.leadId,
    stage: input.stage,
    note: input.note,
    dealerProfileId: input.dealerProfileId
  });
}

export async function refreshDealerListingInventory(userId: string, listingId: string): Promise<boolean> {
  await ensureSeedData();
  const pool = getPgPool();
  const result = await pool.query(
    `UPDATE listings l
     SET inventory_refreshed_at = NOW(), updated_at = NOW()
     FROM dealer_profiles dp
     WHERE l.id = $2
       AND l.dealer_profile_id = dp.id
       AND dp.owner_user_id = $1`,
    [userId, listingId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function countStaleDealerListings(userId: string): Promise<number> {
  await ensureSeedData();
  const plan = await getEffectiveDealerPlan(userId);
  const pool = getPgPool();
  const result = await pool.query<{ inventory_refreshed_at: Date | null; updated_at: Date; created_at: Date }>(
    `SELECT l.inventory_refreshed_at, l.updated_at, l.created_at
     FROM listings l
     JOIN dealer_profiles dp ON dp.id = l.dealer_profile_id
     WHERE dp.owner_user_id = $1
       AND l.status = 'active'
       AND COALESCE(l.listing_kind, 'vehicle') = 'vehicle'`,
    [userId]
  );
  return result.rows.filter((row) =>
    isDealerListingStale(row.inventory_refreshed_at ?? row.updated_at ?? row.created_at, plan)
  ).length;
}

export { createLeadForListing };

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

  const parseBoolean = (value: string): boolean | undefined => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    return ["1", "true", "var", "bəli", "yes"].includes(normalized);
  };
  const parseNumber = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : undefined;
  };

  let created = 0;
  const errors: string[] = [];
  for (const [index, row] of rows.entries()) {
    const parts = row.split(",").map((item) => item.trim());
    const get = (key: string) => parts[columns.indexOf(key)] || "";
    const getOptional = (key: string) => (columns.includes(key) ? get(key).trim() || undefined : undefined);
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
        engineType: getOptional("engineType"),
        transmission: get("transmission"),
        vin,
        sellerType: "dealer",
        status: "pending_review",
        bodyType: getOptional("bodyType"),
        driveType: getOptional("driveType"),
        color: getOptional("color"),
        condition: getOptional("condition"),
        engineVolumeCc: getOptional("engineVolumeCc") !== undefined ? parseNumber(get("engineVolumeCc")) : undefined,
        interiorMaterial: getOptional("interiorMaterial"),
        hasSunroof: getOptional("hasSunroof") !== undefined ? parseBoolean(get("hasSunroof")) : undefined,
        creditAvailable: getOptional("creditAvailable") !== undefined ? parseBoolean(get("creditAvailable")) : undefined,
        barterAvailable: getOptional("barterAvailable") !== undefined ? parseBoolean(get("barterAvailable")) : undefined,
        seatHeating: getOptional("seatHeating") !== undefined ? parseBoolean(get("seatHeating")) : undefined,
        seatCooling: getOptional("seatCooling") !== undefined ? parseBoolean(get("seatCooling")) : undefined,
        camera360: getOptional("camera360") !== undefined ? parseBoolean(get("camera360")) : undefined,
        parkingSensors: getOptional("parkingSensors") !== undefined ? parseBoolean(get("parkingSensors")) : undefined,
        adaptiveCruise: getOptional("adaptiveCruise") !== undefined ? parseBoolean(get("adaptiveCruise")) : undefined,
        laneAssist: getOptional("laneAssist") !== undefined ? parseBoolean(get("laneAssist")) : undefined,
        ownersCount: getOptional("ownersCount") !== undefined ? parseNumber(get("ownersCount")) : undefined,
        hasServiceBook: getOptional("hasServiceBook") !== undefined ? parseBoolean(get("hasServiceBook")) : undefined,
        hasRepairHistory: getOptional("hasRepairHistory") !== undefined ? parseBoolean(get("hasRepairHistory")) : undefined,
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

// ── Public profile ─────────────────────────────────────────────────────────

export interface PublicDealerProfile {
  id: string;
  name: string;
  city: string;
  verified: boolean;
  responseSlaMinutes: number;
  activeListingCount: number;
  memberSince: string | null;
  logoUrl?: string;
  coverUrl?: string;
  description?: string;
  whatsappPhone?: string;
  websiteUrl?: string;
  address?: string;
  workingHours?: string;
  showWhatsapp: boolean;
  showWebsite: boolean;
  voen?: string | null;
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
      logo_url: string | null; cover_url: string | null; description: string | null;
      whatsapp_phone: string | null; website_url: string | null;
      address: string | null; working_hours: string | null;
      show_whatsapp: boolean | null; show_website: boolean | null;
      voen: string | null;
    }>(
      `SELECT id, name, city, verified, response_sla_minutes, created_at,
              logo_url, cover_url, description, whatsapp_phone, website_url,
              address, working_hours, show_whatsapp, show_website, voen
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
      listing_kind: string | null; part_category: string | null; part_subcategory: string | null;
      part_brand: string | null; part_condition: "new" | "used" | "refurbished" | null;
      part_authenticity: "original" | "oem" | "aftermarket" | null;
      part_oem_code: string | null; part_sku: string | null; part_quantity: number | null;
      part_compatibility: string | null; created_at: Date; updated_at: Date;
      trust_score: number | null; vin_verified: boolean | null;
      seller_verified: boolean | null; media_complete: boolean | null;
    }>(
      `SELECT l.id, l.title, l.description, l.price_azn, l.city, l.year,
              l.mileage_km, l.fuel_type, l.transmission, l.make, l.model,
              l.vin, l.status, l.seller_type, l.owner_user_id, l.dealer_profile_id,
              l.plan_type, l.listing_kind, l.part_category, l.part_subcategory, l.part_brand, l.part_condition, l.part_authenticity,
              l.part_oem_code, l.part_sku, l.part_quantity, l.part_compatibility, l.created_at, l.updated_at,
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
      partCategory: r.part_category ?? undefined,
      partSubcategory: r.part_subcategory ?? undefined,
      partBrand: r.part_brand ?? undefined,
      partCondition: r.part_condition ?? undefined,
      partAuthenticity: r.part_authenticity ?? undefined,
      partOemCode: r.part_oem_code ?? undefined,
      partSku: r.part_sku ?? undefined,
      partQuantity: r.part_quantity ?? undefined,
      partCompatibility: r.part_compatibility ?? undefined,
      vin: r.vin,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      trustScore: r.trust_score ?? 50,
      vinVerified: r.vin_verified ?? false,
      sellerVerified: r.seller_verified ?? false,
      mediaComplete: r.media_complete ?? false,
      priceInsight: r.listing_kind === "part" ? undefined : inferPriceInsight(r.price_azn)
    }));

    return {
      id: dealer.id, name: dealer.name, city: dealer.city,
      verified: dealer.verified, responseSlaMinutes: dealer.response_sla_minutes,
      activeListingCount: inventory.length,
      memberSince: dealer.created_at?.toISOString() ?? null,
      logoUrl: dealer.logo_url ?? undefined,
      coverUrl: dealer.cover_url ?? undefined,
      description: dealer.description ?? undefined,
      whatsappPhone: dealer.whatsapp_phone ?? undefined,
      websiteUrl: dealer.website_url ?? undefined,
      address: dealer.address ?? undefined,
      voen: dealer.voen,
      workingHours: dealer.working_hours ?? undefined,
      showWhatsapp: dealer.show_whatsapp ?? false,
      showWebsite: dealer.show_website ?? false,
      inventory
    };
  } catch (error) {
    console.error("getPublicDealerProfile failed:", error);
    return null;
  }
}

export interface PublicDealerSummary {
  id: string;
  name: string;
  city: string;
  verified: boolean;
  responseSlaMinutes: number;
  activeListingCount: number;
  logoUrl?: string;
  description?: string;
}

export async function listPublicDealers(
  limitOrFilter: number | { limit?: number; city?: string; verified?: boolean } = 50
): Promise<PublicDealerSummary[]> {
  const filter = typeof limitOrFilter === "number" ? { limit: limitOrFilter } : limitOrFilter;
  const limit = filter.limit ?? 50;
  try {
    const pool = getPgPool();
    const values: unknown[] = [];
    const where: string[] = [];
    if (filter.city && filter.city !== "Hamısı") {
      values.push(filter.city);
      where.push(`dp.city = $${values.length}`);
    }
    if (filter.verified !== undefined) {
      values.push(filter.verified);
      where.push(`dp.verified = $${values.length}`);
    }
    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    values.push(limit);
    const result = await pool.query<{
      id: string; name: string; city: string; verified: boolean;
      response_sla_minutes: number; logo_url: string | null; description: string | null;
      active_listing_count: number;
    }>(
      `SELECT dp.id, dp.name, dp.city, dp.verified, dp.response_sla_minutes,
              dp.logo_url, dp.description,
              COUNT(l.id)::int AS active_listing_count
       FROM dealer_profiles dp
       LEFT JOIN listings l ON l.dealer_profile_id = dp.id AND l.status = 'active'
       ${whereSql}
       GROUP BY dp.id
       ORDER BY dp.verified DESC, active_listing_count DESC, dp.name ASC
       LIMIT $${values.length}`,
      values
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      verified: row.verified,
      responseSlaMinutes: row.response_sla_minutes,
      activeListingCount: row.active_listing_count,
      logoUrl: row.logo_url ?? undefined,
      description: row.description ?? undefined
    }));
  } catch (error) {
    console.error("listPublicDealers failed:", error);
    return [];
  }
}

export interface DealerProfileSettings {
  dealerId: string;
  ownerUserId: string;
  name: string;
  city: string;
  logoUrl?: string;
  coverUrl?: string;
  description?: string;
  whatsappPhone?: string;
  websiteUrl?: string;
  address?: string;
  workingHours?: string;
  showWhatsapp: boolean;
  showWebsite: boolean;
}

export async function getDealerProfileSettingsForOwner(userId: string): Promise<DealerProfileSettings | null> {
  await ensureSeedData();
  const pool = getPgPool();
  const result = await pool.query<DealerProfileRow>(
    `
      SELECT
        id, owner_user_id, name, city, verified, response_sla_minutes,
        logo_url, cover_url, description, whatsapp_phone, website_url,
        address, working_hours, show_whatsapp, show_website
      FROM dealer_profiles
      WHERE owner_user_id = $1
      LIMIT 1
    `,
    [userId]
  );
  const row = result.rows[0];
  if (!row || !row.owner_user_id) return null;
  return {
    dealerId: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    city: row.city,
    logoUrl: row.logo_url ?? undefined,
    coverUrl: row.cover_url ?? undefined,
    description: row.description ?? undefined,
    whatsappPhone: row.whatsapp_phone ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    address: row.address ?? undefined,
    workingHours: row.working_hours ?? undefined,
    showWhatsapp: row.show_whatsapp ?? false,
    showWebsite: row.show_website ?? false
  };
}

function normalizePhone(raw?: string): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  return v.replace(/[^\d+]/g, "");
}

function normalizeUrl(raw?: string): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export async function updateDealerProfileSettings(input: {
  ownerUserId: string;
  name?: string;
  city?: string;
  logoUrl?: string;
  coverUrl?: string;
  description?: string;
  whatsappPhone?: string;
  websiteUrl?: string;
  address?: string;
  workingHours?: string;
  showWhatsapp?: boolean;
  showWebsite?: boolean;
  entitlements: BusinessProfileEntitlements;
}): Promise<DealerProfileSettings | null> {
  await ensureSeedData();
  const pool = getPgPool();

  const current = await getDealerProfileSettingsForOwner(input.ownerUserId);
  if (!current) return null;

  const nextLogo = input.entitlements.canUseLogo ? normalizeUrl(input.logoUrl) ?? null : null;
  const nextCover = input.entitlements.canUseCover ? normalizeUrl(input.coverUrl) ?? null : null;
  const nextDescription = input.entitlements.canUseDescription ? input.description?.trim() ?? null : null;
  const nextWhatsapp = input.entitlements.canUseWhatsapp ? normalizePhone(input.whatsappPhone) ?? null : null;
  const nextWebsite = input.entitlements.canUseWebsite ? normalizeUrl(input.websiteUrl) ?? null : null;
  const nextAddress = input.entitlements.canUseAddress ? input.address?.trim() ?? null : null;
  const nextWorkingHours = input.entitlements.canUseWorkingHours ? input.workingHours?.trim() ?? null : null;
  const nextShowWhatsapp = input.entitlements.canUseWhatsapp ? Boolean(input.showWhatsapp && nextWhatsapp) : false;
  const nextShowWebsite = input.entitlements.canUseWebsite ? Boolean(input.showWebsite && nextWebsite) : false;

  await pool.query(
    `
      UPDATE dealer_profiles
      SET
        name = COALESCE($2, name),
        city = COALESCE($3, city),
        logo_url = $4,
        cover_url = $5,
        description = $6,
        whatsapp_phone = $7,
        website_url = $8,
        address = $9,
        working_hours = $10,
        show_whatsapp = $11,
        show_website = $12
      WHERE owner_user_id = $1
    `,
    [
      input.ownerUserId,
      input.name?.trim() || null,
      input.city?.trim() || null,
      nextLogo,
      nextCover,
      nextDescription,
      nextWhatsapp,
      nextWebsite,
      nextAddress,
      nextWorkingHours,
      nextShowWhatsapp,
      nextShowWebsite
    ]
  );

  return getDealerProfileSettingsForOwner(input.ownerUserId);
}

/**
 * Salon elanı üçün əlaqə nömrəsini hesab profili və salon parametrlərindən həll edir.
 */
export async function resolveDealerListingContact(userId: string): Promise<{
  contactPhone: string;
  whatsappPhone?: string;
} | null> {
  const [userProfile, dealerProfile] = await Promise.all([
    (async () => {
      const pool = getPgPool();
      const result = await pool.query<{ phone: string | null }>(
        `SELECT phone FROM users WHERE id = $1 LIMIT 1`,
        [userId]
      );
      return result.rows[0]?.phone?.trim() || null;
    })(),
    getDealerProfileSettingsForOwner(userId)
  ]);

  if (!userProfile) return null;
  const phoneDigits = userProfile.replace(/[^\d]/g, "");
  if (phoneDigits.length < 7) return null;

  const whatsappPhone =
    dealerProfile?.showWhatsapp && dealerProfile.whatsappPhone
      ? dealerProfile.whatsappPhone.trim()
      : undefined;

  return {
    contactPhone: userProfile,
    whatsappPhone: whatsappPhone || undefined
  };
}

/**
 * Returns the dealer_profiles.id for a given user.
 * Used when creating listings to link them to the correct dealer profile.
 */
export async function getDealerProfileIdByOwner(userId: string): Promise<string | null> {
  try {
    const pool = getPgPool();
    const result = await pool.query<{ id: string }>(
      `SELECT id FROM dealer_profiles WHERE owner_user_id = $1 LIMIT 1`,
      [userId]
    );
    return result.rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Active salon abunəsi olan, amma verified=false qalan köhnə profilləri sinxronlaşdırır.
 */
export async function syncActiveDealerVerification(): Promise<number> {
  const pool = getPgPool();
  const result = await pool.query(
    `
      UPDATE dealer_profiles dp
      SET verified = TRUE
      WHERE dp.verified = FALSE
        AND EXISTS (
          SELECT 1 FROM business_plan_subscriptions s
          WHERE s.owner_user_id = dp.owner_user_id
            AND s.business_type = 'dealer'
            AND s.status = 'active'
            AND (s.expires_at IS NULL OR s.expires_at >= NOW())
        )
      RETURNING dp.id
    `
  );
  return result.rowCount ?? 0;
}

/**
 * Creates a new dealer_profiles row.
 * Called during partnership approval flow.
 */
export async function createDealerProfile(input: {
  id: string;
  ownerUserId: string;
  name: string;
  city: string;
  voen?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  description?: string | null;
  logoUrl?: string | null;
}): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `INSERT INTO dealer_profiles
       (id, owner_user_id, name, city, verified, response_sla_minutes, voen, website_url, description, logo_url)
     VALUES ($1, $2, $3, $4, false, 15, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING`,
    [
      input.id,
      input.ownerUserId,
      input.name,
      input.city,
      input.voen?.trim() || null,
      input.websiteUrl?.trim() || null,
      input.description?.trim() || null,
      input.logoUrl?.trim() || null,
    ]
  );
}
