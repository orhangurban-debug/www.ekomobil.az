import type { ListingKind } from "@/lib/marketplace-types";

/**
 * EkoMobil Auksion haqq strukturu
 *
 * Satıcıya tətbiq olunan:
 *  - listing kind üzrə lot fee (vehicle/part)
 *  - listing kind üzrə uğurlu satış komisyonu (faiz + min/max)
 *
 * Alıcıya tətbiq olunan:
 *  - BUYER_PREMIUM_RATE: opsional (pilot mərhələdə 0)
 *
 * Öhdəlik haqqları (platforma öhdəlik qaydası — avtomobilin əsas qiyməti deyil):
 *  - Alıcı öhdəlik haqqı (no-show): alıcı öhdəliyini pozduqda
 *  - Satıcı öhdəlik haqqı (seller-breach): satıcı öhdəliyini pozduqda
 *  EkoMobil hər iki tərəfin öhdəliyini eyni şəkildə qoruyur.
 */
export const AUCTION_FEES = {
  LOT_LISTING_FEE_VEHICLE_AZN: 25,
  LOT_LISTING_FEE_PART_AZN: 3,
  SELLER_COMMISSION_VEHICLE_RATE: 0.012, // 1.2%
  SELLER_COMMISSION_VEHICLE_MIN_AZN: 25,
  SELLER_COMMISSION_VEHICLE_CAP_AZN: 700,
  SELLER_COMMISSION_PART_RATE: 0.03, // 3%
  SELLER_COMMISSION_PART_MIN_AZN: 2,
  SELLER_COMMISSION_PART_CAP_AZN: 40,
  BUYER_PREMIUM_RATE: 0,            // pilot mərhələdə pulsuz
  HIGH_VALUE_LOT_THRESHOLD_AZN: 50000,
  SELLER_PERFORMANCE_BOND_RATE: 0.02,
  SELLER_PERFORMANCE_BOND_MIN_AZN: 500,
  NO_SHOW_PENALTY_VEHICLE_AZN: 80,
  NO_SHOW_PENALTY_PART_AZN: 15,
  SELLER_BREACH_PENALTY_VEHICLE_AZN: 80,
  SELLER_BREACH_PENALTY_PART_AZN: 15,
} as const;

export type AuctionFees = typeof AUCTION_FEES;
export type AuctionFeeProfile = ListingKind;

function normalizeKind(kind?: ListingKind): AuctionFeeProfile {
  return kind === "part" ? "part" : "vehicle";
}

export function getLotListingFeeAzn(kind?: ListingKind): number {
  return normalizeKind(kind) === "part"
    ? AUCTION_FEES.LOT_LISTING_FEE_PART_AZN
    : AUCTION_FEES.LOT_LISTING_FEE_VEHICLE_AZN;
}

/** Satıcının ödəyəcəyi komisyon məbləğini hesabla */
export function calcSellerCommission(salePriceAzn: number, kind?: ListingKind): number {
  const safeSalePrice = Number.isFinite(salePriceAzn) && salePriceAzn > 0 ? salePriceAzn : 0;
  if (normalizeKind(kind) === "part") {
    const raw = Math.round(safeSalePrice * AUCTION_FEES.SELLER_COMMISSION_PART_RATE);
    return Math.max(
      AUCTION_FEES.SELLER_COMMISSION_PART_MIN_AZN,
      Math.min(raw, AUCTION_FEES.SELLER_COMMISSION_PART_CAP_AZN)
    );
  }
  const raw = Math.round(safeSalePrice * AUCTION_FEES.SELLER_COMMISSION_VEHICLE_RATE);
  return Math.max(
    AUCTION_FEES.SELLER_COMMISSION_VEHICLE_MIN_AZN,
    Math.min(raw, AUCTION_FEES.SELLER_COMMISSION_VEHICLE_CAP_AZN)
  );
}

/** Satıcının ümumi xərci: lot fee + komisyon */
export function calcTotalSellerCost(salePriceAzn: number, kind?: ListingKind): number {
  return getLotListingFeeAzn(kind) + calcSellerCommission(salePriceAzn, kind);
}

export function calcSellerPerformanceBond(basePriceAzn: number): number {
  const raw = Math.round(basePriceAzn * AUCTION_FEES.SELLER_PERFORMANCE_BOND_RATE);
  return Math.max(raw, AUCTION_FEES.SELLER_PERFORMANCE_BOND_MIN_AZN);
}

export function getNoShowPenaltyAzn(kind?: ListingKind): number {
  return normalizeKind(kind) === "part"
    ? AUCTION_FEES.NO_SHOW_PENALTY_PART_AZN
    : AUCTION_FEES.NO_SHOW_PENALTY_VEHICLE_AZN;
}

export function getSellerBreachPenaltyAzn(kind?: ListingKind): number {
  return normalizeKind(kind) === "part"
    ? AUCTION_FEES.SELLER_BREACH_PENALTY_PART_AZN
    : AUCTION_FEES.SELLER_BREACH_PENALTY_VEHICLE_AZN;
}
