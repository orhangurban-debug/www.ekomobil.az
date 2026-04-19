// ─── Provider types ─────────────────────────────────────────────────────────

export type ServiceProviderType =
  // Official / branded
  | "official_service"
  | "inspection_company"
  // General mechanics
  | "mechanic"
  | "auto_electrician"
  | "body_shop"
  | "painting"
  // Modern/tech specialists
  | "ev_hybrid"
  | "ecu_programmer"
  | "adas_specialist"
  // Comfort & interior
  | "ac_specialist"
  | "audio_media"
  | "glass_sunroof"
  // Wheel & chassis
  | "tire_wheel";

export const SERVICE_PROVIDER_TYPE_LABELS: Record<ServiceProviderType, string> = {
  official_service: "Rəsmi servis",
  inspection_company: "Ekspertiza şirkəti",
  mechanic: "Mexanik / usta",
  auto_electrician: "Avto elektrik",
  body_shop: "Dəmirçi / kuzov",
  painting: "Rəngləmə",
  ev_hybrid: "EV / Hibrid mütəxəssisi",
  ecu_programmer: "ECU proqramlaşdırma",
  adas_specialist: "ADAS / Kamera kalibrasiyası",
  ac_specialist: "Kondisioner / soyuducu",
  audio_media: "Audio / multimedia",
  glass_sunroof: "Cam / lyuk",
  tire_wheel: "Şin balansı / texeraltı"
};

// ─── Groups (for sidebar filtering) ─────────────────────────────────────────

export interface ServiceProviderGroup {
  id: string;
  label: string;
  types: ServiceProviderType[];
}

export const SERVICE_PROVIDER_GROUPS: ServiceProviderGroup[] = [
  {
    id: "official",
    label: "Rəsmi və ekspertiza",
    types: ["official_service", "inspection_company"]
  },
  {
    id: "mechanic",
    label: "Mexanik və bərpa",
    types: ["mechanic", "body_shop", "painting"]
  },
  {
    id: "electric",
    label: "Elektrik və elektronika",
    types: ["auto_electrician", "ecu_programmer", "adas_specialist"]
  },
  {
    id: "tech",
    label: "Yeni texnologiya",
    types: ["ev_hybrid"]
  },
  {
    id: "comfort",
    label: "Komfort və interior",
    types: ["ac_specialist", "audio_media", "glass_sunroof"]
  },
  {
    id: "wheel",
    label: "Şin və texeraltı",
    types: ["tire_wheel"]
  }
];

// ─── Listing record ──────────────────────────────────────────────────────────

export interface ServiceListingRecord {
  slug: string;
  name: string;
  providerType: ServiceProviderType;
  city: string;
  rating: number;
  reviewCount: number;
  responseMinutes: number;
  about: string;
  services: string[];
  certifications?: string[];
  phone: string;
  whatsapp: string;
}

// ─── Demo data ───────────────────────────────────────────────────────────────

export const demoServiceListings: ServiceListingRecord[] = [
  {
    slug: "autocheck-baki",
    name: "AutoCheck Bakı",
    providerType: "inspection_company",
    city: "Bakı",
    rating: 4.9,
    reviewCount: 124,
    responseMinutes: 18,
    about: "220 bəndlik texniki yoxlama və rəqəmsal ekspertiza raportu təqdim edir.",
    services: ["Diaqnostika", "Boya ölçümü", "Road test", "Ekspertiza raportu"],
    certifications: ["ISO 9001", "Müstəqil ekspert sertifikatı"],
    phone: "+994501112233",
    whatsapp: "+994501112233"
  },
  {
    slug: "toyota-baki-servis",
    name: "Toyota Bakı Rəsmi Servis",
    providerType: "official_service",
    city: "Bakı",
    rating: 4.7,
    reviewCount: 89,
    responseMinutes: 25,
    about: "Rəsmi servis tarixçəsi, orijinal ehtiyat hissələri və zavod standartına uyğun xidmət.",
    services: ["Periodik baxım", "Rəsmi servis kitabçası", "ECU yeniləmə"],
    certifications: ["Brend akkreditasiyası"],
    phone: "+994551000200",
    whatsapp: "+994551000200"
  },
  {
    slug: "usta-elektrik-ali",
    name: "Usta Elektrik Ali",
    providerType: "auto_electrician",
    city: "Sumqayıt",
    rating: 4.8,
    reviewCount: 57,
    responseMinutes: 30,
    about: "Elektrik və sensor problemlərinin diaqnostika və təmiri üzrə ixtisaslaşmış usta.",
    services: ["ABS/ESP", "Starter/alternator", "Sensor diaqnostika"],
    phone: "+994709090909",
    whatsapp: "+994709090909"
  },
  {
    slug: "demirci-center-ganja",
    name: "Dəmirçi Center Gəncə",
    providerType: "body_shop",
    city: "Gəncə",
    rating: 4.6,
    reviewCount: 42,
    responseMinutes: 35,
    about: "Kuzov düzəltmə, rəngləmə və qəza sonrası bərpa işləri.",
    services: ["Kuzov təmiri", "Rəngləmə", "Şassi bərpası"],
    phone: "+994502221100",
    whatsapp: "+994502221100"
  },
  {
    slug: "usta-motor-ramin",
    name: "Usta Motor Ramin",
    providerType: "mechanic",
    city: "Bakı",
    rating: 4.7,
    reviewCount: 76,
    responseMinutes: 22,
    about: "Mühərrik və transmissiya işlərində təcrübəli ustadır.",
    services: ["Mühərrik təmiri", "Sürətlər qutusu", "Yağlama sistemi"],
    phone: "+994507770055",
    whatsapp: "+994507770055"
  },
  {
    slug: "ev-tech-baki",
    name: "EV Tech Bakı",
    providerType: "ev_hybrid",
    city: "Bakı",
    rating: 4.9,
    reviewCount: 38,
    responseMinutes: 20,
    about: "Elektrikli və hibrid avtomobillər üzrə texniki diaqnostika, batareya yoxlaması və proqram yeniləmələri.",
    services: ["BMS diaqnostika", "Batareya balansı", "Şarj sistemi", "Hibrid kalibrasiya"],
    certifications: ["Tesla sertifikatı"],
    phone: "+994502050505",
    whatsapp: "+994502050505"
  },
  {
    slug: "ecu-master-nizami",
    name: "ECU Master Nizami",
    providerType: "ecu_programmer",
    city: "Bakı",
    rating: 4.8,
    reviewCount: 61,
    responseMinutes: 25,
    about: "Beyin oxunması, xəta silmə, adaptasiya, DPF/EGR söndürmə və gücləndirmə proqramlaması.",
    services: ["ECU oxuma/yazma", "DPF/EGR off", "Stage tuning", "İmmobilazer bərpası"],
    phone: "+994503030303",
    whatsapp: "+994503030303"
  },
  {
    slug: "adas-vision-baki",
    name: "ADAS Vision Bakı",
    providerType: "adas_specialist",
    city: "Bakı",
    rating: 4.7,
    reviewCount: 29,
    responseMinutes: 40,
    about: "Ön kamera kalibrasiyası, radar hizalanması, park sensorları və sürücü yardım sistemlərinin kalibrasiyası.",
    services: ["Kamera kalibrasiyası", "Radar hizalanması", "Park sensoru", "Lane assist"],
    phone: "+994501234567",
    whatsapp: "+994501234567"
  }
];

export function getServiceListingBySlug(slug: string): ServiceListingRecord | null {
  return demoServiceListings.find((item) => item.slug === slug) ?? null;
}

export function getAllServiceProviderTypes(): ServiceProviderType[] {
  return Object.keys(SERVICE_PROVIDER_TYPE_LABELS) as ServiceProviderType[];
}
