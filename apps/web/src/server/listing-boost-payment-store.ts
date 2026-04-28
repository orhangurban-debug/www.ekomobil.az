import { randomUUID } from "node:crypto";
import { type PaymentProviderPayload, type ListingBoostPaymentRecord, type ListingBoostPaymentStatus } from "@/lib/payments";
import { getPgPool } from "@/lib/postgres";
import { validateListingOwnership } from "@/server/listing-store";
import { prepareKapitalBankCheckoutSession } from "@/server/payments/kapital-bank-provider";
import { applyListingBoostPackage, getBoostPackageById, ensureListingBoostTables } from "@/server/listing-boost-store";
import { issueAndSendInvoice } from "@/server/invoice-store";
import { getUserProfile } from "@/server/user-store";

const globalForBoostPayments = globalThis as unknown as {
  ekomobilListingBoostPayments?: ListingBoostPaymentRecord[];
};

function getCreatedBoostPayments(): ListingBoostPaymentRecord[] {
  if (!globalForBoostPayments.ekomobilListingBoostPayments) {
    globalForBoostPayments.ekomobilListingBoostPayments = [];
  }
  return globalForBoostPayments.ekomobilListingBoostPayments;
}

interface ListingBoostPaymentRow {
  id: string;
  listing_id: string;
  owner_user_id: string;
  boost_package_id: string;
  boost_type: string;
  amount_azn: number;
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

function mapRow(row: ListingBoostPaymentRow): ListingBoostPaymentRecord {
  return {
    id: row.id,
    listingId: row.listing_id,
    ownerUserId: row.owner_user_id,
    boostPackageId: row.boost_package_id,
    boostType: row.boost_type as ListingBoostPaymentRecord["boostType"],
    amountAzn: Number(row.amount_azn),
    provider: row.provider as ListingBoostPaymentRecord["provider"],
    status: row.status as ListingBoostPaymentStatus,
    checkoutUrl: row.checkout_url,
    providerReference: row.provider_reference ?? undefined,
    providerMode: row.provider_mode as ListingBoostPaymentRecord["providerMode"],
    checkoutStrategy: row.checkout_strategy as ListingBoostPaymentRecord["checkoutStrategy"],
    providerPayload: row.provider_payload ?? undefined,
    completedAt: row.completed_at?.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function ensureListingBoostPaymentsTable(): Promise<void> {
  await ensureListingBoostTables();
  try {
    const pool = getPgPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS listing_boost_payments (
        id                TEXT PRIMARY KEY,
        listing_id        TEXT NOT NULL,
        owner_user_id     TEXT NOT NULL,
        boost_package_id  TEXT NOT NULL,
        boost_type        TEXT NOT NULL,
        amount_azn        NUMERIC(10,2) NOT NULL,
        provider          TEXT NOT NULL,
        status            TEXT NOT NULL,
        checkout_url      TEXT NOT NULL,
        provider_reference TEXT,
        provider_mode     TEXT,
        checkout_strategy TEXT,
        provider_payload  JSONB,
        completed_at      TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS listing_boost_payments_listing_idx
        ON listing_boost_payments (listing_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS listing_boost_payments_owner_idx
        ON listing_boost_payments (owner_user_id, created_at DESC);
    `);
  } catch {
    // non-blocking safety net
  }
}

export async function createListingBoostPayment(input: {
  listingId: string;
  ownerUserId: string;
  packageId: string;
}): Promise<{ ok: true; payment: ListingBoostPaymentRecord } | { ok: false; error: string }> {
  await ensureListingBoostPaymentsTable();

  const ownership = await validateListingOwnership(input.listingId, input.ownerUserId);
  if (!ownership.ok) {
    return { ok: false, error: ownership.error ?? "Elan tapılmadı" };
  }

  const pkg = getBoostPackageById(input.packageId);
  if (!pkg || pkg.priceAzn <= 0) {
    return { ok: false, error: "Boost paketi tapılmadı" };
  }

  const id = randomUUID();
  let session;
  try {
    session = await prepareKapitalBankCheckoutSession({
      internalPaymentId: id,
      amountAzn: pkg.priceAzn,
      description: `Listing boost payment (${pkg.id})`,
      checkoutPagePath: `/payments/listing-boost/${id}`,
      callbackPath: "/api/payments/listing-boost/callback",
      successPath: `/listings/${input.listingId}?boost=success`,
      cancelPath: `/payments/listing-boost/${id}?status=cancelled`
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Ödəniş sessiyası yaradıla bilmədi"
    };
  }

  try {
    const pool = getPgPool();
    const result = await pool.query<ListingBoostPaymentRow>(
      `INSERT INTO listing_boost_payments (
         id, listing_id, owner_user_id, boost_package_id, boost_type, amount_azn, provider, status, checkout_url,
         provider_mode, checkout_strategy, provider_payload
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'kapital_bank', 'redirect_ready', $7, $8, $9, $10::jsonb)
       RETURNING *`,
      [
        id,
        input.listingId,
        input.ownerUserId,
        pkg.id,
        pkg.type,
        pkg.priceAzn,
        session.checkoutUrl,
        session.providerMode,
        session.checkoutStrategy,
        JSON.stringify(session.payload)
      ]
    );
    return { ok: true, payment: mapRow(result.rows[0]) };
  } catch {
    const payment: ListingBoostPaymentRecord = {
      id,
      listingId: input.listingId,
      ownerUserId: input.ownerUserId,
      boostPackageId: pkg.id,
      boostType: pkg.type,
      amountAzn: pkg.priceAzn,
      provider: "kapital_bank",
      status: "redirect_ready",
      checkoutUrl: session.checkoutUrl,
      providerMode: session.providerMode,
      checkoutStrategy: session.checkoutStrategy,
      providerPayload: session.payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    getCreatedBoostPayments().unshift(payment);
    return { ok: true, payment };
  }
}

export async function getListingBoostPayment(paymentId: string): Promise<ListingBoostPaymentRecord | null> {
  await ensureListingBoostPaymentsTable();
  try {
    const pool = getPgPool();
    const result = await pool.query<ListingBoostPaymentRow>(
      `SELECT * FROM listing_boost_payments WHERE id = $1 LIMIT 1`,
      [paymentId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch {
    return getCreatedBoostPayments().find((item) => item.id === paymentId) ?? null;
  }
}

export async function getListingBoostPaymentByRemoteOrderId(remoteOrderId: string): Promise<ListingBoostPaymentRecord | null> {
  await ensureListingBoostPaymentsTable();
  try {
    const pool = getPgPool();
    const result = await pool.query<ListingBoostPaymentRow>(
      `SELECT *
       FROM listing_boost_payments
       WHERE provider_reference = $1
          OR provider_payload->>'remoteOrderId' = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [remoteOrderId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch {
    return (
      getCreatedBoostPayments().find(
        (item) =>
          item.providerReference === remoteOrderId ||
          item.providerPayload?.remoteOrderId === remoteOrderId
      ) ?? null
    );
  }
}

async function setListingBoostPaymentStatus(
  paymentId: string,
  status: ListingBoostPaymentStatus,
  providerReference?: string
): Promise<ListingBoostPaymentRecord | null> {
  try {
    const pool = getPgPool();
    const result = await pool.query<ListingBoostPaymentRow>(
      `UPDATE listing_boost_payments
       SET status = $2,
           provider_reference = COALESCE($3, provider_reference),
           completed_at = CASE WHEN $2 = 'succeeded' THEN NOW() ELSE completed_at END,
           updated_at = NOW()
       WHERE id = $1
         AND status <> 'succeeded'
       RETURNING *`,
      [paymentId, status, providerReference ?? null]
    );
    if (result.rows[0]) return mapRow(result.rows[0]);
    const existing = await pool.query<ListingBoostPaymentRow>(`SELECT * FROM listing_boost_payments WHERE id = $1 LIMIT 1`, [paymentId]);
    return existing.rows[0] ? mapRow(existing.rows[0]) : null;
  } catch {
    const payment = getCreatedBoostPayments().find((item) => item.id === paymentId) ?? null;
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

export async function finalizeListingBoostPayment(input: {
  paymentId: string;
  status: Extract<ListingBoostPaymentStatus, "succeeded" | "failed" | "cancelled">;
  providerReference?: string;
}): Promise<{ ok: boolean; error?: string; payment?: ListingBoostPaymentRecord }> {
  const payment = await getListingBoostPayment(input.paymentId);
  if (!payment) {
    return { ok: false, error: "Ödəniş tapılmadı" };
  }

  if (payment.status === "succeeded") {
    return { ok: true, payment };
  }

  if (input.status !== "succeeded") {
    const updatedPayment = await setListingBoostPaymentStatus(
      input.paymentId,
      input.status,
      input.providerReference
    );
    if (!updatedPayment) {
      return { ok: false, error: "Ödəniş tapılmadı" };
    }
    return { ok: true, payment: updatedPayment };
  }

  const boostResult = await applyListingBoostPackage({
    listingId: payment.listingId,
    packageId: payment.boostPackageId
  });
  if (!boostResult.ok) {
    return { ok: false, error: boostResult.error ?? "Boost tətbiq edilə bilmədi" };
  }

  const updatedPayment = await setListingBoostPaymentStatus(
    input.paymentId,
    input.status,
    input.providerReference
  );
  if (!updatedPayment) {
    return { ok: false, error: "Ödəniş statusu yenilənə bilmədi" };
  }

  try {
    const userProfile = await getUserProfile(updatedPayment.ownerUserId);
    if (userProfile?.email) {
      await issueAndSendInvoice({
        userId: updatedPayment.ownerUserId,
        userEmail: userProfile.email,
        userName: userProfile.fullName ?? userProfile.email,
        paymentType: "listing_boost",
        paymentId: updatedPayment.id,
        amountAzn: updatedPayment.amountAzn,
        description: `Boost paketi – ${updatedPayment.boostPackageId}`,
        paymentReference: updatedPayment.providerReference,
        appBaseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://ekomobil.az"
      });
    }
  } catch {
    // invoice errors are non-critical
  }

  return { ok: true, payment: updatedPayment };
}
