/**
 * EkoMobil — Ehtiyat Hissə Mağazası Abunəlik Planları
 *
 * ── Mağaza planı məntiqi ─────────────────────────────────────────────────
 *
 * SALON modelindən FƏRQLI:
 *   Salon → avtomobil inventory (hər elan 1 unikal avto)
 *   Mağaza → kataloq (SKU) inventory (hər elan bir hissə tipi)
 *
 * Məhsul satılanda elan SİLİNMİR — "stokda yoxdur" olur.
 * Yeni stok gəldikdə isə sadəcə miqdar yenilənir.
 *
 * ── `features` vs `comingSoon` ───────────────────────────────────────────
 *   `features`   — hazırda REAL işləyən funksionallıq.
 *   `comingSoon` — yol xəritəsindədir, tezliklə aktiv olacaq.
 *
 * PULSUZ PLAN YOXDUR.
 */

export type PartsStorePlanId = "baza" | "peşəkar" | "şəbəkə";

export interface PartsStorePlan {
  id: PartsStorePlanId;
  nameAz: string;
  /** Aylıq abunə ödənişi (₼). 0 heç vaxt olmayacaq. */
  priceAzn: number;
  billingCycle: "monthly";
  /** Eyni anda aktiv hissə elanı (SKU) sayı. null YOXDUR. */
  maxActiveListings: number;
  /** Elan başına maksimum şəkil sayı */
  perListingMaxImages: number;
  /** Abunə bitdikdən sonra elanların gizlənməzdən əvvəl aktiv qaldığı gün */
  gracePeriodDays: number;
  /** Hazırda real işləyən xüsusiyyətlər */
  features: string[];
  /** Analitika panelinin əlçatanlığı */
  analyticsEnabled: boolean;
  /**
   * Yol xəritəsindədir — bu plan üçün tezliklə aktiv olacaq xüsusiyyətlər.
   * Pricing UI-da ayrıca "Tezliklə" bloku kimi göstərilir.
   */
  comingSoon: string[];
  highlight?: boolean;
}

export const PARTS_STORE_PLANS: PartsStorePlan[] = [
  {
    id: "baza",
    nameAz: "Mağaza Əsas",
    priceAzn: 19,
    billingCycle: "monthly",
    maxActiveListings: 50,
    perListingMaxImages: 4,
    gracePeriodDays: 7,
    features: [
      "50 aktiv hissə elanı (SKU)",
      "Elan başına 4 şəkil",
      "Mağaza profil səhifəsi",
      "Doğrulanmış mağaza nişanı",
      "Sifariş sorğuları qutusu"
    ],
    analyticsEnabled: false,
    comingSoon: [
      "Baxış statistikası (mağaza paneli)",
      "Stok miqdarı izləmə",
      "Kateqoriya ağacı",
      "CSV toplu yükləmə"
    ]
  },
  {
    id: "peşəkar",
    nameAz: "Mağaza Peşəkar",
    priceAzn: 39,
    billingCycle: "monthly",
    maxActiveListings: 300,
    perListingMaxImages: 6,
    gracePeriodDays: 14,
    highlight: true,
    features: [
      "300 aktiv hissə elanı (SKU)",
      "Elan başına 6 şəkil",
      "Mağaza profil səhifəsi",
      "Doğrulanmış mağaza nişanı",
      "Sifariş sorğuları qutusu",
      "Baxış statistikası"
    ],
    analyticsEnabled: true,
    comingSoon: [
      "Stok miqdarı izləmə (qty)",
      "Uyğunluq məlumatı (marka/model/il)",
      "3 səviyyəli kateqoriya ağacı",
      "CSV toplu yükləmə (SKU + OEM nömrəsi)"
    ]
  },
  {
    id: "şəbəkə",
    nameAz: "Mağaza Şəbəkə",
    priceAzn: 79,
    billingCycle: "monthly",
    maxActiveListings: 1000,
    perListingMaxImages: 8,
    gracePeriodDays: 21,
    features: [
      "1000 aktiv hissə elanı (SKU)",
      "Elan başına 8 şəkil",
      "Mağaza profil səhifəsi",
      "Doğrulanmış mağaza nişanı",
      "Sifariş sorğuları qutusu",
      "Baxış statistikası",
      "Prioritet dəstək"
    ],
    analyticsEnabled: true,
    comingSoon: [
      "Stok izləmə + topdan sifariş",
      "Uyğunluq məlumatı (tam dəstək)",
      "Çoxlu anbar — filiallar üzrə stok",
      "CSV toplu yükləmə (limit yoxdur)",
      "Excel/CSV ixrac"
    ]
  }
];

export function getPartsStorePlanById(id: PartsStorePlanId): PartsStorePlan | undefined {
  return PARTS_STORE_PLANS.find((p) => p.id === id);
}
