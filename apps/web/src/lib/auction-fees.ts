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
 * Öhdəlik haqları (platforma öhdəlik qaydası — avtomobilin əsas qiyməti deyil):
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
  // Satıcı pozuntusu bazarda daha yüksək etibar zədəsi yaradır: asimmetrik məbləğ
  SELLER_BREACH_PENALTY_VEHICLE_AZN: 120,
  SELLER_BREACH_PENALTY_PART_AZN: 20,
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

/**
 * Alıcı öhdəlik (no-show) haqqı — admin paneldəki `penaltyAmounts` dəyəri
 * varsa ona üstünlük verilir, əks halda default AUCTION_FEES istifadə olunur.
 * Bu funksiya həm faktiki ödəniş məbləğinin hesablanmasında, həm də qiymət
 * göstərilməsində istifadə olunur ki, göstərilən və tutulan məbləğ eyni olsun.
 */
export function getEffectiveNoShowPenaltyAzn(
  kind: ListingKind | undefined,
  penaltyAmounts?: Partial<Record<ListingKind, number>>
): number {
  const normalized = normalizeKind(kind);
  const configured = penaltyAmounts?.[normalized];
  if (typeof configured === "number" && Number.isFinite(configured) && configured > 0) {
    return Math.round(configured);
  }
  return getNoShowPenaltyAzn(normalized);
}

export function getSellerBreachPenaltyAzn(kind?: ListingKind): number {
  return normalizeKind(kind) === "part"
    ? AUCTION_FEES.SELLER_BREACH_PENALTY_PART_AZN
    : AUCTION_FEES.SELLER_BREACH_PENALTY_VEHICLE_AZN;
}

/**
 * Satıcı öhdəlik pozuntusu haqqı — admin paneldəki `sellerBreachAmounts` dəyəri
 * varsa ona üstünlük verilir, əks halda default AUCTION_FEES istifadə olunur.
 */
export function getEffectiveSellerBreachPenaltyAzn(
  kind: ListingKind | undefined,
  sellerBreachAmounts?: Partial<Record<ListingKind, number>>
): number {
  const normalized = normalizeKind(kind);
  const configured = sellerBreachAmounts?.[normalized];
  if (typeof configured === "number" && Number.isFinite(configured) && configured > 0) {
    return Math.round(configured);
  }
  return getSellerBreachPenaltyAzn(normalized);
}

/**
 * Bid öncəsi kart hold (pre-auth) üçün daha yumşaq məbləğ.
 * Məqsəd: istifadəçi friction-u azaltmaq, amma öhdəlik niyyətini təsdiqləmək.
 * Bu məbləğ öhdəlik haqqının özü DEYİL.
 */
export function getBidPreauthHoldAmountAzn(kind?: ListingKind, basePenaltyAzn?: number): number {
  const normalized = normalizeKind(kind);
  const fallbackPenalty = getNoShowPenaltyAzn(normalized);
  const base = Number.isFinite(basePenaltyAzn) && (basePenaltyAzn ?? 0) > 0
    ? (basePenaltyAzn as number)
    : fallbackPenalty;

  // Təxmini 25% hold, amma floor/cap ilə istifadəçi dostu saxlanılır.
  const raw = Math.round(base * 0.25);
  if (normalized === "part") {
    return Math.max(5, Math.min(raw, 10));
  }
  return Math.max(20, Math.min(raw, 30));
}
