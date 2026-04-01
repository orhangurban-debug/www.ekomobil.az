import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { config } from "./config";
import { getMinBidIncrement } from "./bid-increment";
import { computeTieBreakerUserId, resolveTwoPartyProxy } from "./bid-proxy";
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
  reserve_price_azn: number | null;
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
    reservePriceAzn: row.reserve_price_azn ?? undefined,
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

async function insertBidRow(
  client: PoolClient,
  input: {
    auctionId: string;
    bidderUserId: string;
    amountAzn: number;
    maxAutoBidAzn: number | null;
    isAutoBid: boolean;
    source: "manual" | "auto";
    ip?: string;
    deviceFingerprint?: string;
  }
): Promise<BidRow> {
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
      input.isAutoBid,
      input.maxAutoBidAzn,
      input.source,
      hashOptional(input.ip),
      hashOptional(input.deviceFingerprint)
    ]
  );
  return bidResult.rows[0];
}

async function getLeaderEffectiveMax(
  client: PoolClient,
  auctionId: string,
  leaderId: string
): Promise<number | null> {
  const r = await client.query<{ max_auto_bid_azn: number | null; amount_azn: number }>(
    `SELECT max_auto_bid_azn, amount_azn
     FROM auction_bids
     WHERE auction_id = $1 AND bidder_user_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [auctionId, leaderId]
  );
  const row = r.rows[0];
  if (!row) return null;
  return row.max_auto_bid_azn ?? row.amount_azn;
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
     WHERE status IN ('scheduled', 'live', 'extended', 'ended_pending_confirmation', 'buyer_confirmed', 'seller_confirmed', 'completed', 'pending_seller_approval', 'not_met_reserve')
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

      const challengerMax = input.autoBidMaxAzn ?? input.amountAzn;
      if (challengerMax < input.amountAzn) {
        return { ok: false, error: "Maksimum avtotəklif təklif məbləğindən kiçik ola bilməz" };
      }

      const cur = auction.current_bid_azn;
      const leaderId = auction.current_bidder_user_id;
      let minRequired: number;
      if (!leaderId || cur === null) {
        minRequired = auction.starting_bid_azn;
      } else if (leaderId === input.bidderUserId && input.amountAzn >= cur) {
        minRequired = cur;
      } else {
        minRequired = cur + getMinBidIncrement(cur);
      }
      if (input.amountAzn < minRequired) {
        return {
          ok: false,
          error: `Minimum təklif ${minRequired} ₼ olmalıdır`,
          nextMinimumBidAzn: minRequired
        };
      }

      let leaderMaxForProxy: number | null = null;
      if (leaderId && leaderId !== input.bidderUserId) {
        leaderMaxForProxy =
          (await getLeaderEffectiveMax(client, input.auctionId, leaderId)) ?? cur ?? auction.starting_bid_azn;
      }

      let tieWinnerId = input.bidderUserId;
      if (leaderId && leaderId !== input.bidderUserId && leaderMaxForProxy !== null) {
        const Ma = leaderMaxForProxy;
        const Mb = challengerMax;
        if (Ma === Mb) {
          tieWinnerId = await computeTieBreakerUserId(client, input.auctionId, leaderId, input.bidderUserId);
        }
      }

      let battle: ReturnType<typeof resolveTwoPartyProxy>;
      try {
        battle = resolveTwoPartyProxy({
          startingBidAzn: auction.starting_bid_azn,
          currentBidAzn: cur,
          currentLeaderId: leaderId,
          challengerId: input.bidderUserId,
          challengerAmount: input.amountAzn,
          challengerMax,
          leaderMax: leaderId && leaderId !== input.bidderUserId ? leaderMaxForProxy : null,
          tieWinnerId
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Təklif qəbul edilmədi";
        return { ok: false, error: msg };
      }

      const nearClose = auction.ends_at.getTime() - now <= config.antiSnipingWindowMs;
      const nextEndsAt = nearClose ? new Date(auction.ends_at.getTime() + config.antiSnipingExtensionMs) : auction.ends_at;

      let lastBidRow: BidRow;

      if (!leaderId || cur === null) {
        lastBidRow = await insertBidRow(client, {
          auctionId: input.auctionId,
          bidderUserId: input.bidderUserId,
          amountAzn: battle.finalPrice,
          maxAutoBidAzn: input.autoBidMaxAzn ?? null,
          isAutoBid: battle.finalPrice !== input.amountAzn,
          source: battle.finalPrice !== input.amountAzn ? "auto" : "manual",
          ip: input.ip,
          deviceFingerprint: input.deviceFingerprint
        });
      } else if (leaderId === input.bidderUserId) {
        lastBidRow = await insertBidRow(client, {
          auctionId: input.auctionId,
          bidderUserId: input.bidderUserId,
          amountAzn: battle.finalPrice,
          maxAutoBidAzn: input.autoBidMaxAzn ?? null,
          isAutoBid: false,
          source: "manual",
          ip: input.ip,
          deviceFingerprint: input.deviceFingerprint
        });
      } else if (battle.winnerId === input.bidderUserId) {
        lastBidRow = await insertBidRow(client, {
          auctionId: input.auctionId,
          bidderUserId: input.bidderUserId,
          amountAzn: battle.finalPrice,
          maxAutoBidAzn: input.autoBidMaxAzn ?? null,
          isAutoBid: battle.finalPrice !== input.amountAzn || Boolean(input.autoBidMaxAzn),
          source: battle.finalPrice !== input.amountAzn ? "auto" : "manual",
          ip: input.ip,
          deviceFingerprint: input.deviceFingerprint
        });
      } else {
        await insertBidRow(client, {
          auctionId: input.auctionId,
          bidderUserId: input.bidderUserId,
          amountAzn: input.amountAzn,
          maxAutoBidAzn: input.autoBidMaxAzn ?? null,
          isAutoBid: Boolean(input.autoBidMaxAzn),
          source: input.autoBidMaxAzn ? "auto" : "manual",
          ip: input.ip,
          deviceFingerprint: input.deviceFingerprint
        });
        lastBidRow = await insertBidRow(client, {
          auctionId: input.auctionId,
          bidderUserId: leaderId,
          amountAzn: battle.leaderAutoAmount ?? battle.finalPrice,
          maxAutoBidAzn: null,
          isAutoBid: true,
          source: "auto",
          ip: input.ip,
          deviceFingerprint: input.deviceFingerprint
        });
      }

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
        [input.auctionId, battle.finalPrice, battle.winnerId, nearClose, nextEndsAt]
      );
      const updatedAuction = mapAuction(updatedResult.rows[0]);
      if (nearClose) {
        countAntiSnipingTrigger();
      }
      const nextMin = battle.finalPrice + getMinBidIncrement(battle.finalPrice);
      return {
        ok: true,
        bid: mapBid(lastBidRow),
        auction: updatedAuction,
        nextMinimumBidAzn: nextMin,
        extended: nearClose,
        timeExtended: nearClose
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
