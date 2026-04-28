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
  launchOfferAz?: string;
  ctaLabel: string;
  ctaHref: string;
}

// ─── Rəsmi servis planları ───────────────────────────────────────────────────

export const OFFICIAL_SERVICE_PLANS: ServicePlan[] = [
  {
    id: "official-starter",
    nameAz: "Filial",
    priceAzn: 79,
    billingAz: "/ ay",
    descriptionAz: "Tək filialı olan rəsmi servis üçün əlçatan başlanğıc paket.",
    features: [
      "Tərəfdaşlıq müraciət formu və manual baxış",
      "Servis növü, şəhər və əlaqə məlumatlarının toplanması",
      "20 xidmət tagı seçimi",
      "3 sertifikasiya nişanı seçimi",
      "6 servis şəkli və 3 sertifikat faylı yükləmə limiti"
    ],
    launchOfferAz: "İlk 30 gün pulsuz aktivasiya",
    ctaLabel: "Başla",
    ctaHref: "/partners/inspection"
  },
  {
    id: "official-pro",
    nameAz: "Mərkəz",
    priceAzn: 149,
    billingAz: "/ ay",
    highlight: true,
    tagAz: "Ən populyar",
    descriptionAz: "Aktiv rəsmi servis mərkəzləri üçün daha güclü onboarding və təqdimat.",
    features: [
      "Filial paketindəki bütün imkanlar",
      "40 xidmət tagı seçimi",
      "6 sertifikasiya nişanı seçimi",
      "12 servis şəkli və 6 sertifikat faylı yükləmə limiti",
      "Müraciətdə plan seçimi və manual təsdiq axını"
    ],
    launchOfferAz: "İlk 30 gün pulsuz aktivasiya",
    ctaLabel: "Pro seç",
    ctaHref: "/partners/inspection"
  },
  {
    id: "official-premium",
    nameAz: "Şəbəkə",
    priceAzn: 279,
    billingAz: "/ ay",
    tagAz: "Multi-filial",
    descriptionAz: "Bir neçə filialı olan rəsmi servis şəbəkələri üçün korporativ paket.",
    features: [
      "Mərkəz paketindəki bütün imkanlar",
      "80 xidmət tagı seçimi",
      "12 sertifikasiya nişanı seçimi",
      "20 servis şəkli və 10 sertifikat faylı yükləmə limiti",
      "Manual korporativ onboarding koordinasiyası"
    ],
    launchOfferAz: "İlk 30 gün pulsuz aktivasiya",
    ctaLabel: "Bizimlə əlaqə",
    ctaHref: "/partners/inspection"
  }
];

// ─── Ekspertiza şirkəti planları ─────────────────────────────────────────────

export const INSPECTION_COMPANY_PLANS: ServicePlan[] = [
  {
    id: "insp-starter",
    nameAz: "Solo",
    priceAzn: 39,
    billingAz: "/ ay",
    descriptionAz: "Müstəqil ekspert və kiçik ekspertiza nöqtəsi üçün başlanğıc paket.",
    features: [
      "Tərəfdaşlıq müraciət formu və manual baxış",
      "Servis növü, şəhər və əlaqə məlumatlarının toplanması",
      "12 xidmət tagı seçimi",
      "3 sertifikasiya nişanı seçimi",
      "5 obyekt şəkli və 4 sertifikat faylı yükləmə limiti"
    ],
    launchOfferAz: "İlk 30 gün pulsuz aktivasiya",
    ctaLabel: "Başla",
    ctaHref: "/partners/inspection"
  },
  {
    id: "insp-pro",
    nameAz: "Mərkəz",
    priceAzn: 79,
    billingAz: "/ ay",
    highlight: true,
    tagAz: "Ən populyar",
    descriptionAz: "Daimi yoxlama axını olan ekspertiza mərkəzləri üçün.",
    features: [
      "Solo paketindəki bütün imkanlar",
      "24 xidmət tagı seçimi",
      "6 sertifikasiya nişanı seçimi",
      "10 obyekt şəkli və 8 sertifikat faylı yükləmə limiti",
      "Müraciətdə plan seçimi və manual təsdiq axını"
    ],
    launchOfferAz: "İlk 30 gün pulsuz aktivasiya",
    ctaLabel: "Pro seç",
    ctaHref: "/partners/inspection"
  },
  {
    id: "insp-premium",
    nameAz: "Şəbəkə",
    priceAzn: 149,
    billingAz: "/ ay",
    tagAz: "Şəbəkə",
    descriptionAz: "Bir neçə ekspert və filialla işləyən şirkətlər üçün şəbəkə paketi.",
    features: [
      "Mərkəz paketindəki bütün imkanlar",
      "48 xidmət tagı seçimi",
      "12 sertifikasiya nişanı seçimi",
      "16 obyekt şəkli və 12 sertifikat faylı yükləmə limiti",
      "Manual korporativ onboarding koordinasiyası"
    ],
    launchOfferAz: "İlk 30 gün pulsuz aktivasiya",
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
    descriptionAz: "Yeni başlayan fərdi usta üçün sıfır girişli profil.",
    features: [
      "Tərəfdaşlıq müraciət formu və manual baxış",
      "Servis növü, şəhər və əlaqə məlumatlarının toplanması",
      "5 xidmət tagı seçimi",
      "1 sertifikasiya nişanı seçimi",
      "3 şəkil və 1 sertifikat faylı yükləmə limiti"
    ],
    ctaLabel: "Pulsuz başla",
    ctaHref: "/partners/inspection"
  },
  {
    id: "usta-pro",
    nameAz: "Usta Pro",
    priceAzn: 19,
    billingAz: "/ ay",
    highlight: true,
    tagAz: "Ən populyar",
    descriptionAz: "Daha çox müraciət almaq istəyən fərdi usta üçün.",
    features: [
      "Pulsuz paketindəki bütün imkanlar",
      "15 xidmət tagı seçimi",
      "3 sertifikasiya nişanı seçimi",
      "8 şəkil və 3 sertifikat faylı yükləmə limiti",
      "Müraciətdə plan seçimi və manual təsdiq axını"
    ],
    launchOfferAz: "İlk 30 gün pulsuz aktivasiya",
    ctaLabel: "Pro seç",
    ctaHref: "/partners/inspection"
  },
  {
    id: "usta-team",
    nameAz: "Emalatxana",
    priceAzn: 49,
    billingAz: "/ ay",
    tagAz: "Kiçik servis",
    descriptionAz: "2-4 nəfərlik kiçik servis və usta komandaları üçün.",
    features: [
      "Usta Pro paketindəki bütün imkanlar",
      "30 xidmət tagı seçimi",
      "6 sertifikasiya nişanı seçimi",
      "15 şəkil və 6 sertifikat faylı yükləmə limiti",
      "Manual komanda onboarding koordinasiyası"
    ],
    launchOfferAz: "İlk 30 gün pulsuz aktivasiya",
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
