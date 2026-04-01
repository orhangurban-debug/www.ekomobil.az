import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import type { ListingKind } from "@/lib/marketplace-types";

export interface UserBidGateRow {
  id: string;
  penaltyBalanceAzn: number;
  isIdentityVerified: boolean;
  finCode: string | null;
  userAccountStatus: string;
}

export async function getUserBidGate(userId: string): Promise<UserBidGateRow | null> {
  const pool = getPgPool();
  const r = await pool.query<{
    id: string;
    penalty_balance_azn: number;
    is_identity_verified: boolean;
    fin_code: string | null;
    user_account_status: string;
  }>(
    `SELECT id, penalty_balance_azn, is_identity_verified, fin_code, user_account_status
     FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const row = r.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    penaltyBalanceAzn: row.penalty_balance_azn,
    isIdentityVerified: row.is_identity_verified,
    finCode: row.fin_code,
    userAccountStatus: row.user_account_status
  };
}

export async function getListingKindForAuction(auctionId: string): Promise<ListingKind | null> {
  const pool = getPgPool();
  const r = await pool.query<{ listing_kind: string }>(
    `SELECT l.listing_kind
     FROM auction_listings a
     JOIN listings l ON l.id = a.listing_id
     WHERE a.id = $1 LIMIT 1`,
    [auctionId]
  );
  const k = r.rows[0]?.listing_kind;
  return k === "part" ? "part" : k === "vehicle" ? "vehicle" : null;
}

/**
 * BETA_FIN_ONLY: 1 ₼ kart yoxlaması üçün audit.
 * Prod-da PSP auth+void uğurlu olduqda simulated_ok / voided qeyd edin.
 */
export async function recordBidCardValidation(input: {
  userId: string;
  auctionId: string;
  status: "simulated_ok" | "initiated" | "failed";
}): Promise<void> {
  const pool = getPgPool();
  const id = randomUUID();
  await pool.query(
    `INSERT INTO auction_bid_card_validations (id, user_id, auction_id, amount_azn, status)
     VALUES ($1, $2, $3, 1, $4)`,
    [id, input.userId, input.auctionId, input.status]
  );
}
