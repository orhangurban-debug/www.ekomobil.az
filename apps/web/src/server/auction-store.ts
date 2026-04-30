import { randomUUID } from "node:crypto";
import { AUCTION_FEES, calcSellerPerformanceBond, getNoShowPenaltyAzn, getSellerBreachPenaltyAzn } from "@/lib/auction-fees";
import {
  type AuctionListingRecord,
  type AuctionOutcomeRecord,
  type AuctionStatus,
  resolveAuctionBidIncrement
} from "@/lib/auction";
import type { ListingDetail } from "@/lib/marketplace-types";
import { getPgPool } from "@/lib/postgres";
import { createAuctionNotification } from "@/server/auction-notification-store";
import { settleHeldDepositsForAuctionOutcome } from "@/server/auction-deposit-settlement-store";
import { getListingDetail, validateListingOwnership } from "@/server/listing-store";
import { getDeepKycStatus } from "@/server/user-kyc-store";
import {
  getAuctionAuditLogsMemory,
  getAuctionListingsMemory,
  getAuctionOutcomesMemory
} from "@/server/auction-memory";
import { assertAuctionMemoryFallbackAllowed } from "@/server/auction-runtime";

const AUCTION_SELLER_BLOCK_PENALTY_AZN = Number(process.env.AUCTION_SELLER_BLOCK_PENALTY_AZN ?? "500");

export function meetsAuctionListingTrustGate(
  listing: Pick<ListingDetail, "listingKind" | "mediaComplete" | "vinProvided">
): boolean {
  const kind = listing.listingKind ?? "vehicle";
  if (kind === "part") return Boolean(listing.mediaComplete);
  return Boolean(listing.mediaComplete && listing.vinProvided);
}

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
  seller_bond_required: boolean;
  seller_bond_amount_azn: number | null;
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

interface SellerAuctionGateRow {
  user_account_status: string;
  penalty_balance_azn: number;
}

async function getSellerAuctionGate(userId: string): Promise<SellerAuctionGateRow | null> {
  try {
    const pool = getPgPool();
    const result = await pool.query<SellerAuctionGateRow>(
      `SELECT user_account_status, penalty_balance_azn
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] ?? null;
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    return null;
  }
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
    sellerBondRequired: row.seller_bond_required,
    sellerBondAmountAzn: row.seller_bond_amount_azn ?? undefined,
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
  sellerBondRequired?: boolean;
  sellerBondAmountAzn?: number;
  vinInfoUrl?: string;
  serviceHistoryUrl?: string;
  vinDocumentRef?: string;
  serviceHistoryDocumentRef?: string;
}): Promise<{ ok: true; auction: AuctionListingRecord } | { ok: false; error: string }> {
  const sellerGate = await getSellerAuctionGate(input.sellerUserId);
  if (sellerGate) {
    if (sellerGate.user_account_status !== "active") {
      return {
        ok: false,
        error: "Hesabınız auksion satışları üçün məhdudlaşdırılıb. Dəstəyə müraciət edin."
      };
    }
    if (sellerGate.penalty_balance_azn >= AUCTION_SELLER_BLOCK_PENALTY_AZN) {
      return {
        ok: false,
        error: "Ödənilməmiş öhdəlik balansına görə yeni lot yaratmaq müvəqqəti bloklanıb."
      };
    }
  }

  const ownership = await validateListingOwnership(input.listingId, input.sellerUserId);
  if (!ownership.ok) return { ok: false, error: ownership.error ?? "Elan tapılmadı" };

  const listing = await getListingDetail(input.listingId);
  if (!listing) return { ok: false, error: "Elan tapılmadı" };
  if (!meetsAuctionListingTrustGate(listing)) {
    return {
      ok: false,
      error:
        (listing.listingKind ?? "vehicle") === "part"
          ? "Hissə elanı üçün media checklist tam olmalıdır."
          : "Auksion üçün VIN daxil edilməli və media checklist tam olmalıdır."
    };
  }

  const startsAt = input.startsAt ? new Date(input.startsAt) : new Date();
  const endsAt = input.endsAt ? new Date(input.endsAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return { ok: false, error: "Auksion vaxt aralığı düzgün deyil" };
  }

  const startingBidAzn = input.startingBidAzn ?? listing.priceAzn;
  const deepKycStatus = await getDeepKycStatus(input.sellerUserId);
  const isHighValueLot = startingBidAzn >= AUCTION_FEES.HIGH_VALUE_LOT_THRESHOLD_AZN;
  const sellerDeepKycApproved = deepKycStatus === "approved";
  const suggestedSellerBond = calcSellerPerformanceBond(startingBidAzn);
  const sellerBondRequired = Boolean(input.sellerBondRequired);
  const sellerBondAmountAzn = input.sellerBondAmountAzn ?? suggestedSellerBond;

  if (isHighValueLot && !sellerDeepKycApproved && !sellerBondRequired) {
    return {
      ok: false,
      error:
        "Yüksək dəyərli lot üçün ya dərin KYC təsdiqi olmalıdır, ya da satıcı performans bond aktiv edilməlidir."
    };
  }
  if (sellerBondRequired && (!sellerBondAmountAzn || sellerBondAmountAzn <= 0)) {
    return { ok: false, error: "Satıcı bond məbləği düzgün deyil" };
  }

  const minimumIncrementAzn = resolveAuctionBidIncrement(startingBidAzn);
  const id = randomUUID();
  const status: AuctionStatus = "draft";

  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionListingRow>(
      `INSERT INTO auction_listings (
         id, listing_id, seller_user_id, seller_dealer_profile_id, mode, settlement_model, title_snapshot,
         starting_bid_azn, reserve_price_azn, buy_now_price_azn, minimum_increment_azn,
         starts_at, ends_at, status, deposit_required, deposit_amount_azn, seller_bond_required, seller_bond_amount_azn
       )
       VALUES ($1, $2, $3, $4, $5, 'off_platform_direct', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
        input.depositAmountAzn ?? null,
        sellerBondRequired,
        sellerBondRequired ? sellerBondAmountAzn : null
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
    if (input.vinInfoUrl) {
      await recordAuctionAuditLog({
        auctionId: id,
        actorUserId: input.sellerUserId,
        actionType: "vin_reference_submitted",
        detail: `VIN source link submitted: ${input.vinInfoUrl}`
      });
    }
    if (input.serviceHistoryUrl) {
      await recordAuctionAuditLog({
        auctionId: id,
        actorUserId: input.sellerUserId,
        actionType: "service_history_reference_submitted",
        detail: `Service history link submitted: ${input.serviceHistoryUrl}`
      });
    }
    if (input.vinDocumentRef) {
      await recordAuctionAuditLog({
        auctionId: id,
        actorUserId: input.sellerUserId,
        actionType: "vin_document_reference_submitted",
        detail: `VIN document reference submitted: ${input.vinDocumentRef}`
      });
    }
    if (input.serviceHistoryDocumentRef) {
      await recordAuctionAuditLog({
        auctionId: id,
        actorUserId: input.sellerUserId,
        actionType: "service_history_document_reference_submitted",
        detail: `Service history document reference submitted: ${input.serviceHistoryDocumentRef}`
      });
    }
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
      sellerBondRequired,
      sellerBondAmountAzn: sellerBondRequired ? sellerBondAmountAzn : undefined,
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
    if (input.vinInfoUrl) {
      await recordAuctionAuditLog({
        auctionId: id,
        actorUserId: input.sellerUserId,
        actionType: "vin_reference_submitted",
        detail: `VIN source link submitted: ${input.vinInfoUrl}`
      });
    }
    if (input.serviceHistoryUrl) {
      await recordAuctionAuditLog({
        auctionId: id,
        actorUserId: input.sellerUserId,
        actionType: "service_history_reference_submitted",
        detail: `Service history link submitted: ${input.serviceHistoryUrl}`
      });
    }
    if (input.vinDocumentRef) {
      await recordAuctionAuditLog({
        auctionId: id,
        actorUserId: input.sellerUserId,
        actionType: "vin_document_reference_submitted",
        detail: `VIN document reference submitted: ${input.vinDocumentRef}`
      });
    }
    if (input.serviceHistoryDocumentRef) {
      await recordAuctionAuditLog({
        auctionId: id,
        actorUserId: input.sellerUserId,
        actionType: "service_history_document_reference_submitted",
        detail: `Service history document reference submitted: ${input.serviceHistoryDocumentRef}`
      });
    }
    return { ok: true, auction };
  }
}

export async function relistAuctionFromPrevious(input: {
  sourceAuctionId: string;
  actorUserId: string;
}): Promise<{ ok: true; auction: AuctionListingRecord } | { ok: false; error: string }> {
  const sourceAuction = await getAuctionListing(input.sourceAuctionId);
  if (!sourceAuction) return { ok: false, error: "Auksion tapılmadı" };
  if (sourceAuction.sellerUserId !== input.actorUserId) {
    return { ok: false, error: "Yalnız satıcı lotu yenidən auksiona çıxara bilər" };
  }

  const blockedStatuses: AuctionStatus[] = ["live", "extended", "scheduled"];
  if (blockedStatuses.includes(sourceAuction.status)) {
    return { ok: false, error: "Aktiv və ya planlı lotu yenidən yaratmaq olmaz" };
  }

  const sourceStartsAt = new Date(sourceAuction.startsAt);
  const sourceEndsAt = new Date(sourceAuction.endsAt);
  const sourceDurationMs = sourceEndsAt.getTime() - sourceStartsAt.getTime();
  const minDurationMs = 60 * 60 * 1000;
  const maxDurationMs = 7 * 24 * 60 * 60 * 1000;
  const boundedDurationMs = Number.isFinite(sourceDurationMs)
    ? Math.min(maxDurationMs, Math.max(minDurationMs, sourceDurationMs))
    : 24 * 60 * 60 * 1000;

  const now = new Date();
  const nextEndsAt = new Date(now.getTime() + boundedDurationMs);

  return createAuctionListing({
    listingId: sourceAuction.listingId,
    sellerUserId: input.actorUserId,
    mode: sourceAuction.mode,
    startingBidAzn: sourceAuction.startingBidAzn,
    reservePriceAzn: sourceAuction.reservePriceAzn,
    buyNowPriceAzn: sourceAuction.buyNowPriceAzn,
    startsAt: now.toISOString(),
    endsAt: nextEndsAt.toISOString(),
    depositRequired: sourceAuction.depositRequired,
    depositAmountAzn: sourceAuction.depositAmountAzn,
    sellerBondRequired: sourceAuction.sellerBondRequired,
    sellerBondAmountAzn: sourceAuction.sellerBondAmountAzn
  });
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
  outcome: "confirmed" | "no_show" | "seller_breach" | "disputed";
  note?: string;
}): Promise<{ ok: boolean; error?: string; auction?: AuctionListingRecord; outcome?: AuctionOutcomeRecord }> {
  const auction = await getAuctionListing(input.auctionId);
  if (!auction) return { ok: false, error: "Auksion tapılmadı" };
  const activeAuction = auction;
  const settlementStatuses: AuctionStatus[] = [
    "ended_pending_confirmation",
    "pending_seller_approval",
    "buyer_confirmed",
    "seller_confirmed"
  ];

  const winnerUserId = activeAuction.winnerUserId ?? activeAuction.currentBidderUserId;
  if (input.actorRole === "seller" && activeAuction.sellerUserId !== input.actorUserId) {
    return { ok: false, error: "Yalnız satıcı bu əməliyyatı edə bilər" };
  }
  if (input.actorRole === "buyer" && winnerUserId !== input.actorUserId) {
    return { ok: false, error: "Yalnız qalib alıcı bu əməliyyatı edə bilər" };
  }
  if (!settlementStatuses.includes(activeAuction.status)) {
    return { ok: false, error: "Bu auksion statusunda nəticə təsdiqi mümkün deyil" };
  }

  const now = new Date();
  let nextStatus: AuctionStatus = activeAuction.status;
  let buyerConfirmedAt = activeAuction.buyerConfirmedAt;
  let sellerConfirmedAt = activeAuction.sellerConfirmedAt;
  let saleConfirmedAt = activeAuction.saleConfirmedAt;
  let noShowReportedAt = activeAuction.noShowReportedAt;
  let disputeReason = activeAuction.disputeReason;

  async function notifyCounterpart(status: AuctionStatus): Promise<void> {
    const targetUserId =
      input.actorRole === "buyer" ? activeAuction.sellerUserId : winnerUserId;
    if (!targetUserId) return;

    if (status === "buyer_confirmed") {
      await createAuctionNotification({
        userId: activeAuction.sellerUserId,
        auctionId: activeAuction.id,
        type: "buyer_confirmed",
        title: "Alıcı nəticəni təsdiqlədi",
        message: `"${activeAuction.titleSnapshot}" lotunda alıcı təsdiq verdi. Siz də təsdiqləyin.`,
        ctaHref: `/auction/${activeAuction.id}/confirm`
      });
      return;
    }
    if (status === "seller_confirmed" && winnerUserId) {
      await createAuctionNotification({
        userId: winnerUserId,
        auctionId: activeAuction.id,
        type: "seller_confirmed",
        title: "Satıcı nəticəni təsdiqlədi",
        message: `"${activeAuction.titleSnapshot}" lotunda satıcı təsdiq verdi. Siz də təsdiqləyin.`,
        ctaHref: `/auction/${activeAuction.id}/confirm`
      });
      return;
    }
    if (status === "completed") {
      await Promise.all([
        winnerUserId
          ? createAuctionNotification({
              userId: winnerUserId,
              auctionId: activeAuction.id,
              type: "auction_completed",
              title: "Auksion tamamlandı",
              message: `"${activeAuction.titleSnapshot}" lotu hər iki tərəf tərəfindən təsdiqləndi.`,
              ctaHref: `/auction/${activeAuction.id}/confirm`
            })
          : Promise.resolve(),
        createAuctionNotification({
          userId: activeAuction.sellerUserId,
          auctionId: activeAuction.id,
          type: "auction_completed",
          title: "Auksion tamamlandı",
          message: `"${activeAuction.titleSnapshot}" lotu hər iki tərəf tərəfindən təsdiqləndi.`,
          ctaHref: `/auction/${activeAuction.id}/confirm`
        })
      ]);
      return;
    }
    if (status === "disputed") {
      await createAuctionNotification({
        userId: targetUserId,
        auctionId: activeAuction.id,
        type: "auction_disputed",
        title: "Mübahisə açıldı",
        message: `"${activeAuction.titleSnapshot}" lotu üzrə mübahisə açıldı. Sübutlarınızı əlavə edin.`,
        ctaHref: `/auction/${activeAuction.id}/confirm`
      });
      return;
    }
    if (status === "no_show" && winnerUserId) {
      await createAuctionNotification({
        userId: winnerUserId,
        auctionId: activeAuction.id,
        type: "buyer_obligation_fee",
        title: "Alıcı öhdəlik haqqı tətbiq edildi",
        message: `"${activeAuction.titleSnapshot}" lotu üzrə öhdəlik pozuntusu qeydə alındı. Checkout-u tamamlayın.`,
        ctaHref: `/auction/${activeAuction.id}/confirm`
      });
      return;
    }
    if (status === "seller_breach") {
      await createAuctionNotification({
        userId: activeAuction.sellerUserId,
        auctionId: activeAuction.id,
        type: "seller_obligation_fee",
        title: "Satıcı öhdəlik haqqı tətbiq edildi",
        message: `"${activeAuction.titleSnapshot}" lotu üzrə satıcı öhdəliyi pozulması qeydə alındı. Checkout-u tamamlayın.`,
        ctaHref: `/auction/${activeAuction.id}/confirm`
      });
    }
  }

  if (input.outcome === "disputed") {
    nextStatus = "disputed";
    disputeReason = input.note ?? "İstifadəçi tərəfindən dispute yaradıldı";
  } else if (input.outcome === "no_show") {
    if (input.actorRole !== "seller") {
      return { ok: false, error: "No-show yalnız satıcı tərəfindən qeydə alına bilər" };
    }
    nextStatus = "no_show";
    noShowReportedAt = now.toISOString();
  } else if (input.outcome === "seller_breach") {
    if (input.actorRole !== "buyer") {
      return { ok: false, error: "Satıcı öhdəliyinin pozulması yalnız qalib alıcı tərəfindən qeydə alına bilər" };
    }
    const preBreach: AuctionStatus[] = ["ended_pending_confirmation", "buyer_confirmed", "seller_confirmed"];
    if (!preBreach.includes(auction.status)) {
      return { ok: false, error: "Bu auksion statusunda satıcı öhdəliyi qeydi mümkün deyil" };
    }
    nextStatus = "seller_breach";
    disputeReason = input.note ?? "Qalib alıcı satıcının satış öhdəliyini pozduğunu bildirir";
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
            : nextStatus === "seller_breach"
              ? "seller_breach"
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

    // Öhdəlik haqqı müvafiq istifadəçinin balansına əlavə edilir.
    // Bu məbləği bid preflight (getUserBidGate) yoxlayır — tənzimlənən qədər bidding bloklanır.
    if (nextStatus === "no_show" && winnerUserId) {
      const kindRow = await pool.query<{ listing_kind: string }>(
        `SELECT l.listing_kind FROM auction_listings a
         JOIN listings l ON l.id = a.listing_id
         WHERE a.id = $1 LIMIT 1`,
        [auction.id]
      );
      const kind = kindRow.rows[0]?.listing_kind === "part" ? "part" as const : "vehicle" as const;
      await pool.query(
        `UPDATE users SET penalty_balance_azn = penalty_balance_azn + $1 WHERE id = $2`,
        [getNoShowPenaltyAzn(kind), winnerUserId]
      );
    }
    if (nextStatus === "seller_breach" && auction.sellerUserId) {
      const kindRow = await pool.query<{ listing_kind: string }>(
        `SELECT l.listing_kind FROM auction_listings a
         JOIN listings l ON l.id = a.listing_id
         WHERE a.id = $1 LIMIT 1`,
        [auction.id]
      );
      const kind = kindRow.rows[0]?.listing_kind === "part" ? "part" as const : "vehicle" as const;
      await pool.query(
        `UPDATE users SET penalty_balance_azn = penalty_balance_azn + $1 WHERE id = $2`,
        [getSellerBreachPenaltyAzn(kind), auction.sellerUserId]
      );
    }

    const depositSettlement = await settleHeldDepositsForAuctionOutcome({
      auctionId: auction.id,
      outcomeStatus: nextStatus,
      winnerUserId
    });
    if (depositSettlement.returned > 0 || depositSettlement.forfeited > 0) {
      await recordAuctionAuditLog({
        auctionId: auction.id,
        actorUserId: input.actorUserId,
        actionType: "auction_deposit_settled",
        detail: `returned=${depositSettlement.returned}; forfeited=${depositSettlement.forfeited}; status=${nextStatus}`
      });
    }

    await notifyCounterpart(nextStatus).catch(() => undefined);

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
            : nextStatus === "seller_breach"
              ? "seller_breach"
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
