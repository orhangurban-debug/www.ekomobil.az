import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";

export async function hasHeldPreauthForAuction(auctionId: string, userId: string): Promise<boolean> {
  const pool = getPgPool();
  const r = await pool.query<{ c: string }>(
    `SELECT 1 AS c FROM auction_preauth_transactions
     WHERE auction_id = $1 AND user_id = $2 AND status = 'held' LIMIT 1`,
    [auctionId, userId]
  );
  return r.rows.length > 0;
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
  checkoutUrl?: string | null;
  paymentReference?: string | null;
}): Promise<{ id: string }> {
  const pool = getPgPool();
  const id = randomUUID();
  await pool.query(
    `INSERT INTO auction_preauth_transactions (
       id, auction_id, user_id, amount_azn, status, checkout_url, payment_reference
     ) VALUES ($1, $2, $3, $4, 'pending_hold', $5, $6)`,
    [id, input.auctionId, input.userId, input.amountAzn, input.checkoutUrl ?? null, input.paymentReference ?? null]
  );
  return { id };
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
