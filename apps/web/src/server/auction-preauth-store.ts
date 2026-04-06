import { randomUUID } from "node:crypto";
import type { PaymentCheckoutStrategy, PaymentProviderMode, PaymentProviderPayload } from "@/lib/payments";
import { getPgPool } from "@/lib/postgres";
import { prepareKapitalBankCheckoutSession } from "@/server/payments/kapital-bank-provider";

interface AuctionPreauthRow {
  id: string;
  auction_id: string;
  user_id: string;
  amount_azn: number;
  status: string;
  payment_reference: string | null;
  checkout_url: string | null;
  provider_mode: string | null;
  checkout_strategy: string | null;
  provider_payload: PaymentProviderPayload | null;
  created_at: Date;
  updated_at: Date;
  voided_at: Date | null;
}

export interface AuctionPreauthRecord {
  id: string;
  auctionId: string;
  userId: string;
  amountAzn: number;
  status: "pending_hold" | "held" | "voided" | "captured" | "failed";
  paymentReference?: string;
  checkoutUrl?: string;
  providerMode?: PaymentProviderMode;
  checkoutStrategy?: PaymentCheckoutStrategy;
  providerPayload?: PaymentProviderPayload;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

function mapPreauthRow(row: AuctionPreauthRow): AuctionPreauthRecord {
  return {
    id: row.id,
    auctionId: row.auction_id,
    userId: row.user_id,
    amountAzn: row.amount_azn,
    status: row.status as AuctionPreauthRecord["status"],
    paymentReference: row.payment_reference ?? undefined,
    checkoutUrl: row.checkout_url ?? undefined,
    providerMode: (row.provider_mode as PaymentProviderMode | null) ?? undefined,
    checkoutStrategy: (row.checkout_strategy as PaymentCheckoutStrategy | null) ?? undefined,
    providerPayload: row.provider_payload ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    voidedAt: row.voided_at?.toISOString() ?? undefined
  };
}

export async function hasHeldPreauthForAuction(auctionId: string, userId: string): Promise<boolean> {
  const pool = getPgPool();
  const r = await pool.query<{ c: string }>(
    `SELECT 1 AS c FROM auction_preauth_transactions
     WHERE auction_id = $1 AND user_id = $2 AND status = 'held' LIMIT 1`,
    [auctionId, userId]
  );
  return r.rows.length > 0;
}

export async function getAuctionPreauth(preauthId: string): Promise<AuctionPreauthRecord | null> {
  const pool = getPgPool();
  const result = await pool.query<AuctionPreauthRow>(
    `SELECT *
     FROM auction_preauth_transactions
     WHERE id = $1
     LIMIT 1`,
    [preauthId]
  );
  return result.rows[0] ? mapPreauthRow(result.rows[0]) : null;
}

export async function getAuctionPreauthByRemoteOrderId(remoteOrderId: string): Promise<AuctionPreauthRecord | null> {
  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionPreauthRow>(
      `SELECT *
       FROM auction_preauth_transactions
       WHERE payment_reference = $1
          OR provider_payload->>'remoteOrderId' = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [remoteOrderId]
    );
    return result.rows[0] ? mapPreauthRow(result.rows[0]) : null;
  } catch {
    return null;
  }
}

export async function listHeldPreauthForAuction(auctionId: string): Promise<
  Array<{ id: string; userId: string; amountAzn: number }>
> {
  const pool = getPgPool();
  const r = await pool.query<{ id: string; user_id: string; amount_azn: number }>(
    `SELECT id, user_id, amount_azn FROM auction_preauth_transactions
     WHERE auction_id = $1 AND status = 'held'`,
    [auctionId]
  );
  return r.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    amountAzn: row.amount_azn
  }));
}

/** STRICT rejimi üçün hold sətri (Kapital callback sonrası 'held' edilir). */
export async function createPendingPreauthHold(input: {
  auctionId: string;
  userId: string;
  amountAzn: number;
}): Promise<AuctionPreauthRecord> {
  const pool = getPgPool();
  const id = randomUUID();
  const session = await prepareKapitalBankCheckoutSession({
    internalPaymentId: id,
    amountAzn: input.amountAzn,
    description: "Auction bidder pre-auth",
    checkoutPagePath: `/payments/auction-preauth/${id}`,
    callbackPath: "/api/payments/auction-preauth/callback",
    successPath: `/payments/auction-preauth/${id}?status=success`,
    cancelPath: `/payments/auction-preauth/${id}?status=cancelled`
  });
  const paymentReference = session.payload.remoteOrderId ?? null;
  await pool.query(
    `INSERT INTO auction_preauth_transactions (
       id, auction_id, user_id, amount_azn, status, checkout_url, payment_reference,
       provider_mode, checkout_strategy, provider_payload
     ) VALUES ($1, $2, $3, $4, 'pending_hold', $5, $6, $7, $8, $9)`,
    [
      id,
      input.auctionId,
      input.userId,
      input.amountAzn,
      session.checkoutUrl,
      paymentReference,
      session.providerMode,
      session.checkoutStrategy,
      JSON.stringify(session.payload)
    ]
  );
  return {
    id,
    auctionId: input.auctionId,
    userId: input.userId,
    amountAzn: input.amountAzn,
    status: "pending_hold",
    checkoutUrl: session.checkoutUrl,
    paymentReference: paymentReference ?? undefined,
    providerMode: session.providerMode,
    checkoutStrategy: session.checkoutStrategy,
    providerPayload: session.payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export async function finalizeAuctionPreauth(input: {
  preauthId: string;
  status: "held" | "failed";
  paymentReference?: string;
}): Promise<{ ok: boolean; error?: string; preauth?: AuctionPreauthRecord }> {
  const pool = getPgPool();
  const result = await pool.query<AuctionPreauthRow>(
    `UPDATE auction_preauth_transactions
     SET status = $2,
         payment_reference = COALESCE($3, payment_reference),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [input.preauthId, input.status, input.paymentReference ?? null]
  );
  if (!result.rows[0]) {
    return { ok: false, error: "Pre-auth tapılmadı" };
  }
  return { ok: true, preauth: mapPreauthRow(result.rows[0]) };
}

export async function voidPreauthForLosers(input: {
  auctionId: string;
  winnerUserId: string | null;
}): Promise<number> {
  const pool = getPgPool();
  if (!input.winnerUserId) {
    const all = await pool.query(
      `UPDATE auction_preauth_transactions
       SET status = 'voided', voided_at = NOW(), updated_at = NOW()
       WHERE auction_id = $1 AND status = 'held'`,
      [input.auctionId]
    );
    return all.rowCount ?? 0;
  }
  const r = await pool.query(
    `UPDATE auction_preauth_transactions
     SET status = 'voided', voided_at = NOW(), updated_at = NOW()
     WHERE auction_id = $1 AND status = 'held' AND user_id <> $2`,
    [input.auctionId, input.winnerUserId]
  );
  return r.rowCount ?? 0;
}
