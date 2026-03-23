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
  | "cancelled"
  | "disputed";

export type AuctionDepositStatus =
  | "not_required"
  | "pending"
  | "redirect_ready"
  | "held"
  | "returned"
  | "forfeited"
  | "cancelled"
  | "failed";

export interface AuctionStateSnapshot {
  id: string;
  listingId: string;
  sellerUserId: string;
  titleSnapshot: string;
  startingBidAzn: number;
  currentBidAzn: number | null;
  currentBidderUserId: string | null;
  minimumIncrementAzn: number;
  status: AuctionStatus;
  startsAt: string;
  endsAt: string;
  depositRequired: boolean;
  depositAmountAzn: number | null;
  winnerUserId: string | null;
  updatedAt: string;
}

export interface AuctionBidView {
  id: string;
  auctionId: string;
  bidderUserId: string;
  amountAzn: number;
  isAutoBid: boolean;
  maxAutoBidAzn: number | null;
  source: "manual" | "auto";
  createdAt: string;
}

export interface PlaceBidInput {
  auctionId: string;
  bidderUserId: string;
  amountAzn: number;
  autoBidMaxAzn?: number;
  ip?: string;
  deviceFingerprint?: string;
}

export interface PlaceBidResult {
  ok: boolean;
  error?: string;
  bid?: AuctionBidView;
  auction?: AuctionStateSnapshot;
  nextMinimumBidAzn?: number;
  extended?: boolean;
}

export interface AuctionRealtimeEvent {
  auctionId: string;
  type:
    | "snapshot"
    | "bid.accepted"
    | "payment.updated"
    | "auction.updated"
    | "auction.heartbeat";
  occurredAt: string;
  payload: Record<string, unknown>;
}
