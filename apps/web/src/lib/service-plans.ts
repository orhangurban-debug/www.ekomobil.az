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
    nameAz: "Filial",
    priceAzn: 129,
    billingAz: "/ ay",
    descriptionAz: "Tək filialı olan rəsmi servis üçün baza paket.",
    features: [
      "1 filial profili",
      "20 xidmət tagı və servis istiqaməti",
      "Brend və sertifikasiya nişanları",
      "Şəhər və marka filtrində görünmə",
      "Zəng / WhatsApp / ünvan kartı",
      "İş saatları və qəbul forması"
    ],
    comingSoon: ["Onlayn randevu təqvimi"],
    ctaLabel: "Başla",
    ctaHref: "/partners/inspection"
  },
  {
    id: "official-pro",
    nameAz: "Mərkəz",
    priceAzn: 249,
    billingAz: "/ ay",
    highlight: true,
    tagAz: "Ən populyar",
    descriptionAz: "Aktiv rəsmi servis mərkəzləri üçün görünürlük və lead idarəetməsi.",
    features: [
      "2 filial profili",
      "50 xidmət tagı və ayrıca xidmət blokları",
      "Vurğulanmış profil kartı",
      "Marka/model üzrə prioritet sıralanma",
      "Lead siyahısı və aylıq statistika",
      "Servis qalereyası və komanda bölməsi",
      "Ayda 2 boost yerləşdirmə",
      "Auksion və ekspertiza yönləndirmələri"
    ],
    comingSoon: ["Onlayn randevu", "Müştəri CRM"],
    ctaLabel: "Pro seç",
    ctaHref: "/partners/inspection"
  },
  {
    id: "official-premium",
    nameAz: "Şəbəkə",
    priceAzn: 449,
    billingAz: "/ ay",
    tagAz: "Multi-filial",
    descriptionAz: "Bir neçə filialı olan diler və servis şəbəkələri üçün korporativ paket.",
    features: [
      "6 filial profili",
      "100 xidmət tagı və kampaniya blokları",
      "Ana səhifə və premium kataloq görünüşü",
      "4× prioritet sıralanma",
      "Multi-user idarəetmə",
      "CSV/API lead export",
      "Aylıq performans hesabatı",
      "Dedicated account manager"
    ],
    comingSoon: ["Servis tarixçəsi inteqrasiyası", "QR randevu sistemi"],
    ctaLabel: "Bizimlə əlaqə",
    ctaHref: "/partners/inspection"
  }
];

// ─── Ekspertiza şirkəti planları ─────────────────────────────────────────────

export const INSPECTION_COMPANY_PLANS: ServicePlan[] = [
  {
    id: "insp-starter",
    nameAz: "Solo",
    priceAzn: 79,
    billingAz: "/ ay",
    descriptionAz: "Müstəqil ekspert və kiçik ekspertiza nöqtəsi üçün.",
    features: [
      "1 ekspert profili",
      "20 yoxlama raportu / ay",
      "Sertifikasiya və avadanlıq bölməsi",
      "Şəhər üzrə axtarış görünüşü",
      "Zəng / WhatsApp / xəritə",
      "Qiymət aralığı və xidmət tagları"
    ],
    comingSoon: ["Rəqəmsal raport şablonu"],
    ctaLabel: "Başla",
    ctaHref: "/partners/inspection"
  },
  {
    id: "insp-pro",
    nameAz: "Mərkəz",
    priceAzn: 149,
    billingAz: "/ ay",
    highlight: true,
    tagAz: "Ən populyar",
    descriptionAz: "Gündəlik aktiv yoxlama aparan ekspertiza mərkəzləri üçün.",
    features: [
      "3 ekspert profili",
      "80 yoxlama raportu / ay",
      "Vurğulanmış profil kartı",
      "EkoMobil auksion tərəfdaş nişanı",
      "Lead və baxış statistikası",
      "Sertifikasiya və raport nümunələri",
      "Ayda 2 boost yerləşdirmə",
      "Prioritet dəstək"
    ],
    comingSoon: ["Müştəriyə raport göndərmə"],
    ctaLabel: "Pro seç",
    ctaHref: "/partners/inspection"
  },
  {
    id: "insp-premium",
    nameAz: "Şəbəkə",
    priceAzn: 289,
    billingAz: "/ ay",
    tagAz: "Şəbəkə",
    descriptionAz: "Bir neçə ekspert və filialla işləyən şirkətlər üçün.",
    features: [
      "8 ekspert / filial profili",
      "200 raport / ay",
      "Auksion lotlarına raport bağlama üstünlüyü",
      "Raport arxivi və audit izi",
      "Premium tərəfdaş görünüşü",
      "CSV/PDF export",
      "Dedicated texniki dəstək"
    ],
    comingSoon: ["Rəqəmsal imza", "API raport inteqrasiyası"],
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
      "1 usta profili",
      "5 xidmət tagı",
      "Lokal axtarış görünüşü",
      "Zəng / WhatsApp düyməsi",
      '3 şəkil və 1 "haqqımda" bloku',
      "Şəhər və ixtisas seçimi"
    ],
    comingSoon: ["Rəy sistemi"],
    ctaLabel: "Pulsuz başla",
    ctaHref: "/partners/inspection"
  },
  {
    id: "usta-pro",
    nameAz: "Usta Pro",
    priceAzn: 29,
    billingAz: "/ ay",
    highlight: true,
    tagAz: "Ən populyar",
    descriptionAz: "Daha çox müraciət almaq istəyən fərdi usta üçün.",
    features: [
      "1 usta profili (vurğulanmış)",
      "15 xidmət tagı",
      "Rayon / şəhər üzrə prioritet görünüş",
      "10 şəkil və iş nümunələri",
      "WhatsApp birbaşa düyməsi",
      "Sadə baxış statistikası",
      "Ayda 1 boost yerləşdirmə",
      "Portfolio bölməsi"
    ],
    comingSoon: ["Rəy sistemi", "Portfolio bölməsi"],
    ctaLabel: "Pro seç",
    ctaHref: "/partners/inspection"
  },
  {
    id: "usta-team",
    nameAz: "Emalatxana",
    priceAzn: 69,
    billingAz: "/ ay",
    tagAz: "Kiçik servis",
    descriptionAz: "2-4 nəfərlik kiçik servis və usta komandaları üçün.",
    features: [
      "4 usta profili",
      "30 xidmət tagı",
      "Emalatxana profil səhifəsi",
      "Komanda və ixtisas bölməsi",
      "Şəhər üzrə premium sıralanma",
      "Aylıq statistika xülasəsi",
      "EV / ECU / ADAS alt-ixtisasları"
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
