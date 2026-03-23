import { randomUUID } from "node:crypto";
import { AUCTION_FEES, calcSellerCommission } from "@/lib/auction-fees";
import {
  type AuctionDepositRecord,
  type AuctionFinancialEventRecord,
  type AuctionParticipantRecord
} from "@/lib/auction";
import { getPgPool } from "@/lib/postgres";
import { prepareKapitalBankCheckoutSession } from "@/server/payments/kapital-bank-provider";
import {
  getAuctionDepositsMemory,
  getAuctionFinancialEventsMemory,
  getAuctionListingsMemory,
  getAuctionParticipantsMemory
} from "@/server/auction-memory";
import { assertAuctionMemoryFallbackAllowed } from "@/server/auction-runtime";
import { getAuctionListing, recordAuctionAuditLog, resolveAuctionActivationStatus } from "@/server/auction-store";

interface AuctionFinancialEventRow {
  id: string;
  auction_id: string;
  user_id: string | null;
  event_type: string;
  amount_azn: number;
  provider: string | null;
  status: string;
  checkout_url: string | null;
  payment_reference: string | null;
  provider_mode: string | null;
  checkout_strategy: string | null;
  provider_payload: AuctionFinancialEventRecord["providerPayload"] | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

interface AuctionDepositRow {
  id: string;
  auction_id: string;
  bidder_user_id: string;
  amount_azn: number;
  provider: string;
  status: string;
  checkout_url: string | null;
  payment_reference: string | null;
  provider_mode: string | null;
  checkout_strategy: string | null;
  provider_payload: AuctionDepositRecord["providerPayload"] | null;
  returned_at: Date | null;
  forfeited_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function mapFinancialEventRow(row: AuctionFinancialEventRow): AuctionFinancialEventRecord {
  return {
    id: row.id,
    auctionId: row.auction_id,
    userId: row.user_id ?? undefined,
    eventType: row.event_type as AuctionFinancialEventRecord["eventType"],
    amountAzn: row.amount_azn,
    provider: (row.provider as "kapital_bank" | null) ?? undefined,
    status: row.status as AuctionFinancialEventRecord["status"],
    checkoutUrl: row.checkout_url ?? undefined,
    paymentReference: row.payment_reference ?? undefined,
    providerMode: row.provider_mode as AuctionFinancialEventRecord["providerMode"],
    checkoutStrategy: row.checkout_strategy as AuctionFinancialEventRecord["checkoutStrategy"],
    providerPayload: row.provider_payload ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function mapDepositRow(row: AuctionDepositRow): AuctionDepositRecord {
  return {
    id: row.id,
    auctionId: row.auction_id,
    bidderUserId: row.bidder_user_id,
    amountAzn: row.amount_azn,
    provider: row.provider as "kapital_bank",
    status: row.status as AuctionDepositRecord["status"],
    checkoutUrl: row.checkout_url ?? undefined,
    paymentReference: row.payment_reference ?? undefined,
    providerMode: row.provider_mode as AuctionDepositRecord["providerMode"],
    checkoutStrategy: row.checkout_strategy as AuctionDepositRecord["checkoutStrategy"],
    providerPayload: row.provider_payload ?? undefined,
    returnedAt: row.returned_at?.toISOString(),
    forfeitedAt: row.forfeited_at?.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function getServicePaymentAmount(eventType: AuctionFinancialEventRecord["eventType"], hammerPriceAzn?: number): number {
  switch (eventType) {
    case "lot_fee":
      return AUCTION_FEES.LOT_LISTING_FEE_AZN;
    case "no_show_penalty":
      return AUCTION_FEES.NO_SHOW_PENALTY_AZN;
    case "seller_success_fee":
      return calcSellerCommission(hammerPriceAzn ?? 0);
    case "bidder_deposit":
      return 0;
  }
}

export async function createAuctionServicePayment(input: {
  auctionId: string;
  actorUserId: string;
  eventType: Exclude<AuctionFinancialEventRecord["eventType"], "bidder_deposit">;
  notes?: string;
}): Promise<{ ok: true; payment: AuctionFinancialEventRecord } | { ok: false; error: string }> {
  const auction = await getAuctionListing(input.auctionId);
  if (!auction) return { ok: false, error: "Auksion tapılmadı" };

  const winnerUserId = auction.winnerUserId ?? auction.currentBidderUserId;
  let chargedUserId: string | undefined;
  if (input.eventType === "lot_fee") {
    if (auction.sellerUserId !== input.actorUserId) return { ok: false, error: "Lot haqqını yalnız satıcı yarada bilər" };
    chargedUserId = auction.sellerUserId;
  } else if (input.eventType === "seller_success_fee") {
    if (auction.sellerUserId !== input.actorUserId) return { ok: false, error: "Success fee invoice yalnız satıcı üçün yaradıla bilər" };
    if (auction.status !== "completed" && !auction.saleConfirmedAt) {
      return { ok: false, error: "Success fee yalnız təsdiqlənmiş satışdan sonra yaradıla bilər" };
    }
    chargedUserId = auction.sellerUserId;
  } else {
    if (auction.sellerUserId !== input.actorUserId) return { ok: false, error: "No-show cəriməsini yalnız satıcı başladır" };
    if (!winnerUserId) return { ok: false, error: "Qalib alıcı tapılmadı" };
    chargedUserId = winnerUserId;
  }

  const amountAzn = getServicePaymentAmount(input.eventType, auction.currentBidAzn ?? auction.startingBidAzn);
  const id = randomUUID();
  const session = await prepareKapitalBankCheckoutSession({
    internalPaymentId: id,
    amountAzn,
    description: `Auction ${input.eventType} payment`,
    checkoutPagePath: `/payments/auction-service/${id}`,
    callbackPath: "/api/payments/auction-service/callback",
    successPath: `/payments/auction-service/${id}?status=success`,
    cancelPath: `/payments/auction-service/${id}?status=cancelled`
  });

  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionFinancialEventRow>(
      `INSERT INTO auction_financial_events (
         id, auction_id, user_id, event_type, amount_azn, provider, status, checkout_url,
         provider_mode, checkout_strategy, provider_payload, notes
       )
       VALUES ($1, $2, $3, $4, $5, 'kapital_bank', 'redirect_ready', $6, $7, $8, $9::jsonb, $10)
       RETURNING *`,
      [
        id,
        input.auctionId,
        chargedUserId ?? null,
        input.eventType,
        amountAzn,
        session.checkoutUrl,
        session.providerMode,
        session.checkoutStrategy,
        JSON.stringify(session.payload),
        input.notes ?? null
      ]
    );
    await recordAuctionAuditLog({
      auctionId: input.auctionId,
      actorUserId: input.actorUserId,
      actionType: `payment_${input.eventType}_created`,
      detail: `${input.eventType} created for ${amountAzn} AZN`
    });
    return { ok: true, payment: mapFinancialEventRow(result.rows[0]) };
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    const nowIso = new Date().toISOString();
    const payment: AuctionFinancialEventRecord = {
      id,
      auctionId: input.auctionId,
      userId: chargedUserId,
      eventType: input.eventType,
      amountAzn,
      provider: "kapital_bank",
      status: "redirect_ready",
      checkoutUrl: session.checkoutUrl,
      providerMode: session.providerMode,
      checkoutStrategy: session.checkoutStrategy,
      providerPayload: session.payload,
      notes: input.notes,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    getAuctionFinancialEventsMemory().unshift(payment);
    await recordAuctionAuditLog({
      auctionId: input.auctionId,
      actorUserId: input.actorUserId,
      actionType: `payment_${input.eventType}_created`,
      detail: `${input.eventType} created for ${amountAzn} AZN`
    });
    return { ok: true, payment };
  }
}

export async function getAuctionServicePayment(paymentId: string): Promise<AuctionFinancialEventRecord | null> {
  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionFinancialEventRow>(
      `SELECT * FROM auction_financial_events WHERE id = $1 LIMIT 1`,
      [paymentId]
    );
    return result.rows[0] ? mapFinancialEventRow(result.rows[0]) : null;
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    return getAuctionFinancialEventsMemory().find((item) => item.id === paymentId) ?? null;
  }
}

export async function finalizeAuctionServicePayment(input: {
  paymentId: string;
  status: "succeeded" | "failed" | "cancelled";
  paymentReference?: string;
}): Promise<{ ok: boolean; error?: string; payment?: AuctionFinancialEventRecord }> {
  const payment = await getAuctionServicePayment(input.paymentId);
  if (!payment) return { ok: false, error: "Ödəniş tapılmadı" };

  const updateInMemory = () => {
    const item = getAuctionFinancialEventsMemory().find((entry) => entry.id === input.paymentId);
    if (!item) return null;
    item.status = input.status;
    item.paymentReference = input.paymentReference ?? item.paymentReference;
    item.updatedAt = new Date().toISOString();
    return item;
  };

  let updated: AuctionFinancialEventRecord | null = null;
  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionFinancialEventRow>(
      `UPDATE auction_financial_events
       SET status = $2,
           payment_reference = COALESCE($3, payment_reference),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [input.paymentId, input.status, input.paymentReference ?? null]
    );
    updated = result.rows[0] ? mapFinancialEventRow(result.rows[0]) : null;
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    updated = updateInMemory();
  }
  if (!updated) return { ok: false, error: "Ödəniş tapılmadı" };

  if (input.status === "succeeded" && updated.eventType === "lot_fee") {
    const auction = await getAuctionListing(updated.auctionId);
    if (auction) {
      const nextStatus = resolveAuctionActivationStatus(new Date(auction.startsAt), new Date(auction.endsAt));
      try {
        await getPgPool().query(
          `UPDATE auction_listings SET status = $2, updated_at = NOW() WHERE id = $1`,
          [auction.id, nextStatus]
        );
      } catch (error) {
        assertAuctionMemoryFallbackAllowed(error);
        const item = getAuctionListingsMemory().find((entry) => entry.id === auction.id);
        if (item) {
          item.status = nextStatus;
          item.updatedAt = new Date().toISOString();
        }
      }
    }
  }

  await recordAuctionAuditLog({
    auctionId: updated.auctionId,
    actorUserId: updated.userId,
    actionType: `payment_${updated.eventType}_${input.status}`,
    detail: `${updated.eventType} marked ${input.status}`
  });

  return { ok: true, payment: updated };
}

async function updateParticipantDepositStatus(
  auctionId: string,
  bidderUserId: string,
  status: AuctionParticipantRecord["depositStatus"]
): Promise<void> {
  try {
    await getPgPool().query(
      `UPDATE auction_participants
       SET deposit_status = $3, updated_at = NOW()
       WHERE auction_id = $1 AND bidder_user_id = $2`,
      [auctionId, bidderUserId, status]
    );
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    const item = getAuctionParticipantsMemory().find((entry) => entry.auctionId === auctionId && entry.bidderUserId === bidderUserId);
    if (item) {
      item.depositStatus = status;
      item.updatedAt = new Date().toISOString();
    }
  }
}

export async function createAuctionDeposit(input: {
  auctionId: string;
  bidderUserId: string;
}): Promise<{ ok: true; deposit: AuctionDepositRecord } | { ok: false; error: string }> {
  const auction = await getAuctionListing(input.auctionId);
  if (!auction) return { ok: false, error: "Auksion tapılmadı" };
  if (!auction.depositRequired || !auction.depositAmountAzn) {
    return { ok: false, error: "Bu lot üçün deposit tələb olunmur" };
  }
  if (auction.sellerUserId === input.bidderUserId) {
    return { ok: false, error: "Satıcı deposit yarada bilməz" };
  }

  const id = randomUUID();
  const session = await prepareKapitalBankCheckoutSession({
    internalPaymentId: id,
    amountAzn: auction.depositAmountAzn,
    description: "Auction bidder deposit",
    checkoutPagePath: `/payments/auction-deposit/${id}`,
    callbackPath: "/api/payments/auction-deposit/callback",
    successPath: `/payments/auction-deposit/${id}?status=success`,
    cancelPath: `/payments/auction-deposit/${id}?status=cancelled`
  });
  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionDepositRow>(
      `INSERT INTO auction_deposits (
         id, auction_id, bidder_user_id, amount_azn, provider, status, checkout_url,
         provider_mode, checkout_strategy, provider_payload
       )
       VALUES ($1, $2, $3, $4, 'kapital_bank', 'redirect_ready', $5, $6, $7, $8::jsonb)
       RETURNING *`,
      [
        id,
        input.auctionId,
        input.bidderUserId,
        auction.depositAmountAzn,
        session.checkoutUrl,
        session.providerMode,
        session.checkoutStrategy,
        JSON.stringify(session.payload)
      ]
    );
    await updateParticipantDepositStatus(input.auctionId, input.bidderUserId, "redirect_ready");
    await recordAuctionAuditLog({
      auctionId: input.auctionId,
      actorUserId: input.bidderUserId,
      actionType: "auction_deposit_created",
      detail: `Deposit created for ${auction.depositAmountAzn} AZN`
    });
    return { ok: true, deposit: mapDepositRow(result.rows[0]) };
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    const nowIso = new Date().toISOString();
    const deposit: AuctionDepositRecord = {
      id,
      auctionId: input.auctionId,
      bidderUserId: input.bidderUserId,
      amountAzn: auction.depositAmountAzn,
      provider: "kapital_bank",
      status: "redirect_ready",
      checkoutUrl: session.checkoutUrl,
      providerMode: session.providerMode,
      checkoutStrategy: session.checkoutStrategy,
      providerPayload: session.payload,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    getAuctionDepositsMemory().unshift(deposit);
    await updateParticipantDepositStatus(input.auctionId, input.bidderUserId, "redirect_ready");
    await recordAuctionAuditLog({
      auctionId: input.auctionId,
      actorUserId: input.bidderUserId,
      actionType: "auction_deposit_created",
      detail: `Deposit created for ${auction.depositAmountAzn} AZN`
    });
    return { ok: true, deposit };
  }
}

export async function getAuctionDeposit(depositId: string): Promise<AuctionDepositRecord | null> {
  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionDepositRow>(
      `SELECT * FROM auction_deposits WHERE id = $1 LIMIT 1`,
      [depositId]
    );
    return result.rows[0] ? mapDepositRow(result.rows[0]) : null;
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    return getAuctionDepositsMemory().find((item) => item.id === depositId) ?? null;
  }
}

export async function finalizeAuctionDeposit(input: {
  depositId: string;
  status: "succeeded" | "failed" | "cancelled";
  paymentReference?: string;
}): Promise<{ ok: boolean; error?: string; deposit?: AuctionDepositRecord }> {
  const deposit = await getAuctionDeposit(input.depositId);
  if (!deposit) return { ok: false, error: "Deposit tapılmadı" };

  const nextStatus =
    input.status === "succeeded"
      ? "held"
      : input.status === "cancelled"
        ? "cancelled"
        : "failed";

  let updated: AuctionDepositRecord | null = null;
  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionDepositRow>(
      `UPDATE auction_deposits
       SET status = $2,
           payment_reference = COALESCE($3, payment_reference),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [input.depositId, nextStatus, input.paymentReference ?? null]
    );
    updated = result.rows[0] ? mapDepositRow(result.rows[0]) : null;
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    const item = getAuctionDepositsMemory().find((entry) => entry.id === input.depositId);
    if (item) {
      item.status = nextStatus;
      item.paymentReference = input.paymentReference ?? item.paymentReference;
      item.updatedAt = new Date().toISOString();
      updated = item;
    }
  }
  if (!updated) return { ok: false, error: "Deposit tapılmadı" };

  await updateParticipantDepositStatus(updated.auctionId, updated.bidderUserId, updated.status);
  await recordAuctionAuditLog({
    auctionId: updated.auctionId,
    actorUserId: updated.bidderUserId,
    actionType: `auction_deposit_${input.status}`,
    detail: `Deposit marked ${input.status}`
  });
  return { ok: true, deposit: updated };
}
