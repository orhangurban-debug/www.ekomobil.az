/**
 * EkoMobil — Avto Salon Abunəlik Planları
 *
 * Fərdi satıcı planlarından (listing-plans.ts) fərqli olaraq, SALON planları
 * aylıq abunədir: sabit ödəniş → N aktiv elan hüququ.
 *
 * Salon elanlarının hər biri avtomatik olaraq "Standart" keyfiyyəti alır:
 *   • 20 foto (sıxılmış JPEG, max 1280 px)
 *   • 1 video (max 50 MB)
 *   • 60 gün aktiv müddət
 *
 * Şəkil emalı fərdi satıcılarla eynidir:
 *   • Hər format (HEIC, PNG, WebP, RAW) → JPEG 85% sıxılır
 *   • Maksimum giriş ölçüsü: 30 MB/fayl (RAW/telefon fotosu)
 *   • Çıxış: ~1-3 MB/şəkil
 *   → bax: src/lib/image-processor.ts
 */

export type DealerPlanId = "starter" | "pro" | "enterprise";

export interface DealerPlan {
  id: DealerPlanId;
  nameAz: string;
  /** Aylıq abunə ödənişi */
  priceAzn: number;
  billingCycle: "monthly";
  /** Eyni anda aktiv ola biləcək maksimum elan sayı (null = limitsiz) */
  maxListings: number | null;
  /** Hər elanda maksimum şəkil sayı */
  perListingMaxImages: number;
  /** CSV toplu yükləmə imkanı */
  csvImportEnabled: boolean;
  /** Aylıq VIN sorğu krediti (null = yoxdur) */
  vinCreditsPerMonth: number | null;
  /** Çoxlu filial idarəetməsi */
  multiBranchEnabled: boolean;
  features: string[];
  highlight?: boolean;
}

export const DEALER_PLANS: DealerPlan[] = [
  {
    id: "starter",
    nameAz: "Salon Başlanğıc",
    priceAzn: 0,
    billingCycle: "monthly",
    maxListings: 10,
    perListingMaxImages: 12,
    csvImportEnabled: false,
    vinCreditsPerMonth: null,
    multiBranchEnabled: false,
    features: [
      "10 aktiv elan (eyni anda)",
      "Elan başına 12 şəkil",
      "Salon profil səhifəsi",
      "Lead qutusu (məhdud — son 20 sorğu)",
      "Standart axtarış görünüşü"
    ]
  },
  {
    id: "pro",
    nameAz: "Salon Pro",
    priceAzn: 29,
    billingCycle: "monthly",
    maxListings: 50,
    perListingMaxImages: 20,
    csvImportEnabled: true,
    vinCreditsPerMonth: 5,
    multiBranchEnabled: false,
    highlight: true,
    features: [
      "50 aktiv elan (eyni anda)",
      "Elan başına 20 şəkil + 1 video",
      "CSV toplu yükləmə",
      "Tam lead CRM qutusu",
      "Baxış & lead statistikası",
      "VIN servis sorğusu — 5 kredit/ay",
      "\"Doğrulanmış Salon\" badge"
    ]
  },
  {
    id: "enterprise",
    nameAz: "Salon Enterprise",
    priceAzn: 79,
    billingCycle: "monthly",
    maxListings: null,
    perListingMaxImages: 40,
    csvImportEnabled: true,
    vinCreditsPerMonth: 20,
    multiBranchEnabled: true,
    features: [
      "Limitsiz aktiv elan",
      "Elan başına 40 şəkil + 3 video",
      "CSV toplu yükləmə (limit yoxdur)",
      "Çoxlu filial — vahid idarəetmə",
      "Tam lead CRM + SLA izləmə",
      "Qabaqcıl analytics & Excel export",
      "VIN servis sorğusu — 20 kredit/ay",
      "Auksion lot yerləşdirmə hüququ",
      "Prioritet dəstək + hesab meneceri"
    ]
  }
];

export function getDealerPlanById(id: DealerPlanId): DealerPlan | undefined {
  return DEALER_PLANS.find((p) => p.id === id);
}
