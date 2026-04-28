import { randomUUID } from "node:crypto";
import type { PaymentCheckoutStrategy, PaymentProviderMode, PaymentProviderPayload } from "@/lib/payments";
import { getPgPool } from "@/lib/postgres";
import { DEALER_PLANS } from "@/lib/dealer-plans";
import { PARTS_STORE_PLANS } from "@/lib/parts-store-plans";
import { type BusinessType, upsertBusinessPlanSubscription } from "@/server/business-plan-store";
import { prepareKapitalBankCheckoutSession } from "@/server/payments/kapital-bank-provider";
import { issueAndSendInvoice } from "@/server/invoice-store";
import { getUserProfile } from "@/server/user-store";

interface BusinessPlanPaymentRow {
  id: string;
  owner_user_id: string;
  business_type: BusinessType;
  plan_id: string;
  amount_azn: number;
  provider: string;
  status: string;
  checkout_url: string;
  provider_reference: string | null;
  provider_mode: string | null;
  checkout_strategy: string | null;
  provider_payload: PaymentProviderPayload | null;
  completed_at: Date | null;
  starts_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface BusinessPlanPaymentRecord {
  id: string;
  ownerUserId: string;
  businessType: BusinessType;
  planId: string;
  amountAzn: number;
  provider: "kapital_bank";
  status: "pending" | "redirect_ready" | "succeeded" | "failed" | "cancelled";
  checkoutUrl: string;
  providerReference?: string;
  providerMode?: PaymentProviderMode;
  checkoutStrategy?: PaymentCheckoutStrategy;
  providerPayload?: PaymentProviderPayload;
  completedAt?: string;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

function toRecord(row: BusinessPlanPaymentRow): BusinessPlanPaymentRecord {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    businessType: row.business_type,
    planId: row.plan_id,
    amountAzn: row.amount_azn,
    provider: "kapital_bank",
    status: row.status as BusinessPlanPaymentRecord["status"],
    checkoutUrl: row.checkout_url,
    providerReference: row.provider_reference ?? undefined,
    providerMode: (row.provider_mode as PaymentProviderMode | null) ?? undefined,
    checkoutStrategy: (row.checkout_strategy as PaymentCheckoutStrategy | null) ?? undefined,
    providerPayload: row.provider_payload ?? undefined,
    completedAt: row.completed_at?.toISOString() ?? undefined,
    startsAt: row.starts_at?.toISOString() ?? undefined,
    expiresAt: row.expires_at?.toISOString() ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function getPlanPriceAzn(businessType: BusinessType, planId: string): number | null {
  if (businessType === "dealer") {
    return DEALER_PLANS.find((item) => item.id === planId)?.priceAzn ?? null;
  }
  return PARTS_STORE_PLANS.find((item) => item.id === planId)?.priceAzn ?? null;
}

const BILLING_DAYS = 30;

export async function createBusinessPlanPayment(input: {
  ownerUserId: string;
  businessType: BusinessType;
  planId: string;
}): Promise<{ ok: true; payment: BusinessPlanPaymentRecord } | { ok: false; error: string }> {
  const amountAzn = getPlanPriceAzn(input.businessType, input.planId);
  if (!amountAzn || amountAzn <= 0) {
    return { ok: false, error: "Plan tapılmadı və ya ödəniş məbləği düzgün deyil." };
  }

  const id = randomUUID();
  let session;
  try {
    session = await prepareKapitalBankCheckoutSession({
      internalPaymentId: id,
      amountAzn,
      description: `${input.businessType} monthly subscription`,
      checkoutPagePath: `/payments/business-plan/${id}`,
      callbackPath: "/api/payments/business-plan/callback",
      successPath: `/payments/business-plan/${id}?status=success`,
      cancelPath: `/payments/business-plan/${id}?status=cancelled`
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Ödəniş sessiyası yaradıla bilmədi."
    };
  }

  const pool = getPgPool();
  const result = await pool.query<BusinessPlanPaymentRow>(
    `INSERT INTO business_plan_payments (
       id, owner_user_id, business_type, plan_id, amount_azn, provider, status, checkout_url,
       provider_mode, checkout_strategy, provider_payload
     )
     VALUES ($1, $2, $3, $4, $5, 'kapital_bank', 'redirect_ready', $6, $7, $8, $9::jsonb)
     RETURNING *`,
    [
      id,
      input.ownerUserId,
      input.businessType,
      input.planId,
      amountAzn,
      session.checkoutUrl,
      session.providerMode,
      session.checkoutStrategy,
      JSON.stringify(session.payload)
    ]
  );
  return { ok: true, payment: toRecord(result.rows[0]) };
}

export async function getBusinessPlanPayment(paymentId: string): Promise<BusinessPlanPaymentRecord | null> {
  const pool = getPgPool();
  const result = await pool.query<BusinessPlanPaymentRow>(
    `SELECT * FROM business_plan_payments WHERE id = $1 LIMIT 1`,
    [paymentId]
  );
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}

export async function getBusinessPlanPaymentByRemoteOrderId(remoteOrderId: string): Promise<BusinessPlanPaymentRecord | null> {
  const pool = getPgPool();
  const result = await pool.query<BusinessPlanPaymentRow>(
    `SELECT *
     FROM business_plan_payments
     WHERE provider_reference = $1
        OR provider_payload->>'remoteOrderId' = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [remoteOrderId]
  );
  return result.rows[0] ? toRecord(result.rows[0]) : null;
}

async function calculateNextSubscriptionWindow(input: {
  ownerUserId: string;
  businessType: BusinessType;
}): Promise<{ startsAt: Date; expiresAt: Date }> {
  const pool = getPgPool();
  const result = await pool.query<{ expires_at: Date | null; status: string }>(
    `SELECT expires_at, status
     FROM business_plan_subscriptions
     WHERE owner_user_id = $1 AND business_type = $2
     ORDER BY updated_at DESC
     LIMIT 1`,
    [input.ownerUserId, input.businessType]
  );
  const now = new Date();
  const current = result.rows[0];
  const baseStart =
    current?.status === "active" && current.expires_at && current.expires_at > now
      ? current.expires_at
      : now;
  const expiresAt = new Date(baseStart);
  expiresAt.setDate(expiresAt.getDate() + BILLING_DAYS);
  return { startsAt: now, expiresAt };
}

export async function finalizeBusinessPlanPayment(input: {
  paymentId: string;
  status: "succeeded" | "failed" | "cancelled";
  providerReference?: string;
}): Promise<{ ok: boolean; error?: string; payment?: BusinessPlanPaymentRecord }> {
  const payment = await getBusinessPlanPayment(input.paymentId);
  if (!payment) return { ok: false, error: "Ödəniş tapılmadı" };
  if (payment.status === "succeeded") return { ok: true, payment };

  const pool = getPgPool();
  const updatedResult = await pool.query<BusinessPlanPaymentRow>(
    `UPDATE business_plan_payments
     SET status = $2,
         provider_reference = COALESCE($3, provider_reference),
         completed_at = CASE WHEN $2 = 'succeeded' THEN NOW() ELSE completed_at END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [input.paymentId, input.status, input.providerReference ?? null]
  );
  const updated = updatedResult.rows[0];
  if (!updated) return { ok: false, error: "Ödəniş tapılmadı" };

  if (input.status !== "succeeded") return { ok: true, payment: toRecord(updated) };

  const window = await calculateNextSubscriptionWindow({
    ownerUserId: updated.owner_user_id,
    businessType: updated.business_type
  });

  await upsertBusinessPlanSubscription({
    ownerUserId: updated.owner_user_id,
    businessType: updated.business_type,
    planId: updated.plan_id,
    status: "active",
    startsAt: window.startsAt.toISOString(),
    expiresAt: window.expiresAt.toISOString()
  });

  const done = await pool.query<BusinessPlanPaymentRow>(
    `UPDATE business_plan_payments
     SET starts_at = $2::timestamptz,
         expires_at = $3::timestamptz,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [input.paymentId, window.startsAt.toISOString(), window.expiresAt.toISOString()]
  );
  const finalPayment = toRecord(done.rows[0] ?? updated);

  // Issue invoice and send email (non-blocking)
  try {
    const userProfile = await getUserProfile(finalPayment.ownerUserId);
    if (userProfile?.email) {
      const businessLabel = finalPayment.businessType === "dealer" ? "Avtosalon planı" : "Mağaza planı";
      await issueAndSendInvoice({
        userId: finalPayment.ownerUserId,
        userEmail: userProfile.email,
        userName: userProfile.fullName ?? userProfile.email,
        paymentType: "business_plan",
        paymentId: finalPayment.id,
        amountAzn: finalPayment.amountAzn,
        description: `${businessLabel} – ${finalPayment.planId}`,
        paymentReference: finalPayment.providerReference,
        appBaseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://ekomobil.az"
      });
    }
  } catch {
    // invoice errors are non-critical
  }

  return { ok: true, payment: finalPayment };
}
