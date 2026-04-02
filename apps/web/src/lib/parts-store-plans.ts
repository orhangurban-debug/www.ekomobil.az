/**
 * EkoMobil — Ehtiyat Hissə Mağazası Abunəlik Planları
 *
 * ── Mağaza planı məntiqi (salon planlarından FƏRQLI işləyir) ─────────────
 *
 * SALON modeli:               MAĞAZA modeli:
 *   Avtomobil inventory         Kataloq / SKU inventory
 *   Hər elan 1 spesifik avto    Elan = 1 məhsul / hissə tipi
 *   Satılanda slot azad olur    Stok qurtaranda "stokda yoxdur" olur
 *   Foto: avto vəziyyəti        Foto: məhsul şəkli (az lazımdır)
 *   Axtarış: marka/model/il     Axtarış: OEM, nömrə, uyğun avto modeli
 *
 * ── Mağaza üçün xüsusi anlayışlar ────────────────────────────────────────
 *   • stockQty (stok miqdarı): Satılanda azalır, yeni gəldikdə artır.
 *     Elan silinmir — sadəcə "stokda yoxdur" kimi işarələnir.
 *   • categoryDepth: Hissə kateqoriyası dərinliyi. Baza: 2 səviyyə
 *     (Mühərrik → Filtr). Pro/Network: 3+ səviyyə
 *     (Mühərrik → Yağ sistemi → Yağ filtrləri).
 *   • compatibilityEnabled: Hansı avto markaları/modelləri/illəri ilə
 *     uyğun olduğunun göstərilməsi. Alıcı "BMW 3-cü seriya 2015-2020 üçün
 *     yağ filtri" axtara bilir.
 *   • minOrderQty / bulkPricingEnabled: Topdan satış imkanı.
 *
 * ── "Limitsiz" fəlsəfəsi ─────────────────────────────────────────────────
 *   Hissə mağazaları böyük kataloqua malikdir (anbar mağazaları 5000+ SKU).
 *   Lakin Network plan (79 ₼/ay) üçün 1000 aktiv elan real üst hədddir.
 *   Daha böyük anbarlar üçün custom qiymət teklif edilir.
 *
 * PULSUZ PLAN YOXDUR.
 */

export type PartsStorePlanId = "baza" | "pro" | "network";

export interface PartsStorePlan {
  id: PartsStorePlanId;
  nameAz: string;
  /** Aylıq abunə ödənişi (₼). 0 heç vaxt olmayacaq. */
  priceAzn: number;
  billingCycle: "monthly";
  /**
   * Eyni anda aktiv hissə elanı (SKU) sayı.
   * null YOXDUR — ən böyük plan da sabit üst həddə malikdir.
   */
  maxActiveListings: number;
  /** Hər elanda maksimum şəkil sayı */
  perListingMaxImages: number;
  /**
   * Stok miqdarı (qty) izləmə imkanı.
   * Aktiv olduqda: satış → stok azalır → 0-da "stokda yoxdur" (silinmir).
   */
  stockTrackingEnabled: boolean;
  /**
   * Kateqoriya dərinliyi (neçə alt-kateqoriyaya qədər).
   * 2 = Mühərrik → Filtr
   * 3 = Mühərrik → Yağ sistemi → Yağ filtrləri
   */
  categoryDepth: 2 | 3;
  /**
   * Uyğunluq məlumatı — hansı avto marka/model/illə uyğun olduğu.
   * Alıcılar "BMW F30 üçün yağ filtri" tipli axtarış edə bilər.
   */
  compatibilityEnabled: boolean;
  /** CSV toplu yükləmə (SKU, qiymət, stok, OEM nömrəsi daxil) */
  csvImportEnabled: boolean;
  /** Topdan (bulk) sifariş imkanı */
  bulkOrderEnabled: boolean;
  /** Aylıq boost krediti */
  boostCreditsPerMonth: number;
  /** Sifariş/sorğu qutusu (lead inbox) */
  leadInboxEnabled: boolean;
  /** Analitik panel */
  analyticsEnabled: boolean;
  /**
   * Çoxlu anbar/filial dəstəyi.
   * Hər filial öz stoku ilə ayrıca idarə olunur.
   */
  multiWarehouseEnabled: boolean;
  /** Abunə bitdikdən sonra elanların gizlənməzdən əvvəl aktiv qaldığı gün */
  gracePeriodDays: number;
  features: string[];
  highlight?: boolean;
}

export const PARTS_STORE_PLANS: PartsStorePlan[] = [
  {
    id: "baza",
    nameAz: "Mağaza Baza",
    priceAzn: 19,
    billingCycle: "monthly",
    maxActiveListings: 50,
    perListingMaxImages: 5,       // Hissə elanı üçün: əsas + 4 bucaq. 8-12 gərəksiz.
    stockTrackingEnabled: false,
    categoryDepth: 2,
    compatibilityEnabled: false,
    csvImportEnabled: false,
    bulkOrderEnabled: false,
    boostCreditsPerMonth: 0,
    leadInboxEnabled: true,
    analyticsEnabled: false,
    multiWarehouseEnabled: false,
    gracePeriodDays: 7,
    features: [
      "50 aktiv hissə elanı (SKU)",
      "Elan başına 5 şəkil",
      "Mağaza profil səhifəsi",
      "Doğrulanmış mağaza badge",
      "Sifariş sorğuları qutusu",
      "2 səviyyəli kateqoriya ağacı"
    ]
  },
  {
    id: "pro",
    nameAz: "Mağaza Pro",
    priceAzn: 39,
    billingCycle: "monthly",
    maxActiveListings: 300,
    perListingMaxImages: 8,
    stockTrackingEnabled: true,
    categoryDepth: 3,
    compatibilityEnabled: true,
    csvImportEnabled: true,
    bulkOrderEnabled: false,
    boostCreditsPerMonth: 5,
    leadInboxEnabled: true,
    analyticsEnabled: true,
    multiWarehouseEnabled: false,
    gracePeriodDays: 14,
    highlight: true,
    features: [
      "300 aktiv hissə elanı (SKU)",
      "Elan başına 8 şəkil",
      "Stok miqdarı izləmə (qty)",
      "Uyğunluq məlumatı (marka/model/il)",
      "3 səviyyəli kateqoriya ağacı",
      "CSV toplu yükləmə (SKU + OEM nömrəsi)",
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
    maxActiveListings: 1000,      // "Limitsiz" deyil — 1000 SKU real anbar həcmini əhatə edir
    perListingMaxImages: 12,
    stockTrackingEnabled: true,
    categoryDepth: 3,
    compatibilityEnabled: true,
    csvImportEnabled: true,
    bulkOrderEnabled: true,
    boostCreditsPerMonth: 15,
    leadInboxEnabled: true,
    analyticsEnabled: true,
    multiWarehouseEnabled: true,
    gracePeriodDays: 21,
    features: [
      "1000 aktiv hissə elanı (SKU)",
      "Elan başına 12 şəkil",
      "Stok izləmə + topdan sifariş imkanı",
      "Uyğunluq məlumatı (tam dəstək)",
      "Çoxlu anbar — filiallar üzrə stok",
      "CSV toplu yükləmə (limit yoxdur)",
      "Qabaqcıl analitika & Excel export",
      "Aylıq 15 boost krediti",
      "Prioritet dəstək + hesab meneceri"
    ]
  }
];

export function getPartsStorePlanById(id: PartsStorePlanId): PartsStorePlan | undefined {
  return PARTS_STORE_PLANS.find((p) => p.id === id);
}
