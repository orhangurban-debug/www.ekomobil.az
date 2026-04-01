import type { ListingKind } from "@/lib/marketplace-types";

export type AuctionPaymentMode = "BETA_FIN_ONLY" | "STRICT_PRE_AUTH";

export type PenaltyAmountsJson = Record<ListingKind, number>;

export interface SystemSettingsRow {
  id: number;
  auctionMode: AuctionPaymentMode;
  penaltyAmounts: PenaltyAmountsJson;
  updatedAt: string;
}

export const DEFAULT_PENALTY_AMOUNTS: PenaltyAmountsJson = {
  vehicle: 80,
  part: 15
};
