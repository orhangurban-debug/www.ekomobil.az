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
      "1 servis profili üçün onboarding",
      "Servis növü və xidmət taglarının seçimi",
      "Brend / sertifikasiya nişanlarının göstərilməsi",
      "6 servis şəkli və 3 sertifikat faylı upload",
      "Servislər kataloqunda profil kartı",
      "Şəhər və xidmət növü filtrlərində görünüş",
      "Profil səhifəsində zəng və WhatsApp düymələri"
    ],
    comingSoon: ["Onlayn randevu təqvimi"],
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
      "Bir neçə xidmət istiqamətinin birlikdə yerləşdirilməsi",
      "Ops tərəfindən prioritet aktivasiya baxışı",
      "Əlavə sertifikasiya və brend məlumatı",
      "12 servis şəkli və 6 sertifikat faylı upload",
      "Komanda / xidmət təsviri üçün geniş onboarding",
      "İlk ay pulsuz kampaniya hüququ"
    ],
    comingSoon: ["Onlayn randevu", "Müştəri CRM", "Lead statistikası"],
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
      "Çox filial onboarding dəstəyi",
      "Korporativ yerləşdirmə üçün fərdi setup",
      "Fərdi kommersiya və hesab idarəetməsi",
      "20 servis şəkli və 10 sertifikat faylı upload",
      "Satış komandası ilə manual koordinasiya",
      "İlk ay pulsuz kampaniya hüququ"
    ],
    comingSoon: ["Servis tarixçəsi inteqrasiyası", "QR randevu sistemi", "Çox istifadəçili panel"],
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
      "1 ekspert profili üçün onboarding",
      "Ekspertiza növü və yoxlama taglarının seçimi",
      "Sertifikasiya nişanlarının göstərilməsi",
      "5 obyekt şəkli və 4 sertifikat faylı upload",
      "Servislər kataloqunda profil kartı",
      "Şəhər filtrlərində görünüş",
      "Profil səhifəsində zəng və WhatsApp düymələri"
    ],
    comingSoon: ["Rəqəmsal raport şablonu"],
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
      "Bir neçə yoxlama istiqamətinin birlikdə təqdimatı",
      "Ops tərəfindən prioritet aktivasiya baxışı",
      "Əlavə sertifikasiya və avadanlıq məlumatı",
      "10 obyekt şəkli və 8 sertifikat faylı upload",
      "Auksion uyğunluğu üçün manual qiymətləndirmə",
      "İlk ay pulsuz kampaniya hüququ"
    ],
    comingSoon: ["Müştəriyə raport göndərmə", "Lead statistikası"],
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
      "Çox ekspert / filial onboarding dəstəyi",
      "Premium tərəfdaş kimi manual yerləşdirmə",
      "Fərdi kommersiya təklifi",
      "16 obyekt şəkli və 12 sertifikat faylı upload",
      "Prioritet dəstək və setup əlaqələndirməsi",
      "İlk ay pulsuz kampaniya hüququ"
    ],
    comingSoon: ["Rəqəmsal imza", "API raport inteqrasiyası", "Raport arxivi paneli"],
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
      "1 usta profili",
      "5 xidmət tagı seçimi",
      "Şəhər və ixtisas üzrə görünüş",
      "3 şəkil və 1 sertifikat faylı upload",
      "Zəng / WhatsApp düyməsi",
      "Profil müraciəti və əsas məlumat sahələri",
      "Kataloqda profil kartı"
    ],
    comingSoon: ["Rəy sistemi"],
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
      "Ops tərəfindən prioritet aktivasiya baxışı",
      "Əlavə sertifikasiya nişanları",
      "8 şəkil və 3 sertifikat faylı upload",
      "Profil təsviri üçün geniş onboarding",
      "İlk ay pulsuz kampaniya hüququ"
    ],
    comingSoon: ["Rəy sistemi", "Portfolio bölməsi", "Sadə statistika"],
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
      "Bir neçə ixtisasın bir profildə toplanması",
      "Kiçik komanda üçün onboarding dəstəyi",
      "EV / ECU / ADAS kimi ixtisasların birlikdə seçimi",
      "15 şəkil və 6 sertifikat faylı upload",
      "Əlavə qeydlərlə komanda təqdimatı",
      "İlk ay pulsuz kampaniya hüququ"
    ],
    comingSoon: ["Onlayn randevu", "Müştəri loyallıq sistemi", "Komanda idarəetməsi"],
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
