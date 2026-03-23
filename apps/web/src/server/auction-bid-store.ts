import { randomUUID, createHash } from "node:crypto";
import type { PoolClient } from "pg";
import { type AuctionBidRecord, type AuctionParticipantRecord, isAuctionOpen } from "@/lib/auction";
import { getPgPool } from "@/lib/postgres";
import {
  getAuctionBidsMemory,
  getAuctionParticipantsMemory,
  getAuctionListingsMemory
} from "@/server/auction-memory";
import { assertAuctionMemoryFallbackAllowed } from "@/server/auction-runtime";
import { getAuctionListing, recordAuctionAuditLog } from "@/server/auction-store";

interface AuctionBidRow {
  id: string;
  auction_id: string;
  bidder_user_id: string;
  amount_azn: number;
  is_auto_bid: boolean;
  max_auto_bid_azn: number | null;
  source: string;
  ip_hash: string | null;
  device_fingerprint: string | null;
  created_at: Date;
}

interface AuctionParticipantRow {
  auction_id: string;
  bidder_user_id: string;
  phone_verified: boolean;
  deposit_required: boolean;
  deposit_status: string;
  risk_level: string;
  can_bid: boolean;
  blocked_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

interface LockedAuctionRow {
  id: string;
  seller_user_id: string;
  status: string;
  starts_at: Date;
  ends_at: Date;
  current_bid_azn: number | null;
  current_bidder_user_id: string | null;
  winner_user_id: string | null;
  starting_bid_azn: number;
  minimum_increment_azn: number;
  deposit_required: boolean;
}

function mapBidRow(row: AuctionBidRow): AuctionBidRecord {
  return {
    id: row.id,
    auctionId: row.auction_id,
    bidderUserId: row.bidder_user_id,
    amountAzn: row.amount_azn,
    isAutoBid: row.is_auto_bid,
    maxAutoBidAzn: row.max_auto_bid_azn ?? undefined,
    source: row.source as "manual" | "auto",
    ipHash: row.ip_hash ?? undefined,
    deviceFingerprint: row.device_fingerprint ?? undefined,
    createdAt: row.created_at.toISOString()
  };
}

function mapParticipantRow(row: AuctionParticipantRow): AuctionParticipantRecord {
  return {
    auctionId: row.auction_id,
    bidderUserId: row.bidder_user_id,
    phoneVerified: row.phone_verified,
    depositRequired: row.deposit_required,
    depositStatus: row.deposit_status as AuctionParticipantRecord["depositStatus"],
    riskLevel: row.risk_level as AuctionParticipantRecord["riskLevel"],
    canBid: row.can_bid,
    blockedReason: row.blocked_reason ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function hashOptional(value?: string): string | undefined {
  if (!value) return undefined;
  return createHash("sha256").update(value).digest("hex");
}

async function ensureParticipant(input: {
  auctionId: string;
  bidderUserId: string;
  depositRequired: boolean;
  client?: PoolClient;
}): Promise<AuctionParticipantRecord> {
  try {
    const db = input.client ?? getPgPool();
    const result = await db.query<AuctionParticipantRow>(
      `INSERT INTO auction_participants (
         auction_id, bidder_user_id, phone_verified, deposit_required, deposit_status, risk_level, can_bid
       )
       VALUES ($1, $2, true, $3, $4, 'normal', true)
       ON CONFLICT (auction_id, bidder_user_id) DO UPDATE SET
         updated_at = NOW()
       RETURNING *`,
      [input.auctionId, input.bidderUserId, input.depositRequired, input.depositRequired ? "pending" : "not_required"]
    );
    return mapParticipantRow(result.rows[0]);
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    const items = getAuctionParticipantsMemory();
    const existing = items.find((item) => item.auctionId === input.auctionId && item.bidderUserId === input.bidderUserId);
    if (existing) return existing;
    const nowIso = new Date().toISOString();
    const participant: AuctionParticipantRecord = {
      auctionId: input.auctionId,
      bidderUserId: input.bidderUserId,
      phoneVerified: true,
      depositRequired: input.depositRequired,
      depositStatus: input.depositRequired ? "pending" : "not_required",
      riskLevel: "normal",
      canBid: true,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    items.unshift(participant);
    return participant;
  }
}

export async function listAuctionBids(auctionId: string, limit = 50): Promise<AuctionBidRecord[]> {
  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionBidRow>(
      `SELECT * FROM auction_bids WHERE auction_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [auctionId, limit]
    );
    return result.rows.map(mapBidRow);
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    return getAuctionBidsMemory()
      .filter((item) => item.auctionId === auctionId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit);
  }
}

export async function placeAuctionBid(input: {
  auctionId: string;
  bidderUserId: string;
  amountAzn: number;
  autoBidMaxAzn?: number;
  ip?: string;
  deviceFingerprint?: string;
}): Promise<{ ok: boolean; error?: string; bid?: AuctionBidRecord; nextMinimumBidAzn?: number }> {
  const bidId = randomUUID();
  const pool = getPgPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [input.auctionId]);
    const auctionResult = await client.query<LockedAuctionRow>(
      `SELECT
         id,
         seller_user_id,
         status,
         starts_at,
         ends_at,
         current_bid_azn,
         current_bidder_user_id,
         winner_user_id,
         starting_bid_azn,
         minimum_increment_azn,
         deposit_required
       FROM auction_listings
       WHERE id = $1
       FOR UPDATE`,
      [input.auctionId]
    );
    const auction = auctionResult.rows[0];
    if (!auction) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Auksion tapılmadı" };
    }
    if (!isAuctionOpen(auction.status as "live" | "extended")) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Auksion aktiv deyil" };
    }
    if (auction.seller_user_id === input.bidderUserId) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Satıcı öz lotuna bid verə bilməz" };
    }
    const now = Date.now();
    if (auction.ends_at.getTime() <= now || auction.starts_at.getTime() > now) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Auksion artıq bitib və ya hələ başlamayıb" };
    }

    const participant = await ensureParticipant({
      auctionId: input.auctionId,
      bidderUserId: input.bidderUserId,
      depositRequired: auction.deposit_required,
      client
    });
    if (!participant.canBid) {
      await client.query("ROLLBACK");
      return { ok: false, error: participant.blockedReason ?? "Bid icazəsi yoxdur" };
    }
    if (auction.deposit_required && participant.depositStatus !== "held") {
      await client.query("ROLLBACK");
      return { ok: false, error: "Bu lot üçün əvvəlcə deposit ödənişi təsdiqlənməlidir" };
    }

    const currentBase = auction.current_bid_azn ?? auction.starting_bid_azn;
    const nextMinimumBidAzn = currentBase + auction.minimum_increment_azn;
    if (input.amountAzn < nextMinimumBidAzn) {
      await client.query("ROLLBACK");
      return { ok: false, error: `Minimum bid ${nextMinimumBidAzn} ₼ olmalıdır`, nextMinimumBidAzn };
    }

    const nearClose = auction.ends_at.getTime() - now <= 5 * 60 * 1000;
    const extendedEndsAt = nearClose ? new Date(auction.ends_at.getTime() + 2 * 60 * 1000) : null;
    const bidResult = await client.query<AuctionBidRow>(
      `INSERT INTO auction_bids (
         id, auction_id, bidder_user_id, amount_azn, is_auto_bid, max_auto_bid_azn, source, ip_hash, device_fingerprint
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        bidId,
        input.auctionId,
        input.bidderUserId,
        input.amountAzn,
        Boolean(input.autoBidMaxAzn),
        input.autoBidMaxAzn ?? null,
        input.autoBidMaxAzn ? "auto" : "manual",
        hashOptional(input.ip) ?? null,
        hashOptional(input.deviceFingerprint) ?? null
      ]
    );
    await client.query(
      `UPDATE auction_listings
       SET current_bid_azn = $2,
           current_bidder_user_id = $3,
           winner_user_id = $3,
           status = CASE WHEN $4 THEN 'extended' ELSE status END,
           ends_at = COALESCE($5, ends_at),
           updated_at = NOW()
       WHERE id = $1`,
      [input.auctionId, input.amountAzn, input.bidderUserId, nearClose, extendedEndsAt]
    );
    await client.query("COMMIT");
    const bid = mapBidRow(bidResult.rows[0]);
    await recordAuctionAuditLog({
      auctionId: input.auctionId,
      actorUserId: input.bidderUserId,
      actionType: "bid_submitted",
      detail: `Bid submitted at ${input.amountAzn} AZN`
    });
    return { ok: true, bid, nextMinimumBidAzn: input.amountAzn + auction.minimum_increment_azn };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback failures
    }
    assertAuctionMemoryFallbackAllowed(error);
    const snapshot = await getAuctionListing(input.auctionId);
    if (!snapshot) return { ok: false, error: "Auksion tapılmadı" };
    const bid: AuctionBidRecord = {
      id: bidId,
      auctionId: input.auctionId,
      bidderUserId: input.bidderUserId,
      amountAzn: input.amountAzn,
      isAutoBid: Boolean(input.autoBidMaxAzn),
      maxAutoBidAzn: input.autoBidMaxAzn,
      source: input.autoBidMaxAzn ? "auto" : "manual",
      ipHash: hashOptional(input.ip),
      deviceFingerprint: hashOptional(input.deviceFingerprint),
      createdAt: new Date().toISOString()
    };
    getAuctionBidsMemory().unshift(bid);
    const auctions = getAuctionListingsMemory();
    const existing = auctions.find((item) => item.id === input.auctionId);
    if (!existing) return { ok: false, error: "Auksion tapılmadı" };
    if (existing.depositRequired) {
      const participant = await ensureParticipant({
        auctionId: input.auctionId,
        bidderUserId: input.bidderUserId,
        depositRequired: true
      });
      if (participant.depositStatus !== "held") {
        return { ok: false, error: "Bu lot üçün əvvəlcə deposit ödənişi təsdiqlənməlidir" };
      }
    }
    existing.currentBidAzn = input.amountAzn;
    existing.currentBidderUserId = input.bidderUserId;
    existing.winnerUserId = input.bidderUserId;
    const nearClose = new Date(existing.endsAt).getTime() - Date.now() <= 5 * 60 * 1000;
    const extendedEndsAt = nearClose ? new Date(new Date(existing.endsAt).getTime() + 2 * 60 * 1000) : null;
    if (nearClose && extendedEndsAt) {
      existing.status = "extended";
      existing.endsAt = extendedEndsAt.toISOString();
    }
    existing.updatedAt = new Date().toISOString();
    await recordAuctionAuditLog({
      auctionId: input.auctionId,
      actorUserId: input.bidderUserId,
      actionType: "bid_submitted",
      detail: `Bid submitted at ${input.amountAzn} AZN`
    });
    return { ok: true, bid, nextMinimumBidAzn: input.amountAzn + existing.minimumIncrementAzn };
  } finally {
    client.release();
  }
}
