import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { config } from "./config";
import { lockAuctionForBid } from "./locks";
import { countAcceptedBid, countAntiSnipingTrigger, countRejectedBid, observeBidLatency } from "./metrics";
import { getPgPool, withTransaction } from "./postgres";
import type { AuctionBidView, AuctionStateSnapshot, PlaceBidInput, PlaceBidResult } from "./types";

interface AuctionRow {
  id: string;
  listing_id: string;
  seller_user_id: string;
  title_snapshot: string;
  starting_bid_azn: number;
  current_bid_azn: number | null;
  current_bidder_user_id: string | null;
  minimum_increment_azn: number;
  status: string;
  starts_at: Date;
  ends_at: Date;
  deposit_required: boolean;
  deposit_amount_azn: number | null;
  winner_user_id: string | null;
  updated_at: Date;
}

interface BidRow {
  id: string;
  auction_id: string;
  bidder_user_id: string;
  amount_azn: number;
  is_auto_bid: boolean;
  max_auto_bid_azn: number | null;
  source: string;
  created_at: Date;
}

interface ParticipantRow {
  auction_id: string;
  bidder_user_id: string;
  deposit_required: boolean;
  deposit_status: string;
  can_bid: boolean;
  blocked_reason: string | null;
}

function mapAuction(row: AuctionRow): AuctionStateSnapshot {
  return {
    id: row.id,
    listingId: row.listing_id,
    sellerUserId: row.seller_user_id,
    titleSnapshot: row.title_snapshot,
    startingBidAzn: row.starting_bid_azn,
    currentBidAzn: row.current_bid_azn,
    currentBidderUserId: row.current_bidder_user_id,
    minimumIncrementAzn: row.minimum_increment_azn,
    status: row.status as AuctionStateSnapshot["status"],
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at.toISOString(),
    depositRequired: row.deposit_required,
    depositAmountAzn: row.deposit_amount_azn,
    winnerUserId: row.winner_user_id,
    updatedAt: row.updated_at.toISOString()
  };
}

function mapBid(row: BidRow): AuctionBidView {
  return {
    id: row.id,
    auctionId: row.auction_id,
    bidderUserId: row.bidder_user_id,
    amountAzn: row.amount_azn,
    isAutoBid: row.is_auto_bid,
    maxAutoBidAzn: row.max_auto_bid_azn,
    source: row.source as "manual" | "auto",
    createdAt: row.created_at.toISOString()
  };
}

function hashOptional(value?: string): string | null {
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex");
}

function isAuctionOpen(status: string): boolean {
  return status === "live" || status === "extended";
}

async function ensureParticipant(client: PoolClient, input: {
  auctionId: string;
  bidderUserId: string;
  depositRequired: boolean;
}): Promise<ParticipantRow> {
  const result = await client.query<ParticipantRow>(
    `INSERT INTO auction_participants (
       auction_id, bidder_user_id, phone_verified, deposit_required, deposit_status, risk_level, can_bid
     )
     VALUES ($1, $2, true, $3, $4, 'normal', true)
     ON CONFLICT (auction_id, bidder_user_id) DO UPDATE SET
       deposit_required = EXCLUDED.deposit_required,
       updated_at = NOW()
     RETURNING auction_id, bidder_user_id, deposit_required, deposit_status, can_bid, blocked_reason`,
    [input.auctionId, input.bidderUserId, input.depositRequired, input.depositRequired ? "pending" : "not_required"]
  );
  return result.rows[0];
}

export async function listAuctions(limit = 20): Promise<AuctionStateSnapshot[]> {
  const result = await getPgPool().query<AuctionRow>(
    `SELECT *
     FROM auction_listings
     WHERE status IN ('scheduled', 'live', 'extended', 'ended_pending_confirmation', 'buyer_confirmed', 'seller_confirmed', 'completed')
     ORDER BY starts_at ASC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map(mapAuction);
}

export async function getAuctionState(auctionId: string): Promise<AuctionStateSnapshot | null> {
  const result = await getPgPool().query<AuctionRow>(
    `SELECT * FROM auction_listings WHERE id = $1 LIMIT 1`,
    [auctionId]
  );
  return result.rows[0] ? mapAuction(result.rows[0]) : null;
}

export async function listAuctionBids(auctionId: string, limit = config.bidHistoryLimit): Promise<AuctionBidView[]> {
  const result = await getPgPool().query<BidRow>(
    `SELECT *
     FROM auction_bids
     WHERE auction_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [auctionId, limit]
  );
  return result.rows.map(mapBid);
}

export async function placeBid(input: PlaceBidInput): Promise<PlaceBidResult> {
  const startedAt = Date.now();
  try {
    const result = await withTransaction<PlaceBidResult>(async (client) => {
      await lockAuctionForBid(client, input.auctionId);
      const auctionResult = await client.query<AuctionRow>(
        `SELECT *
         FROM auction_listings
         WHERE id = $1
         FOR UPDATE`,
        [input.auctionId]
      );
      const auction = auctionResult.rows[0];
      if (!auction) {
        return { ok: false, error: "Auksion tapılmadı" };
      }
      if (!isAuctionOpen(auction.status)) {
        return { ok: false, error: "Auksion aktiv deyil" };
      }
      const now = Date.now();
      if (auction.starts_at.getTime() > now || auction.ends_at.getTime() <= now) {
        return { ok: false, error: "Auksion artıq bitib və ya hələ başlamayıb" };
      }
      if (auction.seller_user_id === input.bidderUserId) {
        return { ok: false, error: "Satıcı öz lotuna bid verə bilməz" };
      }

      const participant = await ensureParticipant(client, {
        auctionId: input.auctionId,
        bidderUserId: input.bidderUserId,
        depositRequired: auction.deposit_required
      });
      if (!participant.can_bid) {
        return { ok: false, error: participant.blocked_reason ?? "Bid icazəsi yoxdur" };
      }
      if (auction.deposit_required && participant.deposit_status !== "held") {
        return { ok: false, error: "Bu lot üçün deposit ödənişi tamamlanmalıdır" };
      }

      const nextMinimumBidAzn = (auction.current_bid_azn ?? auction.starting_bid_azn) + auction.minimum_increment_azn;
      if (input.amountAzn < nextMinimumBidAzn) {
        return { ok: false, error: `Minimum bid ${nextMinimumBidAzn} ₼ olmalıdır`, nextMinimumBidAzn };
      }

      const nearClose = auction.ends_at.getTime() - now <= config.antiSnipingWindowMs;
      const nextEndsAt = nearClose ? new Date(auction.ends_at.getTime() + config.antiSnipingExtensionMs) : auction.ends_at;
      const bidResult = await client.query<BidRow>(
        `INSERT INTO auction_bids (
           id, auction_id, bidder_user_id, amount_azn, is_auto_bid, max_auto_bid_azn, source, ip_hash, device_fingerprint
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          randomUUID(),
          input.auctionId,
          input.bidderUserId,
          input.amountAzn,
          Boolean(input.autoBidMaxAzn),
          input.autoBidMaxAzn ?? null,
          input.autoBidMaxAzn ? "auto" : "manual",
          hashOptional(input.ip),
          hashOptional(input.deviceFingerprint)
        ]
      );
      const updatedResult = await client.query<AuctionRow>(
        `UPDATE auction_listings
         SET current_bid_azn = $2,
             current_bidder_user_id = $3,
             winner_user_id = $3,
             status = CASE WHEN $4 THEN 'extended' ELSE status END,
             ends_at = $5,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [input.auctionId, input.amountAzn, input.bidderUserId, nearClose, nextEndsAt]
      );
      const updatedAuction = mapAuction(updatedResult.rows[0]);
      if (nearClose) {
        countAntiSnipingTrigger();
      }
      return {
        ok: true,
        bid: mapBid(bidResult.rows[0]),
        auction: updatedAuction,
        nextMinimumBidAzn: input.amountAzn + updatedAuction.minimumIncrementAzn,
        extended: nearClose
      };
    });

    observeBidLatency(Date.now() - startedAt);
    if (result.ok) {
      countAcceptedBid();
    } else {
      countRejectedBid();
    }
    return result;
  } catch (error) {
    countRejectedBid();
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Bid icra olunmadı"
    };
  }
}
