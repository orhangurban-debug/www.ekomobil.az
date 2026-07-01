import type { AuctionMode, AuctionStatus } from "@/lib/auction";
import { getAuctionStatusLabel } from "@/lib/auction";

export const AUCTION_STATUS_FILTER_OPTIONS: Array<{ value: AuctionStatus; label: string }> = (
  [
    "draft",
    "scheduled",
    "live",
    "extended",
    "ended_pending_confirmation",
    "buyer_confirmed",
    "seller_confirmed",
    "completed",
    "not_met_reserve",
    "pending_seller_approval",
    "no_show",
    "seller_breach",
    "cancelled",
    "disputed"
  ] as AuctionStatus[]
).map((value) => ({ value, label: getAuctionStatusLabel(value) }));

export const AUCTION_MODE_FILTER_OPTIONS: Array<{ value: AuctionMode; label: string }> = [
  { value: "ascending", label: "Artan qiymət" },
  { value: "reserve", label: "Rezerv qiymətli" }
];
