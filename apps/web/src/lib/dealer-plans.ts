/**
 * EkoMobil — Avto Salon Abunəlik Planları
 *
 * ── Salon planı məntiqi (fərdi elan planlarından FƏRQLI işləyir) ──────────
 *
 * FƏRDİ satıcı modeli:          SALON modeli:
 *   Hər elan ayrıca plan alır     Aylıq abunə → "slot" hüququ
 *   Hər elan öz müddəti var       Elan aktiv ↔ abunə aktiv
 *   Plan = elan keyfiyyəti        Plan = eyni anda neçə elan (slot)
 *   Elan sona çatınca arxivlənir  Abunə bitincə TÜM elanlar gizlənir
 *
 * ── `features` vs `comingSoon` ───────────────────────────────────────────
 *   `features`   — hazırda REAL işləyən funksionallıq. Burada yalnız
 *                  arxitekturası, API-si, UI-si mövcud xüsusiyyətlər yer alır.
 *   `comingSoon` — yol xəritəsindədir, tezliklə aktiv olacaq. Pricing UI-da
 *                  ayrıca "Tezliklə" bloku kimi göstərilir.
 *
 * ── Niyə pulsuz plan yoxdur? ─────────────────────────────────────────────
 *   Salonlar kommersiya subyektlərdir. Pulsuz sıralama fərdi satıcılara
 *   qarşı ədalətsiz rəqabət yaradır; platforma keyfiyyətini azaldır.
 *
 * PULSUZ PLAN YOXDUR.
 */

export type DealerPlanId = "baza" | "peşəkar" | "korporativ";

export interface DealerPlan {
  id: DealerPlanId;
  nameAz: string;
  /** Aylıq abunə ödənişi (₼). 0 heç vaxt olmayacaq. */
  priceAzn: number;
  billingCycle: "monthly";
  /** Eyni anda aktiv ola biləcək maksimum elan SLOTU. null YOXDUR. */
  maxActiveListings: number;
  /** Hər elanda maksimum şəkil sayı */
  perListingMaxImages: number;
  /** Hər elanda video yükləmə imkanı */
  videoEnabled: boolean;
  /** Hər elanda maksimum video sayı */
  maxVideosPerListing: number;
  /**
   * Elanların "hayalet inventar" yoxlaması intervalı (gün).
   * Salon hər N gündən bir elanın hələ satışda olduğunu bir klikdə təsdiqləyir.
   */
  listingRefreshDays: number;
  /** CSV toplu yükləmə imkanı (avtomobil inventarı) */
  csvImportEnabled: boolean;
  /** Lead CRM sifariş sayı limiti (null = limitsiz) */
  leadInboxLimit: number | null;
  /** Analitik panel (baxış, lead statistikası) */
  analyticsEnabled: boolean;
  /** Abunə bitdikdən sonra elanların gizlənməzdən əvvəl aktiv qaldığı gün */
  gracePeriodDays: number;
  /** Hazırda real işləyən xüsusiyyətlər */
  features: string[];
  /**
   * Yol xəritəsindədir — bu plan üçün tezliklə aktiv olacaq xüsusiyyətlər.
   * Pricing UI-da ayrıca "Tezliklə" bloku kimi göstərilir.
   */
  comingSoon: string[];
  highlight?: boolean;
}

export const DEALER_PLANS: DealerPlan[] = [
  {
    id: "baza",
    nameAz: "Salon Əsas",
    priceAzn: 29,
    billingCycle: "monthly",
    maxActiveListings: 30,
    perListingMaxImages: 10,
    videoEnabled: false,
    maxVideosPerListing: 0,
    listingRefreshDays: 60,
    csvImportEnabled: false,
    leadInboxLimit: 50,
    analyticsEnabled: false,
    gracePeriodDays: 14,
    features: [
      "30 aktiv avtomobil elanı limiti",
      "Aşağı giriş xərci ilə baza salon paneli",
      "Salon paneli: inventar və lead qutusu",
      "Elanlara irəlilətmə xidməti tətbiq etmə",
      "Profil məlumatları: ad, şəhər, loqo, təsvir",
      "Müştəri sorğularını mərhələlər üzrə idarə etmə"
    ],
    comingSoon: []
  },
  {
    id: "peşəkar",
    nameAz: "Salon Peşəkar",
    priceAzn: 59,
    billingCycle: "monthly",
    maxActiveListings: 80,
    perListingMaxImages: 20,
    videoEnabled: true,
    maxVideosPerListing: 1,
    listingRefreshDays: 90,
    csvImportEnabled: true,
    leadInboxLimit: null,
    analyticsEnabled: true,
    gracePeriodDays: 21,
    highlight: true,
    features: [
      "Salon Əsas planındakı bütün imkanlar",
      "80 aktiv avtomobil elanı limiti",
      "CSV toplu yükləmə (avtomobil inventarı)",
      "Analitika paneli (baxış, əlaqə, test sürüş)",
      "Profildə əlavə sahələr: WhatsApp, vebsayt, iş saatları"
    ],
    comingSoon: []
  },
  {
    id: "korporativ",
    nameAz: "Salon Korporativ",
    priceAzn: 119,
    billingCycle: "monthly",
    maxActiveListings: 200,
    perListingMaxImages: 25,
    videoEnabled: true,
    maxVideosPerListing: 2,
    listingRefreshDays: 120,
    csvImportEnabled: true,
    leadInboxLimit: null,
    analyticsEnabled: true,
    gracePeriodDays: 30,
    features: [
      "Salon Peşəkar planındakı bütün imkanlar",
      "200 aktiv avtomobil elanı limiti",
      "Profildə korporativ sahələr: cover şəkli və ünvan",
      "CSV toplu yükləmə və analitika paneli",
      "Biznes profilində geniş məlumat sahələri"
    ],
    comingSoon: []
  }
];

export function getDealerPlanById(id: DealerPlanId): DealerPlan | undefined {
  return DEALER_PLANS.find((p) => p.id === id);
}

/**
 * Aktivliyini itirmiş (refresh edilməmiş) elan sayını yoxlayır.
 */
export function isDealerListingStale(
  lastRefreshedAt: string | Date,
  plan: DealerPlan
): boolean {
  const last = new Date(lastRefreshedAt);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - plan.listingRefreshDays);
  return last < threshold;
}

/**
 * Abunəliyin lütf müddəti keçibsə bütün salon elanları arxivlənməlidir.
 */
export function shouldArchiveDealerListings(
  subscriptionExpiresAt: string | Date,
  plan: DealerPlan
): boolean {
  const expiry = new Date(subscriptionExpiresAt);
  const archiveAt = new Date(expiry);
  archiveAt.setDate(archiveAt.getDate() + plan.gracePeriodDays);
  return new Date() > archiveAt;
}
