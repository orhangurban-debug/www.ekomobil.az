import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { DEALER_PLANS, type DealerPlan, type DealerPlanId } from "@/lib/dealer-plans";
import { PARTS_STORE_PLANS, type PartsStorePlan, type PartsStorePlanId } from "@/lib/parts-store-plans";
import { getPricingPlanAdminConfig } from "@/server/system-settings-store";

export type BusinessType = "dealer" | "parts_store";

interface SubscriptionRow {
  id?: string;
  owner_user_id?: string;
  owner_email?: string;
  business_type: BusinessType;
  plan_id: string;
  status: string;
  starts_at: Date | null;
  expires_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface BusinessPlanSubscriptionRecord {
  id: string;
  ownerUserId: string;
  ownerEmail?: string;
  businessType: BusinessType;
  planId: string;
  status: "active" | "expired" | "cancelled";
  startsAt?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessProfileEntitlements {
  canUseDescription: boolean;
  canUseLogo: boolean;
  canUseCover: boolean;
  canUseWhatsapp: boolean;
  canUseWebsite: boolean;
  canUseAddress: boolean;
  canUseWorkingHours: boolean;
}

function dealerPlanFromTier(tier: string | undefined): DealerPlanId {
  if (tier === "enterprise") return "korporativ";
  if (tier === "pro") return "peşəkar";
  return "baza";
}

function partsPlanFromTier(tier: string | undefined): PartsStorePlanId {
  if (tier === "enterprise") return "şəbəkə";
  if (tier === "pro") return "peşəkar";
  return "baza";
}

export async function getDealerPlanCatalog(): Promise<DealerPlan[]> {
  const cfg = await getPricingPlanAdminConfig();
  return DEALER_PLANS.map((plan) => {
    const override = cfg.dealer[plan.id];
    if (!override) return plan;
    return {
      ...plan,
      nameAz: override.nameAz ?? plan.nameAz,
      priceAzn: override.priceAzn ?? plan.priceAzn,
      maxActiveListings: override.maxActiveListings ?? plan.maxActiveListings,
      perListingMaxImages: override.perListingMaxImages ?? plan.perListingMaxImages,
      maxVideosPerListing: override.maxVideosPerListing ?? plan.maxVideosPerListing,
      csvImportEnabled: override.csvImportEnabled ?? plan.csvImportEnabled,
      analyticsEnabled: override.analyticsEnabled ?? plan.analyticsEnabled,
      leadInboxLimit: override.leadInboxLimit === undefined ? plan.leadInboxLimit : override.leadInboxLimit,
      gracePeriodDays: override.gracePeriodDays ?? plan.gracePeriodDays,
      features: override.features && override.features.length > 0 ? override.features : plan.features
    };
  });
}

export async function getPartsPlanCatalog(): Promise<PartsStorePlan[]> {
  const cfg = await getPricingPlanAdminConfig();
  return PARTS_STORE_PLANS.map((plan) => {
    const override = cfg.parts[plan.id];
    if (!override) return plan;
    return {
      ...plan,
      nameAz: override.nameAz ?? plan.nameAz,
      priceAzn: override.priceAzn ?? plan.priceAzn,
      maxActiveListings: override.maxActiveListings ?? plan.maxActiveListings,
      perListingMaxImages: override.perListingMaxImages ?? plan.perListingMaxImages,
      analyticsEnabled: override.analyticsEnabled ?? plan.analyticsEnabled,
      gracePeriodDays: override.gracePeriodDays ?? plan.gracePeriodDays,
      features: override.features && override.features.length > 0 ? override.features : plan.features
    };
  });
}

async function getDealerFallbackPlan(): Promise<DealerPlan> {
  const catalog = await getDealerPlanCatalog();
  const fallback = dealerPlanFromTier(process.env.DEFAULT_DEALER_PLAN_TIER);
  return catalog.find((p) => p.id === fallback) ?? catalog[0];
}

async function getPartsFallbackPlan(): Promise<PartsStorePlan> {
  const catalog = await getPartsPlanCatalog();
  const fallback = partsPlanFromTier(process.env.DEFAULT_PARTS_PLAN_TIER);
  return catalog.find((p) => p.id === fallback) ?? catalog[0];
}

async function getActiveSubscription(userId: string, businessType: BusinessType): Promise<SubscriptionRow | null> {
  try {
    const pool = getPgPool();
    const result = await pool.query<SubscriptionRow>(
      `
        SELECT business_type, plan_id, status, starts_at, expires_at
        FROM business_plan_subscriptions
        WHERE owner_user_id = $1
          AND business_type = $2
          AND status = 'active'
          AND (starts_at IS NULL OR starts_at <= NOW())
          AND (expires_at IS NULL OR expires_at >= NOW())
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userId, businessType]
    );
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getEffectiveDealerPlan(userId: string): Promise<DealerPlan> {
  const catalog = await getDealerPlanCatalog();
  const fallback = await getDealerFallbackPlan();
  const sub = await getActiveSubscription(userId, "dealer");
  if (!sub) return fallback;
  return catalog.find((p) => p.id === (sub.plan_id as DealerPlanId)) ?? fallback;
}

export async function getEffectivePartsPlan(userId: string): Promise<PartsStorePlan> {
  const catalog = await getPartsPlanCatalog();
  const fallback = await getPartsFallbackPlan();
  const sub = await getActiveSubscription(userId, "parts_store");
  if (!sub) return fallback;
  return catalog.find((p) => p.id === (sub.plan_id as PartsStorePlanId)) ?? fallback;
}

function getDealerProfileEntitlements(plan: DealerPlan): BusinessProfileEntitlements {
  const proOrMore = plan.id === "peşəkar" || plan.id === "korporativ";
  const corporate = plan.id === "korporativ";
  return {
    canUseDescription: true,
    canUseLogo: true,
    canUseCover: corporate,
    canUseWhatsapp: proOrMore,
    canUseWebsite: proOrMore,
    canUseAddress: corporate,
    canUseWorkingHours: proOrMore
  };
}

function getPartsProfileEntitlements(plan: PartsStorePlan): BusinessProfileEntitlements {
  const proOrMore = plan.id === "peşəkar" || plan.id === "şəbəkə";
  const network = plan.id === "şəbəkə";
  return {
    canUseDescription: true,
    canUseLogo: true,
    canUseCover: network,
    canUseWhatsapp: proOrMore,
    canUseWebsite: proOrMore,
    canUseAddress: network,
    canUseWorkingHours: proOrMore
  };
}

export async function getEffectiveBusinessProfileEntitlements(userId: string): Promise<BusinessProfileEntitlements> {
  const [dealerPlan, partsPlan] = await Promise.all([
    getEffectiveDealerPlan(userId),
    getEffectivePartsPlan(userId)
  ]);
  const dealer = getDealerProfileEntitlements(dealerPlan);
  const parts = getPartsProfileEntitlements(partsPlan);
  return {
    canUseDescription: dealer.canUseDescription || parts.canUseDescription,
    canUseLogo: dealer.canUseLogo || parts.canUseLogo,
    canUseCover: dealer.canUseCover || parts.canUseCover,
    canUseWhatsapp: dealer.canUseWhatsapp || parts.canUseWhatsapp,
    canUseWebsite: dealer.canUseWebsite || parts.canUseWebsite,
    canUseAddress: dealer.canUseAddress || parts.canUseAddress,
    canUseWorkingHours: dealer.canUseWorkingHours || parts.canUseWorkingHours
  };
}

function mapSubRow(row: SubscriptionRow): BusinessPlanSubscriptionRecord {
  return {
    id: row.id ?? randomUUID(),
    ownerUserId: row.owner_user_id ?? "",
    ownerEmail: row.owner_email ?? undefined,
    businessType: row.business_type,
    planId: row.plan_id,
    status: (row.status as BusinessPlanSubscriptionRecord["status"]) || "active",
    startsAt: row.starts_at?.toISOString(),
    expiresAt: row.expires_at?.toISOString(),
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString()
  };
}

function isValidPlanForBusinessType(businessType: BusinessType, planId: string): boolean {
  if (businessType === "dealer") {
    return DEALER_PLANS.some((plan) => plan.id === planId);
  }
  return PARTS_STORE_PLANS.some((plan) => plan.id === planId);
}

export async function listBusinessPlanSubscriptions(limit = 200): Promise<BusinessPlanSubscriptionRecord[]> {
  try {
    const pool = getPgPool();
    const result = await pool.query<SubscriptionRow>(
      `
        SELECT
          s.id,
          s.owner_user_id,
          u.email AS owner_email,
          s.business_type,
          s.plan_id,
          s.status,
          s.starts_at,
          s.expires_at,
          s.created_at,
          s.updated_at
        FROM business_plan_subscriptions s
        LEFT JOIN users u ON u.id = s.owner_user_id
        ORDER BY s.updated_at DESC
        LIMIT $1
      `,
      [limit]
    );
    return result.rows.map(mapSubRow);
  } catch {
    return [];
  }
}

export async function upsertBusinessPlanSubscription(input: {
  ownerUserId: string;
  businessType: BusinessType;
  planId: string;
  status: "active" | "expired" | "cancelled";
  startsAt?: string;
  expiresAt?: string;
}): Promise<BusinessPlanSubscriptionRecord> {
  if (!isValidPlanForBusinessType(input.businessType, input.planId)) {
    throw new Error("Plan növü seçilmiş biznes tipinə uyğun deyil.");
  }

  const pool = getPgPool();
  const existing = await pool.query<SubscriptionRow>(
    `
      SELECT id, owner_user_id, business_type, plan_id, status, starts_at, expires_at, created_at, updated_at
      FROM business_plan_subscriptions
      WHERE owner_user_id = $1 AND business_type = $2
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [input.ownerUserId, input.businessType]
  );
  const current = existing.rows[0];
  const id = current?.id ?? randomUUID();

  const result = await pool.query<SubscriptionRow>(
    `
      INSERT INTO business_plan_subscriptions
        (id, owner_user_id, business_type, plan_id, status, starts_at, expires_at, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        status = EXCLUDED.status,
        starts_at = EXCLUDED.starts_at,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
      RETURNING
        id, owner_user_id, business_type, plan_id, status, starts_at, expires_at, created_at, updated_at
    `,
    [
      id,
      input.ownerUserId,
      input.businessType,
      input.planId,
      input.status,
      input.startsAt ?? null,
      input.expiresAt ?? null
    ]
  );

  return mapSubRow(result.rows[0]);
}
