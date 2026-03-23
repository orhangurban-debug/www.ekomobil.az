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
 * Cərimə:
 *  - NO_SHOW_PENALTY_AZN: udub ödəməyən alıcıya
 */
export const AUCTION_FEES = {
  LOT_LISTING_FEE_AZN: 20,
  SELLER_COMMISSION_RATE: 0.015,    // 1.5%
  SELLER_COMMISSION_CAP_AZN: 300,
  BUYER_PREMIUM_RATE: 0,            // pilot mərhələdə pulsuz
  NO_SHOW_PENALTY_AZN: 50,
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
