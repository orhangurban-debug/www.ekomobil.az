import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { DEALER_PLANS, type DealerPlan, type DealerPlanId } from "@/lib/dealer-plans";
import { PARTS_STORE_PLANS, type PartsStorePlan, type PartsStorePlanId } from "@/lib/parts-store-plans";

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

function getDealerFallbackPlan(): DealerPlan {
  const fallback = dealerPlanFromTier(process.env.DEFAULT_DEALER_PLAN_TIER);
  return DEALER_PLANS.find((p) => p.id === fallback) ?? DEALER_PLANS[0];
}

function getPartsFallbackPlan(): PartsStorePlan {
  const fallback = partsPlanFromTier(process.env.DEFAULT_PARTS_PLAN_TIER);
  return PARTS_STORE_PLANS.find((p) => p.id === fallback) ?? PARTS_STORE_PLANS[0];
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
  const sub = await getActiveSubscription(userId, "dealer");
  if (!sub) return getDealerFallbackPlan();
  return DEALER_PLANS.find((p) => p.id === (sub.plan_id as DealerPlanId)) ?? getDealerFallbackPlan();
}

export async function getEffectivePartsPlan(userId: string): Promise<PartsStorePlan> {
  const sub = await getActiveSubscription(userId, "parts_store");
  if (!sub) return getPartsFallbackPlan();
  return PARTS_STORE_PLANS.find((p) => p.id === (sub.plan_id as PartsStorePlanId)) ?? getPartsFallbackPlan();
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
