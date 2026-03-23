import { randomUUID } from "node:crypto";
import { getPlanById, type PlanType } from "@/lib/listing-plans";
import {
  type PaymentProviderPayload,
  type ListingPlanPaymentRecord,
  type ListingPlanPaymentSource,
  type ListingPlanPaymentStatus
} from "@/lib/payments";
import { getPgPool } from "@/lib/postgres";
import { applyListingPlanForOwner, validateListingOwnership } from "@/server/listing-store";
import { prepareKapitalBankCheckoutSession } from "@/server/payments/kapital-bank-provider";

const globalForPayments = globalThis as unknown as {
  ekomobilPayments?: ListingPlanPaymentRecord[];
};

function getCreatedPayments(): ListingPlanPaymentRecord[] {
  if (!globalForPayments.ekomobilPayments) {
    globalForPayments.ekomobilPayments = [];
  }
  return globalForPayments.ekomobilPayments;
}

interface PaymentRow {
  id: string;
  listing_id: string;
  owner_user_id: string;
  plan_type: string;
  amount_azn: number;
  source: string;
  provider: string;
  status: string;
  checkout_url: string;
  provider_reference: string | null;
  provider_mode: string | null;
  checkout_strategy: string | null;
  provider_payload: PaymentProviderPayload | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: PaymentRow): ListingPlanPaymentRecord {
  return {
    id: row.id,
    listingId: row.listing_id,
    ownerUserId: row.owner_user_id,
    planType: row.plan_type as "standard" | "vip",
    amountAzn: row.amount_azn,
    source: row.source as ListingPlanPaymentSource,
    provider: row.provider as "kapital_bank",
    status: row.status as ListingPlanPaymentStatus,
    checkoutUrl: row.checkout_url,
    providerReference: row.provider_reference ?? undefined,
    providerMode: row.provider_mode as ListingPlanPaymentRecord["providerMode"],
    checkoutStrategy: row.checkout_strategy as ListingPlanPaymentRecord["checkoutStrategy"],
    providerPayload: row.provider_payload ?? undefined,
    completedAt: row.completed_at?.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function createListingPlanPayment(input: {
  listingId: string;
  ownerUserId: string;
  planType: "standard" | "vip";
  source: ListingPlanPaymentSource;
}): Promise<{ ok: true; payment: ListingPlanPaymentRecord } | { ok: false; error: string }> {
  const ownership = await validateListingOwnership(input.listingId, input.ownerUserId);
  if (!ownership.ok) {
    return { ok: false, error: ownership.error ?? "Elan tapılmadı" };
  }

  const plan = getPlanById(input.planType);
  if (!plan || plan.priceAzn <= 0) {
    return { ok: false, error: "Ödəniş üçün keçərli plan seçin" };
  }

  const id = randomUUID();
  const session = await prepareKapitalBankCheckoutSession({
    internalPaymentId: id,
    amountAzn: plan.priceAzn,
    description: `Listing ${input.planType} plan payment`,
    checkoutPagePath: `/payments/listing-plan/${id}`,
    callbackPath: "/api/payments/kapital-bank/callback",
    successPath: `/listings/${input.listingId}?payment=success`,
    cancelPath: `/payments/listing-plan/${id}?status=cancelled`
  });

  try {
    const pool = getPgPool();
    const result = await pool.query<PaymentRow>(
      `INSERT INTO listing_plan_payments (
         id, listing_id, owner_user_id, plan_type, amount_azn, source, provider, status, checkout_url,
         provider_mode, checkout_strategy, provider_payload
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'kapital_bank', 'redirect_ready', $7, $8, $9, $10::jsonb)
       RETURNING *`,
      [
        id,
        input.listingId,
        input.ownerUserId,
        input.planType,
        plan.priceAzn,
        input.source,
        session.checkoutUrl,
        session.providerMode,
        session.checkoutStrategy,
        JSON.stringify(session.payload)
      ]
    );
    return { ok: true, payment: mapRow(result.rows[0]) };
  } catch {
    const payment: ListingPlanPaymentRecord = {
      id,
      listingId: input.listingId,
      ownerUserId: input.ownerUserId,
      planType: input.planType,
      amountAzn: plan.priceAzn,
      source: input.source,
      provider: "kapital_bank",
      status: "redirect_ready",
      checkoutUrl: session.checkoutUrl,
      providerMode: session.providerMode,
      checkoutStrategy: session.checkoutStrategy,
      providerPayload: session.payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    getCreatedPayments().unshift(payment);
    return { ok: true, payment };
  }
}

export async function getListingPlanPayment(paymentId: string): Promise<ListingPlanPaymentRecord | null> {
  try {
    const pool = getPgPool();
    const result = await pool.query<PaymentRow>(
      `SELECT * FROM listing_plan_payments WHERE id = $1 LIMIT 1`,
      [paymentId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch {
    return getCreatedPayments().find((item) => item.id === paymentId) ?? null;
  }
}

async function setListingPlanPaymentStatus(
  paymentId: string,
  status: ListingPlanPaymentStatus,
  providerReference?: string
): Promise<ListingPlanPaymentRecord | null> {
  try {
    const pool = getPgPool();
    const result = await pool.query<PaymentRow>(
      `UPDATE listing_plan_payments
       SET status = $2,
           provider_reference = COALESCE($3, provider_reference),
           completed_at = CASE WHEN $2 = 'succeeded' THEN NOW() ELSE completed_at END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [paymentId, status, providerReference ?? null]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch {
    const payment = getCreatedPayments().find((item) => item.id === paymentId) ?? null;
    if (!payment) return null;
    payment.status = status;
    payment.providerReference = providerReference ?? payment.providerReference;
    payment.updatedAt = new Date().toISOString();
    if (status === "succeeded") {
      payment.completedAt = payment.updatedAt;
    }
    return payment;
  }
}

export async function finalizeListingPlanPayment(input: {
  paymentId: string;
  status: Extract<ListingPlanPaymentStatus, "succeeded" | "failed" | "cancelled">;
  providerReference?: string;
}): Promise<{ ok: boolean; error?: string; payment?: ListingPlanPaymentRecord }> {
  const payment = await getListingPlanPayment(input.paymentId);
  if (!payment) {
    return { ok: false, error: "Ödəniş tapılmadı" };
  }

  if (payment.status === "succeeded") {
    return { ok: true, payment };
  }

  const updatedPayment = await setListingPlanPaymentStatus(
    input.paymentId,
    input.status,
    input.providerReference
  );
  if (!updatedPayment) {
    return { ok: false, error: "Ödəniş tapılmadı" };
  }

  if (input.status !== "succeeded") {
    return { ok: true, payment: updatedPayment };
  }

  const applyResult = await applyListingPlanForOwner(updatedPayment.listingId, updatedPayment.ownerUserId, updatedPayment.planType, {
    activate: updatedPayment.source === "publish"
  });
  if (!applyResult.ok) {
    return { ok: false, error: applyResult.error ?? "Plan tətbiq edilə bilmədi" };
  }

  return { ok: true, payment: updatedPayment };
}
