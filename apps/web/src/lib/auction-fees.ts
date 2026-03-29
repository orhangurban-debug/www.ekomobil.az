/**
 * EkoMobil Auksion haqq strukturu
 *
 * Satıcıya tətbiq olunan:
 *  - LOT_LISTING_FEE_AZN: hər lot üçün sabit ödəniş (VIN yoxlama daxil)
 *  - SELLER_COMMISSION_RATE: uğurlu satışda müqavilə məbləğindən faiz
 *  - SELLER_COMMISSION_CAP_AZN: komisyonun maksimal hədi
 *
 * Alıcıya tətbiq olunan:
 *  - BUYER_PREMIUM_RATE: opsional (pilot mərhələdə 0)
 *
 * Cərimə (platforma xidmət haqqı — avtomobilin əsas qiyməti deyil):
 *  - NO_SHOW_PENALTY_AZN: qalib alıcı SLA daxilində öhdəliyini yerinə yetirmədikdə
 *  - SELLER_BREACH_PENALTY_AZN: satıcı qalib təklifdən sonra satışı rədd etdikdə / öhdəliyini pozduqda
 */
export const AUCTION_FEES = {
  LOT_LISTING_FEE_AZN: 20,
  SELLER_COMMISSION_RATE: 0.015,    // 1.5%
  SELLER_COMMISSION_CAP_AZN: 300,
  BUYER_PREMIUM_RATE: 0,            // pilot mərhələdə pulsuz
  HIGH_VALUE_LOT_THRESHOLD_AZN: 50000,
  SELLER_PERFORMANCE_BOND_RATE: 0.02,
  SELLER_PERFORMANCE_BOND_MIN_AZN: 500,
  NO_SHOW_PENALTY_AZN: 50,
  SELLER_BREACH_PENALTY_AZN: 50,
} as const;

export type AuctionFees = typeof AUCTION_FEES;

/** Satıcının ödəyəcəyi komisyon məbləğini hesabla */
export function calcSellerCommission(salePriceAzn: number): number {
  const raw = salePriceAzn * AUCTION_FEES.SELLER_COMMISSION_RATE;
  return Math.min(raw, AUCTION_FEES.SELLER_COMMISSION_CAP_AZN);
}

/** Satıcının ümumi xərci: lot fee + komisyon */
export function calcTotalSellerCost(salePriceAzn: number): number {
  return AUCTION_FEES.LOT_LISTING_FEE_AZN + calcSellerCommission(salePriceAzn);
}

export function calcSellerPerformanceBond(basePriceAzn: number): number {
  const raw = Math.round(basePriceAzn * AUCTION_FEES.SELLER_PERFORMANCE_BOND_RATE);
  return Math.max(raw, AUCTION_FEES.SELLER_PERFORMANCE_BOND_MIN_AZN);
}
