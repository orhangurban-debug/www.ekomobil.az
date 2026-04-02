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
 * ── Slot məntiqi ─────────────────────────────────────────────────────────
 *   • Salon aylıq ödəyir → maxListings qədər AKTIV slot alır.
 *   • Avtomobil satılanda/silinəndə → slot azad olur → yeni elan girir.
 *   • Abunə bitincə → bütün elanlar 30 gün gizlənir (grace), sonra arxivlənir.
 *   • Elan keyfiyyəti (foto, video) planla sabitdir — fərdi plan seçim yoxdur.
 *
 * ── "Limitsiz" fəlsəfəsi ─────────────────────────────────────────────────
 *   Azərbaycan bazarının ən böyük salonlarında belə aktiv inventar adətən
 *   150-200 avtomobili keçmir. "Limitsiz" = qeyri-müəyyən xərc + keyfiyyətsiz
 *   siyahı riskidir. Enterprise planı 200 slot ilə bütün real ssenariləri əhatə edir.
 *
 * ── Listing refresh ──────────────────────────────────────────────────────
 *   listingRefreshDays: Salon hər N gündən bir elanların hələ inventarda
 *   olduğunu təsdiqləməlidir (bir klik). Bu "hayalet ilan" problemini önləyir.
 *
 * PULSUZ PLAN YOXDUR.
 */

export type DealerPlanId = "baza" | "pro" | "enterprise";

export interface DealerPlan {
  id: DealerPlanId;
  nameAz: string;
  /** Aylıq abunə ödənişi (₼). 0 heç vaxt olmayacaq. */
  priceAzn: number;
  billingCycle: "monthly";
  /**
   * Eyni anda aktiv ola biləcək maksimum elan SLOTU.
   * null YOXDUR — ən böyük plan da sabit üst həddə malikdir.
   */
  maxActiveListings: number;
  /** Hər elanda maksimum şəkil sayı (plan tərəfindən sabitlənir, satıcı seçmir) */
  perListingMaxImages: number;
  /** Hər elanda video yükləmə imkanı */
  videoEnabled: boolean;
  /** Hər elanda maksimum video sayı */
  maxVideosPerListing: number;
  /**
   * Elanların "hayalet inventar" yoxlaması intervalı (gün).
   * Salon hər N gündən bir elanın hələ satışda olduğunu bir klikdə təsdiqləyir.
   * Təsdiq edilməyən elanlar sarı "yoxlanılmayıb" etiketiylə işarələnir.
   */
  listingRefreshDays: number;
  /** CSV toplu yükləmə imkanı */
  csvImportEnabled: boolean;
  /** Aylıq VIN servis sorğu krediti */
  vinCreditsPerMonth: number;
  /** Çoxlu filial — vahid paneldən idarə */
  multiBranchEnabled: boolean;
  /** Aylıq boost krediti (irəli çək / VIP / Premium) */
  boostCreditsPerMonth: number;
  /** Lead CRM sifariş sayı limiti (null = limitsiz) */
  leadInboxLimit: number | null;
  /** Analitik panel (baxış, lead, dönüşüm statistikası) */
  analyticsEnabled: boolean;
  /** Abunə bitdikdən sonra elanların gizlənməzdən əvvəl aktiv qaldığı gün (lütf müddəti) */
  gracePeriodDays: number;
  features: string[];
  highlight?: boolean;
}

export const DEALER_PLANS: DealerPlan[] = [
  {
    id: "baza",
    nameAz: "Salon Baza",
    priceAzn: 29,
    billingCycle: "monthly",
    maxActiveListings: 30,
    perListingMaxImages: 10,
    videoEnabled: false,
    maxVideosPerListing: 0,
    listingRefreshDays: 60,
    csvImportEnabled: false,
    vinCreditsPerMonth: 0,
    multiBranchEnabled: false,
    boostCreditsPerMonth: 0,
    leadInboxLimit: 50,
    analyticsEnabled: false,
    gracePeriodDays: 14,
    features: [
      "30 aktiv elan slotu",
      "Elan başına 10 şəkil",
      "Salon profil səhifəsi",
      "Doğrulanmış salon badge",
      "Lead qutusu (son 50 sorğu)",
      "Standart axtarış görünüşü",
      "Hər 60 gündən bir inventar yoxlaması"
    ]
  },
  {
    id: "pro",
    nameAz: "Salon Pro",
    priceAzn: 59,
    billingCycle: "monthly",
    maxActiveListings: 80,
    perListingMaxImages: 20,
    videoEnabled: true,
    maxVideosPerListing: 1,
    listingRefreshDays: 90,
    csvImportEnabled: true,
    vinCreditsPerMonth: 10,
    multiBranchEnabled: false,
    boostCreditsPerMonth: 5,
    leadInboxLimit: null,
    analyticsEnabled: true,
    gracePeriodDays: 21,
    highlight: true,
    features: [
      "80 aktiv elan slotu",
      "Elan başına 20 şəkil + 1 video",
      "CSV toplu yükləmə",
      "Tam lead CRM — limitsiz",
      "Baxış & lead statistikası",
      "VIN servis sorğusu — 10 kredit/ay",
      "Aylıq 5 boost krediti (irəli çək/VIP)",
      "Hər 90 gündən bir inventar yoxlaması"
    ]
  },
  {
    id: "enterprise",
    nameAz: "Salon Enterprise",
    priceAzn: 119,
    billingCycle: "monthly",
    maxActiveListings: 200,      // "Limitsiz" deyil — 200 slot Azərbaycanda ən böyük salonları əhatə edir
    perListingMaxImages: 25,
    videoEnabled: true,
    maxVideosPerListing: 2,      // 5→2: bir avtomobil üçün walk-around + test drive kifayətdir
    listingRefreshDays: 120,
    csvImportEnabled: true,
    vinCreditsPerMonth: 30,
    multiBranchEnabled: true,
    boostCreditsPerMonth: 20,
    leadInboxLimit: null,
    analyticsEnabled: true,
    gracePeriodDays: 30,
    features: [
      "200 aktiv elan slotu",
      "Elan başına 25 şəkil + 2 video",
      "CSV toplu yükləmə (limit yoxdur)",
      "Çoxlu filial — vahid idarəetmə paneli",
      "Tam lead CRM + SLA izləmə",
      "Qabaqcıl analytics & Excel export",
      "VIN servis sorğusu — 30 kredit/ay",
      "Aylıq 20 boost krediti (irəli çək/VIP/Premium)",
      "Auksion lot yerləşdirmə hüququ",
      "Prioritet dəstək + hesab meneceri"
    ]
  }
];

export function getDealerPlanById(id: DealerPlanId): DealerPlan | undefined {
  return DEALER_PLANS.find((p) => p.id === id);
}

/**
 * Aktivliyini itirmiş (refresh edilməmiş) elan sayını hesablamaq üçün
 * son yoxlama tarixini yoxlayır.
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
