/**
 * EkoMobil — Ehtiyat Hissə Mağazası Abunəlik Planları
 *
 * PULSUZ PLAN YOXDUR — mağazalar kommersiya subyektlərdir.
 * Hər mağaza aylıq abunə ödəyir → aktiv hissə elanı hüququ alır.
 *
 * Hissə şəkilləri elan planlarındakı kimi avtomatik sıxılır:
 *   → bax: src/lib/image-processor.ts
 */

export type PartsStorePlanId = "start" | "pro" | "network";

export interface PartsStorePlan {
  id: PartsStorePlanId;
  nameAz: string;
  /** Aylıq abunə ödənişi (₼). 0 icazə verilmir. */
  priceAzn: number;
  billingCycle: "monthly";
  /** Eyni anda aktiv hissə elanı sayı (null = limitsiz) */
  maxPartsListings: number | null;
  /** Elan başına maksimum şəkil sayı */
  perListingMaxImages: number;
  /** CSV toplu yükləmə imkanı */
  csvImportEnabled: boolean;
  /** Aylıq boost krediti */
  boostCreditsPerMonth: number;
  /** Lead/sifariş sorğu qutusu */
  leadInboxEnabled: boolean;
  /** Analitik panel */
  analyticsEnabled: boolean;
  features: string[];
  highlight?: boolean;
}

export const PARTS_STORE_PLANS: PartsStorePlan[] = [
  {
    id: "start",
    nameAz: "Mağaza Baza",
    priceAzn: 19,
    billingCycle: "monthly",
    maxPartsListings: 50,
    perListingMaxImages: 8,
    csvImportEnabled: false,
    boostCreditsPerMonth: 0,
    leadInboxEnabled: true,
    analyticsEnabled: false,
    features: [
      "50 aktiv hissə elanı",
      "Elan başına 8 şəkil",
      "Mağaza profil səhifəsi",
      "Doğrulanmış mağaza badge",
      "Sifariş sorğuları qutusu"
    ]
  },
  {
    id: "pro",
    nameAz: "Mağaza Pro",
    priceAzn: 39,
    billingCycle: "monthly",
    maxPartsListings: 300,
    perListingMaxImages: 15,
    csvImportEnabled: true,
    boostCreditsPerMonth: 5,
    leadInboxEnabled: true,
    analyticsEnabled: true,
    highlight: true,
    features: [
      "300 aktiv hissə elanı",
      "Elan başına 15 şəkil",
      "CSV toplu yükləmə",
      "Lead qutusu + sorğu idarəetməsi",
      "Baxış & satış analitikası",
      "Aylıq 5 boost krediti"
    ]
  },
  {
    id: "network",
    nameAz: "Mağaza Network",
    priceAzn: 79,
    billingCycle: "monthly",
    maxPartsListings: null,
    perListingMaxImages: 25,
    csvImportEnabled: true,
    boostCreditsPerMonth: 15,
    leadInboxEnabled: true,
    analyticsEnabled: true,
    features: [
      "Limitsiz aktiv hissə elanı",
      "Elan başına 25 şəkil",
      "CSV toplu yükləmə (limit yoxdur)",
      "Filiallar üzrə vahid idarəetmə",
      "Qabaqcıl analitika & Excel export",
      "Aylıq 15 boost krediti",
      "Prioritet dəstək + hesab meneceri"
    ]
  }
];

export function getPartsStorePlanById(id: PartsStorePlanId): PartsStorePlan | undefined {
  return PARTS_STORE_PLANS.find((p) => p.id === id);
}
