/**
 * EkoMobil — Avto Salon Abunəlik Planları
 *
 * ── Qiymətləndirmə modeli ─────────────────────────────────────────────
 *
 * Salon planları FƏRDİ satıcı planlarından tam ayrıdır.
 * PULSUZ PLAN YOXDUR — peşəkar biznes platforması kimi hər salon ödəniş edir.
 *
 * Niyə pulsuz plan yoxdur?
 *   • Salonlar kommersiya subyektlərdir — pulsuz sıralamaya düşmək ədalətsiz
 *     rəqabət yaradır fərdi satıcılara qarşı.
 *   • Keyfiyyəti qorumaq: Yalnız ciddi bizneslərin siyahıya düşməsi
 *     platforma etibarını artırır.
 *   • Öz "Salon baza" planımız artıq bazardakı pulsuz alternativi əvəz edir:
 *     rəqiblərə görə geniş imkanlarla çox əlverişli qiymətdə.
 *
 * Salon elanlarının hər biri avtomatik olaraq "Pro" keyfiyyəti alır:
 *   • 20 foto (sıxılmış JPEG, max 1280 px)
 *   • Video imkanı (plan asılı)
 *   • 90 gün aktiv müddət
 *
 * Şəkil emalı fərdi satıcılarla eynidir:
 *   → bax: src/lib/image-processor.ts
 */

export type DealerPlanId = "baza" | "pro" | "enterprise";

export interface DealerPlan {
  id: DealerPlanId;
  nameAz: string;
  /** Aylıq abunə ödənişi (₼). 0 icazə verilmir. */
  priceAzn: number;
  billingCycle: "monthly";
  /** Eyni anda aktiv ola biləcək maksimum elan sayı (null = limitsiz) */
  maxListings: number | null;
  /** Hər elanda maksimum şəkil sayı */
  perListingMaxImages: number;
  /** Hər elanda video yükləmə imkanı */
  videoEnabled: boolean;
  /** Maksimum video sayı (elan başına) */
  maxVideosPerListing: number;
  /** CSV toplu yükləmə imkanı */
  csvImportEnabled: boolean;
  /** Aylıq VIN sorğu krediti (null = yoxdur) */
  vinCreditsPerMonth: number | null;
  /** Çoxlu filial idarəetməsi */
  multiBranchEnabled: boolean;
  /** Aylıq boost krediti (irəli çək/VIP/Premium üçün) */
  boostCreditsPerMonth: number;
  /** Lead CRM həcm limiti (null = limitsiz) */
  leadInboxLimit: number | null;
  /** Analitik panel */
  analyticsEnabled: boolean;
  features: string[];
  highlight?: boolean;
}

export const DEALER_PLANS: DealerPlan[] = [
  {
    id: "baza",
    nameAz: "Salon Baza",
    priceAzn: 29,
    billingCycle: "monthly",
    maxListings: 30,
    perListingMaxImages: 15,
    videoEnabled: false,
    maxVideosPerListing: 0,
    csvImportEnabled: false,
    vinCreditsPerMonth: null,
    multiBranchEnabled: false,
    boostCreditsPerMonth: 0,
    leadInboxLimit: 50,
    analyticsEnabled: false,
    features: [
      "30 aktiv elan (eyni anda)",
      "Elan başına 15 şəkil",
      "Salon profil səhifəsi + Doğrulanmış badge",
      "Lead qutusu (son 50 sorğu)",
      "Standart axtarış görünüşü"
    ]
  },
  {
    id: "pro",
    nameAz: "Salon Pro",
    priceAzn: 59,
    billingCycle: "monthly",
    maxListings: 100,
    perListingMaxImages: 25,
    videoEnabled: true,
    maxVideosPerListing: 2,
    csvImportEnabled: true,
    vinCreditsPerMonth: 10,
    multiBranchEnabled: false,
    boostCreditsPerMonth: 5,
    leadInboxLimit: null,
    analyticsEnabled: true,
    highlight: true,
    features: [
      "100 aktiv elan (eyni anda)",
      "Elan başına 25 şəkil + 2 video",
      "CSV toplu yükləmə",
      "Tam lead CRM — limitsiz",
      "Baxış & lead statistikası",
      "VIN servis sorğusu — 10 kredit/ay",
      "Aylıq 5 boost krediti (irəli çək/VIP)",
      "\"Doğrulanmış Salon\" badge"
    ]
  },
  {
    id: "enterprise",
    nameAz: "Salon Enterprise",
    priceAzn: 119,
    billingCycle: "monthly",
    maxListings: null,
    perListingMaxImages: 40,
    videoEnabled: true,
    maxVideosPerListing: 5,
    csvImportEnabled: true,
    vinCreditsPerMonth: 30,
    multiBranchEnabled: true,
    boostCreditsPerMonth: 20,
    leadInboxLimit: null,
    analyticsEnabled: true,
    features: [
      "Limitsiz aktiv elan",
      "Elan başına 40 şəkil + 5 video",
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
