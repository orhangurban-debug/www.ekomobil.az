import { randomUUID } from "node:crypto";
import {
  type AuctionListingRecord,
  type AuctionOutcomeRecord,
  type AuctionStatus,
  resolveAuctionBidIncrement
} from "@/lib/auction";
import { getPgPool } from "@/lib/postgres";
import { getListingDetail, validateListingOwnership } from "@/server/listing-store";
import {
  getAuctionAuditLogsMemory,
  getAuctionListingsMemory,
  getAuctionOutcomesMemory
} from "@/server/auction-memory";
import { assertAuctionMemoryFallbackAllowed } from "@/server/auction-runtime";

interface AuctionListingRow {
  id: string;
  listing_id: string;
  seller_user_id: string;
  seller_dealer_profile_id: string | null;
  mode: string;
  settlement_model: string;
  title_snapshot: string;
  starting_bid_azn: number;
  reserve_price_azn: number | null;
  buy_now_price_azn: number | null;
  current_bid_azn: number | null;
  current_bidder_user_id: string | null;
  minimum_increment_azn: number;
  starts_at: Date;
  ends_at: Date;
  status: string;
  deposit_required: boolean;
  deposit_amount_azn: number | null;
  winner_user_id: string | null;
  buyer_confirmed_at: Date | null;
  seller_confirmed_at: Date | null;
  sale_confirmed_at: Date | null;
  no_show_reported_at: Date | null;
  dispute_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

interface AuctionOutcomeRow {
  id: string;
  auction_id: string;
  winner_user_id: string | null;
  winning_bid_azn: number | null;
  status: string;
  buyer_confirmed_at: Date | null;
  seller_confirmed_at: Date | null;
  completed_at: Date | null;
  no_show_at: Date | null;
  ops_verified_at: Date | null;
  resolution_note: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapAuctionRow(row: AuctionListingRow): AuctionListingRecord {
  return {
    id: row.id,
    listingId: row.listing_id,
    sellerUserId: row.seller_user_id,
    sellerDealerProfileId: row.seller_dealer_profile_id ?? undefined,
    mode: row.mode as AuctionListingRecord["mode"],
    settlementModel: row.settlement_model as AuctionListingRecord["settlementModel"],
    titleSnapshot: row.title_snapshot,
    startingBidAzn: row.starting_bid_azn,
    reservePriceAzn: row.reserve_price_azn ?? undefined,
    buyNowPriceAzn: row.buy_now_price_azn ?? undefined,
    currentBidAzn: row.current_bid_azn ?? undefined,
    currentBidderUserId: row.current_bidder_user_id ?? undefined,
    minimumIncrementAzn: row.minimum_increment_azn,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at.toISOString(),
    status: row.status as AuctionStatus,
    depositRequired: row.deposit_required,
    depositAmountAzn: row.deposit_amount_azn ?? undefined,
    winnerUserId: row.winner_user_id ?? undefined,
    buyerConfirmedAt: row.buyer_confirmed_at?.toISOString(),
    sellerConfirmedAt: row.seller_confirmed_at?.toISOString(),
    saleConfirmedAt: row.sale_confirmed_at?.toISOString(),
    noShowReportedAt: row.no_show_reported_at?.toISOString(),
    disputeReason: row.dispute_reason ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function mapOutcomeRow(row: AuctionOutcomeRow): AuctionOutcomeRecord {
  return {
    id: row.id,
    auctionId: row.auction_id,
    winnerUserId: row.winner_user_id ?? undefined,
    winningBidAzn: row.winning_bid_azn ?? undefined,
    status: row.status as AuctionOutcomeRecord["status"],
    buyerConfirmedAt: row.buyer_confirmed_at?.toISOString(),
    sellerConfirmedAt: row.seller_confirmed_at?.toISOString(),
    completedAt: row.completed_at?.toISOString(),
    noShowAt: row.no_show_at?.toISOString(),
    opsVerifiedAt: row.ops_verified_at?.toISOString(),
    resolutionNote: row.resolution_note ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export function resolveAuctionActivationStatus(startsAt: Date, endsAt: Date): AuctionStatus {
  const now = Date.now();
  if (endsAt.getTime() <= now) return "ended_pending_confirmation";
  if (startsAt.getTime() > now) return "scheduled";
  return "live";
}

export async function recordAuctionAuditLog(input: {
  auctionId: string;
  actorUserId?: string;
  actionType: string;
  detail: string;
}): Promise<void> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  try {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO auction_audit_logs (id, auction_id, actor_user_id, action_type, detail)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, input.auctionId, input.actorUserId ?? null, input.actionType, input.detail]
    );
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    getAuctionAuditLogsMemory().unshift({
      id,
      auctionId: input.auctionId,
      actorUserId: input.actorUserId,
      actionType: input.actionType,
      detail: input.detail,
      createdAt
    });
  }
}

export async function createAuctionListing(input: {
  listingId: string;
  sellerUserId: string;
  mode?: "ascending" | "reserve";
  startingBidAzn?: number;
  reservePriceAzn?: number;
  buyNowPriceAzn?: number;
  startsAt?: string;
  endsAt?: string;
  depositRequired?: boolean;
  depositAmountAzn?: number;
}): Promise<{ ok: true; auction: AuctionListingRecord } | { ok: false; error: string }> {
  const ownership = await validateListingOwnership(input.listingId, input.sellerUserId);
  if (!ownership.ok) return { ok: false, error: ownership.error ?? "Elan tapılmadı" };

  const listing = await getListingDetail(input.listingId);
  if (!listing) return { ok: false, error: "Elan tapılmadı" };
  if (!listing.vinVerified || !listing.sellerVerified || !listing.mediaComplete) {
    return { ok: false, error: "Auksion üçün VIN, satıcı və media yoxlaması tam olmalıdır" };
  }

  const startsAt = input.startsAt ? new Date(input.startsAt) : new Date();
  const endsAt = input.endsAt ? new Date(input.endsAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return { ok: false, error: "Auksion vaxt aralığı düzgün deyil" };
  }

  const startingBidAzn = input.startingBidAzn ?? listing.priceAzn;
  const minimumIncrementAzn = resolveAuctionBidIncrement(startingBidAzn);
  const id = randomUUID();
  const status: AuctionStatus = "draft";

  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionListingRow>(
      `INSERT INTO auction_listings (
         id, listing_id, seller_user_id, seller_dealer_profile_id, mode, settlement_model, title_snapshot,
         starting_bid_azn, reserve_price_azn, buy_now_price_azn, minimum_increment_azn,
         starts_at, ends_at, status, deposit_required, deposit_amount_azn
       )
       VALUES ($1, $2, $3, $4, $5, 'off_platform_direct', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        id,
        input.listingId,
        input.sellerUserId,
        listing.dealerProfileId ?? null,
        input.mode ?? "ascending",
        listing.title,
        startingBidAzn,
        input.reservePriceAzn ?? null,
        input.buyNowPriceAzn ?? null,
        minimumIncrementAzn,
        startsAt,
        endsAt,
        status,
        input.depositRequired ?? false,
        input.depositAmountAzn ?? null
      ]
    );
    await recordAuctionAuditLog({
      auctionId: id,
      actorUserId: input.sellerUserId,
      actionType: "auction_created",
      detail: `Lot created for listing ${input.listingId}`
    });
    await recordAuctionAuditLog({
      auctionId: id,
      actorUserId: input.sellerUserId,
      actionType: "moderation_pending",
      detail: "Lot is waiting for payment and moderation clearance"
    });
    return { ok: true, auction: mapAuctionRow(result.rows[0]) };
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    const nowIso = new Date().toISOString();
    const auction: AuctionListingRecord = {
      id,
      listingId: input.listingId,
      sellerUserId: input.sellerUserId,
      sellerDealerProfileId: listing.dealerProfileId,
      mode: input.mode ?? "ascending",
      settlementModel: "off_platform_direct",
      titleSnapshot: listing.title,
      startingBidAzn,
      reservePriceAzn: input.reservePriceAzn,
      buyNowPriceAzn: input.buyNowPriceAzn,
      minimumIncrementAzn,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status,
      depositRequired: input.depositRequired ?? false,
      depositAmountAzn: input.depositAmountAzn,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    getAuctionListingsMemory().unshift(auction);
    await recordAuctionAuditLog({
      auctionId: id,
      actorUserId: input.sellerUserId,
      actionType: "auction_created",
      detail: `Lot created in fallback store for listing ${input.listingId}`
    });
    await recordAuctionAuditLog({
      auctionId: id,
      actorUserId: input.sellerUserId,
      actionType: "moderation_pending",
      detail: "Lot is waiting for payment and moderation clearance"
    });
    return { ok: true, auction };
  }
}

export async function getAuctionListing(auctionId: string): Promise<AuctionListingRecord | null> {
  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionListingRow>(
      `SELECT * FROM auction_listings WHERE id = $1 LIMIT 1`,
      [auctionId]
    );
    return result.rows[0] ? mapAuctionRow(result.rows[0]) : null;
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    return getAuctionListingsMemory().find((item) => item.id === auctionId) ?? null;
  }
}

export async function listAuctionListings(limit = 20): Promise<AuctionListingRecord[]> {
  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionListingRow>(
      `SELECT * FROM auction_listings ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows.map(mapAuctionRow);
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    return getAuctionListingsMemory().slice(0, limit);
  }
}

async function upsertAuctionOutcome(input: {
  auction: AuctionListingRecord;
  status: AuctionOutcomeRecord["status"];
  note?: string;
}): Promise<AuctionOutcomeRecord> {
  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionOutcomeRow>(
      `INSERT INTO auction_outcomes (
         id, auction_id, winner_user_id, winning_bid_azn, status, resolution_note
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (auction_id) DO UPDATE SET
         winner_user_id = EXCLUDED.winner_user_id,
         winning_bid_azn = EXCLUDED.winning_bid_azn,
         status = EXCLUDED.status,
         resolution_note = COALESCE(EXCLUDED.resolution_note, auction_outcomes.resolution_note),
         updated_at = NOW()
       RETURNING *`,
      [
        randomUUID(),
        input.auction.id,
        input.auction.winnerUserId ?? input.auction.currentBidderUserId ?? null,
        input.auction.currentBidAzn ?? null,
        input.status,
        input.note ?? null
      ]
    );
    return mapOutcomeRow(result.rows[0]);
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    const items = getAuctionOutcomesMemory();
    const existing = items.find((item) => item.auctionId === input.auction.id);
    const nowIso = new Date().toISOString();
    if (existing) {
      existing.winnerUserId = input.auction.winnerUserId ?? input.auction.currentBidderUserId;
      existing.winningBidAzn = input.auction.currentBidAzn;
      existing.status = input.status;
      existing.resolutionNote = input.note ?? existing.resolutionNote;
      existing.updatedAt = nowIso;
      return existing;
    }
    const outcome: AuctionOutcomeRecord = {
      id: randomUUID(),
      auctionId: input.auction.id,
      winnerUserId: input.auction.winnerUserId ?? input.auction.currentBidderUserId,
      winningBidAzn: input.auction.currentBidAzn,
      status: input.status,
      resolutionNote: input.note,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    items.unshift(outcome);
    return outcome;
  }
}

export async function confirmAuctionSale(input: {
  auctionId: string;
  actorUserId: string;
  actorRole: "buyer" | "seller";
  outcome: "confirmed" | "no_show" | "disputed";
  note?: string;
}): Promise<{ ok: boolean; error?: string; auction?: AuctionListingRecord; outcome?: AuctionOutcomeRecord }> {
  const auction = await getAuctionListing(input.auctionId);
  if (!auction) return { ok: false, error: "Auksion tapılmadı" };

  const winnerUserId = auction.winnerUserId ?? auction.currentBidderUserId;
  if (input.actorRole === "seller" && auction.sellerUserId !== input.actorUserId) {
    return { ok: false, error: "Yalnız satıcı bu əməliyyatı edə bilər" };
  }
  if (input.actorRole === "buyer" && winnerUserId !== input.actorUserId) {
    return { ok: false, error: "Yalnız qalib alıcı bu əməliyyatı edə bilər" };
  }

  const now = new Date();
  let nextStatus: AuctionStatus = auction.status;
  let buyerConfirmedAt = auction.buyerConfirmedAt;
  let sellerConfirmedAt = auction.sellerConfirmedAt;
  let saleConfirmedAt = auction.saleConfirmedAt;
  let noShowReportedAt = auction.noShowReportedAt;
  let disputeReason = auction.disputeReason;

  if (input.outcome === "disputed") {
    nextStatus = "disputed";
    disputeReason = input.note ?? "İstifadəçi tərəfindən dispute yaradıldı";
  } else if (input.outcome === "no_show") {
    nextStatus = "no_show";
    noShowReportedAt = now.toISOString();
  } else if (input.actorRole === "buyer") {
    buyerConfirmedAt = now.toISOString();
    nextStatus = auction.sellerConfirmedAt ? "completed" : "buyer_confirmed";
    if (auction.sellerConfirmedAt) saleConfirmedAt = now.toISOString();
  } else {
    sellerConfirmedAt = now.toISOString();
    nextStatus = auction.buyerConfirmedAt ? "completed" : "seller_confirmed";
    if (auction.buyerConfirmedAt) saleConfirmedAt = now.toISOString();
  }

  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionListingRow>(
      `UPDATE auction_listings
       SET status = $2,
           winner_user_id = COALESCE(winner_user_id, current_bidder_user_id),
           buyer_confirmed_at = COALESCE($3, buyer_confirmed_at),
           seller_confirmed_at = COALESCE($4, seller_confirmed_at),
           sale_confirmed_at = COALESCE($5, sale_confirmed_at),
           no_show_reported_at = COALESCE($6, no_show_reported_at),
           dispute_reason = COALESCE($7, dispute_reason),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        auction.id,
        nextStatus,
        buyerConfirmedAt ? new Date(buyerConfirmedAt) : null,
        sellerConfirmedAt ? new Date(sellerConfirmedAt) : null,
        saleConfirmedAt ? new Date(saleConfirmedAt) : null,
        noShowReportedAt ? new Date(noShowReportedAt) : null,
        disputeReason ?? null
      ]
    );
    const updatedAuction = mapAuctionRow(result.rows[0]);
    const outcome = await upsertAuctionOutcome({
      auction: updatedAuction,
      status:
        nextStatus === "completed"
          ? "completed"
          : nextStatus === "no_show"
            ? "no_show"
            : nextStatus === "disputed"
              ? "disputed"
              : nextStatus === "buyer_confirmed"
                ? "buyer_confirmed"
                : nextStatus === "seller_confirmed"
                  ? "seller_confirmed"
                  : "ended_pending_confirmation",
      note: input.note
    });
    await recordAuctionAuditLog({
      auctionId: auction.id,
      actorUserId: input.actorUserId,
      actionType: `auction_${input.outcome}`,
      detail: `${input.actorRole} marked outcome as ${input.outcome}`
    });
    return { ok: true, auction: updatedAuction, outcome };
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    const items = getAuctionListingsMemory();
    const existing = items.find((item) => item.id === auction.id);
    if (!existing) return { ok: false, error: "Auksion tapılmadı" };
    existing.winnerUserId = existing.winnerUserId ?? existing.currentBidderUserId;
    existing.status = nextStatus;
    existing.buyerConfirmedAt = buyerConfirmedAt;
    existing.sellerConfirmedAt = sellerConfirmedAt;
    existing.saleConfirmedAt = saleConfirmedAt;
    existing.noShowReportedAt = noShowReportedAt;
    existing.disputeReason = disputeReason;
    existing.updatedAt = now.toISOString();
    const outcome = await upsertAuctionOutcome({
      auction: existing,
      status:
        nextStatus === "completed"
          ? "completed"
          : nextStatus === "no_show"
            ? "no_show"
            : nextStatus === "disputed"
              ? "disputed"
              : nextStatus === "buyer_confirmed"
                ? "buyer_confirmed"
                : nextStatus === "seller_confirmed"
                  ? "seller_confirmed"
                  : "ended_pending_confirmation",
      note: input.note
    });
    await recordAuctionAuditLog({
      auctionId: auction.id,
      actorUserId: input.actorUserId,
      actionType: `auction_${input.outcome}`,
      detail: `${input.actorRole} marked outcome as ${input.outcome}`
    });
    return { ok: true, auction: existing, outcome };
  }
}
