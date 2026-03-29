import type { PaymentCheckoutStrategy, PaymentProviderMode, PaymentProviderPayload } from "@/lib/payments";

export type AuctionStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "extended"
  | "ended_pending_confirmation"
  | "buyer_confirmed"
  | "seller_confirmed"
  | "completed"
  | "not_met_reserve"
  | "no_show"
  | "seller_breach"
  | "cancelled"
  | "disputed";

export type AuctionMode = "ascending" | "reserve";
export type AuctionSettlementModel = "off_platform_direct";
export type AuctionParticipantRiskLevel = "normal" | "watch" | "blocked";
export type AuctionDepositStatus =
  | "not_required"
  | "pending"
  | "redirect_ready"
  | "held"
  | "returned"
  | "forfeited"
  | "cancelled"
  | "failed";

export type AuctionOutcomeStatus =
  | "ended_pending_confirmation"
  | "buyer_confirmed"
  | "seller_confirmed"
  | "completed"
  | "no_show"
  | "seller_breach"
  | "cancelled"
  | "disputed";

export type AuctionFinancialEventType =
  | "lot_fee"
  | "bidder_deposit"
  | "seller_performance_bond"
  | "no_show_penalty"
  | "seller_breach_penalty"
  | "seller_success_fee";

export interface AuctionListingRecord {
  id: string;
  listingId: string;
  sellerUserId: string;
  sellerDealerProfileId?: string;
  mode: AuctionMode;
  settlementModel: AuctionSettlementModel;
  titleSnapshot: string;
  startingBidAzn: number;
  reservePriceAzn?: number;
  buyNowPriceAzn?: number;
  currentBidAzn?: number;
  currentBidderUserId?: string;
  minimumIncrementAzn: number;
  startsAt: string;
  endsAt: string;
  status: AuctionStatus;
  depositRequired: boolean;
  depositAmountAzn?: number;
  sellerBondRequired: boolean;
  sellerBondAmountAzn?: number;
  winnerUserId?: string;
  buyerConfirmedAt?: string;
  sellerConfirmedAt?: string;
  saleConfirmedAt?: string;
  noShowReportedAt?: string;
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuctionBidRecord {
  id: string;
  auctionId: string;
  bidderUserId: string;
  amountAzn: number;
  isAutoBid: boolean;
  maxAutoBidAzn?: number;
  source: "manual" | "auto";
  ipHash?: string;
  deviceFingerprint?: string;
  createdAt: string;
}

export interface AuctionParticipantRecord {
  auctionId: string;
  bidderUserId: string;
  phoneVerified: boolean;
  depositRequired: boolean;
  depositStatus: AuctionDepositStatus;
  riskLevel: AuctionParticipantRiskLevel;
  canBid: boolean;
  blockedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuctionOutcomeRecord {
  id: string;
  auctionId: string;
  winnerUserId?: string;
  winningBidAzn?: number;
  status: AuctionOutcomeStatus;
  buyerConfirmedAt?: string;
  sellerConfirmedAt?: string;
  completedAt?: string;
  noShowAt?: string;
  opsVerifiedAt?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuctionFinancialEventRecord {
  id: string;
  auctionId: string;
  userId?: string;
  eventType: AuctionFinancialEventType;
  amountAzn: number;
  provider?: "kapital_bank";
  status: "pending" | "redirect_ready" | "recorded" | "succeeded" | "failed" | "cancelled";
  checkoutUrl?: string;
  paymentReference?: string;
  providerMode?: PaymentProviderMode;
  checkoutStrategy?: PaymentCheckoutStrategy;
  providerPayload?: PaymentProviderPayload;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuctionDepositRecord {
  id: string;
  auctionId: string;
  bidderUserId: string;
  amountAzn: number;
  provider: "kapital_bank";
  status: AuctionDepositStatus;
  checkoutUrl?: string;
  paymentReference?: string;
  providerMode?: PaymentProviderMode;
  checkoutStrategy?: PaymentCheckoutStrategy;
  providerPayload?: PaymentProviderPayload;
  returnedAt?: string;
  forfeitedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function resolveAuctionBidIncrement(currentPriceAzn: number): number {
  if (currentPriceAzn < 10000) return 100;
  if (currentPriceAzn < 30000) return 250;
  if (currentPriceAzn < 70000) return 500;
  return 1000;
}

export function isAuctionOpen(status: AuctionStatus): boolean {
  return status === "live" || status === "extended";
}

export function getAuctionStatusLabel(status: AuctionStatus): string {
  const map: Record<AuctionStatus, string> = {
    draft: "Qaralama",
    scheduled: "Planlaşdırılıb",
    live: "Canlı",
    extended: "Uzatma",
    ended_pending_confirmation: "Təsdiq gözlənir",
    buyer_confirmed: "Alıcı təsdiqlədi",
    seller_confirmed: "Satıcı təsdiqlədi",
    completed: "Tamamlandı",
    not_met_reserve: "Rezerv qarşılanmadı",
    no_show: "No-show",
    seller_breach: "Satıcı öhdəliyi pozuldu",
    cancelled: "Ləğv edildi",
    disputed: "Mübahisəli"
  };
  return map[status];
}
