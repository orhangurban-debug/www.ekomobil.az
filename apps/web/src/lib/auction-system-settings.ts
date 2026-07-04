import type { ListingKind } from "@/lib/marketplace-types";

export type AuctionPaymentMode = "BETA_FIN_ONLY" | "STRICT_PRE_AUTH";

export type PenaltyAmountsJson = Record<ListingKind, number>;

export interface SystemSettingsRow {
  id: number;
  auctionMode: AuctionPaymentMode;
  /** Alıcı no-show öhdəlik haqqı */
  penaltyAmounts: PenaltyAmountsJson;
  /** Satıcı öhdəlik pozuntusu haqqı */
  sellerBreachAmounts: PenaltyAmountsJson;
  updatedAt: string;
}

export const DEFAULT_PENALTY_AMOUNTS: PenaltyAmountsJson = {
  vehicle: 80,
  part: 15
};

export const DEFAULT_SELLER_BREACH_AMOUNTS: PenaltyAmountsJson = {
  vehicle: 120,
  part: 20
};
