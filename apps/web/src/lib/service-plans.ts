// ─── Service Provider Pricing Plans ─────────────────────────────────────────
// Rəsmi servis, Ekspertiza şirkəti və Usta planları

export interface ServicePlan {
  id: string;
  nameAz: string;
  priceAzn: number;
  billingAz: string; // "/ ay" | "/ elan"
  highlight?: boolean;
  tagAz?: string;
  descriptionAz: string;
  features: string[];
  comingSoon?: string[];
  ctaLabel: string;
  ctaHref: string;
}

// ─── Rəsmi servis planları ───────────────────────────────────────────────────

export const OFFICIAL_SERVICE_PLANS: ServicePlan[] = [
  {
    id: "official-starter",
    nameAz: "Starter",
    priceAzn: 79,
    billingAz: "/ ay",
    descriptionAz: "Tək filial, əsas profil görünüşü.",
    features: [
      "1 servis profili",
      "5 xidmət elanı",
      "Standart axtarış görünüşü",
      "Lokal şəhər filtrinə daxil edilmə",
      "Müştəri zəng/WhatsApp düyməsi",
      "Rəylər bölməsi"
    ],
    comingSoon: ["Randevu sistemi"],
    ctaLabel: "Başla",
    ctaHref: "/partners/inspection"
  },
  {
    id: "official-pro",
    nameAz: "Pro",
    priceAzn: 149,
    billingAz: "/ ay",
    highlight: true,
    tagAz: "Ən populyar",
    descriptionAz: "Vurğulanmış profil, statistika və genişlənmiş elanlar.",
    features: [
      "1 servis profili (vurğulanmış)",
      "25 xidmət elanı",
      "Prioritet axtarış sıralanması",
      "Şəkil qalereya (20 şəkil/elan)",
      "Baxış & klik statistikası",
      "Sertifikasiya bölməsi",
      "1 aylıq boost daxildir",
      "EkoMobil auksion elan inteqrasiyası"
    ],
    comingSoon: ["Randevu sistemi", "Müştəri CRM"],
    ctaLabel: "Pro seç",
    ctaHref: "/partners/inspection"
  },
  {
    id: "official-premium",
    nameAz: "Premium",
    priceAzn: 299,
    billingAz: "/ ay",
    tagAz: "Multi-filial",
    descriptionAz: "Çoxfilial idarəetmə, API inteqrasiya, ana səhifə yerləşdirmə.",
    features: [
      "5 filial profili",
      "Limitsiz xidmət elanı",
      "Ana səhifə featured blok",
      "4× prioritet sıralanma",
      "API inteqrasiya (xidmət tarixi)",
      "Aylıq hesabat paketi",
      "Dedicated account manager",
      "EkoMobil ekspertiza badge"
    ],
    comingSoon: ["White-label hesabat PDF", "QR kodu randevu sistemi"],
    ctaLabel: "Bizimlə əlaqə",
    ctaHref: "/partners/inspection"
  }
];

// ─── Ekspertiza şirkəti planları ─────────────────────────────────────────────

export const INSPECTION_COMPANY_PLANS: ServicePlan[] = [
  {
    id: "insp-starter",
    nameAz: "Starter",
    priceAzn: 59,
    billingAz: "/ ay",
    descriptionAz: "Müstəqil ekspert və kiçik şirkətlər üçün.",
    features: [
      "1 ekspert profili",
      "10 hesabat elanı / ay",
      "Profil sertifikasiya bölməsi",
      "Lokal axtarış görünüşü",
      "Müştəri əlaqə düymələri"
    ],
    comingSoon: ["Rəqəmsal hesabat şablonu"],
    ctaLabel: "Başla",
    ctaHref: "/partners/inspection"
  },
  {
    id: "insp-pro",
    nameAz: "Pro",
    priceAzn: 119,
    billingAz: "/ ay",
    highlight: true,
    tagAz: "Ən populyar",
    descriptionAz: "Aktiv ekspertiza şirkətləri üçün.",
    features: [
      "3 ekspert profili",
      "50 hesabat elanı / ay",
      "Vurğulanmış profil kartı",
      "EkoMobil auksion tərəfdaş nişanı",
      "Baxış statistikası",
      "Sertifikasiya yükləmə (ISO, akkreditasiya)",
      "1 aylıq boost daxildir"
    ],
    comingSoon: ["Müştəriyə hesabat e-poçt göndərmə"],
    ctaLabel: "Pro seç",
    ctaHref: "/partners/inspection"
  },
  {
    id: "insp-premium",
    nameAz: "Premium",
    priceAzn: 249,
    billingAz: "/ ay",
    tagAz: "Şəbəkə",
    descriptionAz: "Çox inspektorlu şirkətlər və şəbəkələr üçün.",
    features: [
      "10 ekspert profili",
      "Limitsiz hesabat elanı",
      "API: EkoMobil elanlarına hesabat bağlama",
      "Audit log və hesabat arxivi",
      "Ana səhifə tərəfdaş bölməsi",
      "Aylıq data export (CSV/PDF)",
      "Dedicated texniki dəstək"
    ],
    comingSoon: ["Rəqəmsal imza inteqrasiyası", "ASAN servis"],
    ctaLabel: "Bizimlə əlaqə",
    ctaHref: "/partners/inspection"
  }
];

// ─── Usta planları ───────────────────────────────────────────────────────────

export const MECHANIC_PLANS: ServicePlan[] = [
  {
    id: "usta-free",
    nameAz: "Pulsuz",
    priceAzn: 0,
    billingAz: "",
    descriptionAz: "Fərdi usta üçün başlanğıc profil.",
    features: [
      "1 usta profili",
      "3 xidmət elanı",
      "Lokal axtarış görünüşü",
      "Müştəri əlaqə düyməsi",
      "Xidmət kateqoriyası seçimi"
    ],
    comingSoon: ["Rəy sistemi"],
    ctaLabel: "Pulsuz başla",
    ctaHref: "/partners/inspection"
  },
  {
    id: "usta-pro",
    nameAz: "Pro Usta",
    priceAzn: 39,
    billingAz: "/ ay",
    highlight: true,
    tagAz: "Ən populyar",
    descriptionAz: "Aktiv fərdi ustalar üçün.",
    features: [
      "1 usta profili (vurğulanmış)",
      "15 xidmət elanı",
      "Prioritet şəhər axtarışı",
      "Baxış statistikası",
      "Şəkil qalereya (10 şəkil/elan)",
      "1 aylıq boost daxildir",
      "Whatsapp birbaşa düymə"
    ],
    comingSoon: ["Rəy sistemi", "Portfolio bölməsi"],
    ctaLabel: "Pro seç",
    ctaHref: "/partners/inspection"
  },
  {
    id: "usta-team",
    nameAz: "Komanda",
    priceAzn: 89,
    billingAz: "/ ay",
    tagAz: "Kiçik servis",
    descriptionAz: "Kiçik servis mərkəzləri və usta qrupları üçün.",
    features: [
      "5 usta profili",
      "50 xidmət elanı",
      "Servis mərkəzi profili",
      "4× prioritet sıralanma",
      "Bütün ixtisas kateqoriyaları",
      "Aylıq statistika hesabatı",
      "EV/Hibrid, ADAS, ECU alt-profillər"
    ],
    comingSoon: ["Onlayn randevu", "Müştəri loyallıq sistemi"],
    ctaLabel: "Komanda planı seç",
    ctaHref: "/partners/inspection"
  }
];

// ─── Category descriptor (for pricing page tabs) ────────────────────────────

export interface ServicePlanCategory {
  id: string;
  label: string;
  subLabel: string;
  color: string;
  borderColor: string;
  plans: ServicePlan[];
  subtypes: string[];
}

export const SERVICE_PLAN_CATEGORIES: ServicePlanCategory[] = [
  {
    id: "official",
    label: "Rəsmi servis",
    subLabel: "Brend servis mərkəzləri, avtorizə diler servisləri",
    color: "text-[#0891B2]",
    borderColor: "border-[#0891B2]/30",
    plans: OFFICIAL_SERVICE_PLANS,
    subtypes: ["Rəsmi servis", "Avtorizə diler servisi", "Zəmanət servis mərkəzi", "Multi-brend servis"]
  },
  {
    id: "inspection",
    label: "Ekspertiza şirkəti",
    subLabel: "Müstəqil texniki yoxlama, alqı-satqı öncəsi ekspertiza",
    color: "text-emerald-700",
    borderColor: "border-emerald-300",
    plans: INSPECTION_COMPANY_PLANS,
    subtypes: [
      "Müstəqil ekspertiza",
      "Sığorta qiymətləndirmə",
      "Alqı-satqı öncəsi yoxlama",
      "Kuzov / boya ölçümü",
      "Texniki pasport ekspertizası"
    ]
  },
  {
    id: "mechanic",
    label: "Ustalar",
    subLabel: "Mexanik, elektrik, EV, ECU, ADAS, kuzov, rəng, şin və digər xidmət növləri",
    color: "text-amber-700",
    borderColor: "border-amber-300",
    plans: MECHANIC_PLANS,
    subtypes: [
      "Mexanik / ümumi baxım",
      "Avto elektrik",
      "Dəmirçi / kuzov",
      "Rəngləmə",
      "EV / Hibrid mütəxəssisi",
      "ECU proqramlaşdırma",
      "ADAS / Kamera kalibrasiyası",
      "Kondisioner / soyuducu",
      "Audio / multimedia",
      "Cam / lyuk",
      "Şin balansı / texeraltı"
    ]
  }
];
