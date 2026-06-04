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
  address?: string;
  mapUrl?: string;
  rating: number;
  reviewCount: number;
  responseMinutes: number;
  about: string;
  services: string[];
  certifications?: string[];
  phone: string;
  whatsapp: string;
  imageUrls?: string[];
}

// Real service provider data is fetched from the database via the partner onboarding flow.
// Demo listings below are used as showcase data until partner onboarding goes live.

export const demoServiceListings: ServiceListingRecord[] = [
  {
    slug: "avtoexpert-baki",
    name: "AvtoExpert Bakı",
    providerType: "inspection_company",
    city: "Bakı",
    address: "Neftçilər pr., 88, Bakı",
    rating: 4.8,
    reviewCount: 124,
    responseMinutes: 20,
    about: "15 illik təcrübəyə malik peşəkar avtomobil ekspertiza mərkəzi. Alış-satış öncəsi tam texniki yoxlama, kompüter diaqnostikası, gizli zərərlərin aşkar edilməsi.",
    services: ["Alış öncəsi yoxlama", "Kompüter diaqnostika", "Kuzov yoxlaması", "Rəsmi arayış"],
    certifications: ["ISO 9001", "ADNSU sertifikatı"],
    phone: "+994501234567",
    whatsapp: "+994501234567"
  },
  {
    slug: "bmw-rəsmi-servis",
    name: "BMG Motors — BMW Rəsmi Servisi",
    providerType: "official_service",
    city: "Bakı",
    address: "Heydər Əliyev pr., 150",
    rating: 4.9,
    reviewCount: 312,
    responseMinutes: 15,
    about: "BMW Group-un Azərbaycandakı rəsmi servis mərkəzi. Zavod standartlarında texniki xidmət, orijinal ehtiyat hissələri, zəmanət xidməti.",
    services: ["Texniki xidmət", "Zəmanət təmiri", "Orijinal hissələr", "BMW Software yeniləmə"],
    certifications: ["BMW Group Certified"],
    phone: "+994125551234",
    whatsapp: "+994125551234"
  },
  {
    slug: "proauto-mexanik",
    name: "ProAuto — Mexanik & Usta",
    providerType: "mechanic",
    city: "Bakı",
    address: "Nizami r-nu, Əhməd Cavad küç. 12",
    rating: 4.6,
    reviewCount: 87,
    responseMinutes: 30,
    about: "Toyota, Hyundai, Kia, Honda ixtisaslaşmış mexanik. Motor, transmissiya, asma təmir. 10+ il təcrübə.",
    services: ["Motor təmiri", "Transmissiya", "Asma sistemi", "Sürün qutusu", "Yağ dəyişimi"],
    phone: "+994702223344",
    whatsapp: "+994702223344"
  },
  {
    slug: "elektro-auto",
    name: "ElektroAuto — Avto Elektrik",
    providerType: "auto_electrician",
    city: "Bakı",
    address: "Binəqədi şossesi 44",
    rating: 4.7,
    reviewCount: 56,
    responseMinutes: 25,
    about: "Hər növ avtomobilin elektrik sistemlərinin diaqnostika və təmiri. Siqnalizasiya quraşdırılması, ECU proqramlaşdırma.",
    services: ["Elektrik diaqnostika", "Siqnalizasiya", "Fara bərpası", "Akkumulyator", "Generator"],
    phone: "+994557776655",
    whatsapp: "+994557776655"
  },
  {
    slug: "kuzov-master",
    name: "KuzovMaster — Dəmirçi & Rəngləmə",
    providerType: "body_shop",
    city: "Sumqayıt",
    address: "Sumqayıt, 6-cı mikrorayon",
    rating: 4.5,
    reviewCount: 43,
    responseMinutes: 60,
    about: "Kuzov bərpa, dəmirçi işi, tam və lokal rəngləmə. Polimer örtük, rəng seçimi kataloqu. Sertifikatlı rəngçilər.",
    services: ["Dəmirçi işi", "Lokal rəngləmə", "Tam rəngləmə", "Polimer örtük", "Cilalama"],
    phone: "+994503332211",
    whatsapp: "+994503332211"
  },
  {
    slug: "evsmart-elektrik-avto",
    name: "EVSmart — EV & Hibrid Mütəxəssisi",
    providerType: "ev_hybrid",
    city: "Bakı",
    address: "Xətai r-nu, İnqilab küç. 22",
    rating: 4.9,
    reviewCount: 31,
    responseMinutes: 40,
    about: "Tesla, BYD, Toyota Hybrid, Hyundai IONIQ üzrə ixtisaslaşmış texniki mərkəz. Batareya diaqnostikası, şarj sistemi təmiri.",
    services: ["Batareya diaqnostika", "Şarj sistemi", "Hibrid təmiri", "CANBUS analiz", "Kalibrasiya"],
    certifications: ["Tesla Certified", "BYD Partner"],
    phone: "+994512223344",
    whatsapp: "+994512223344"
  }
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getServiceListingBySlug(_slug: string): ServiceListingRecord | null {
  return null;
}

export function getAllServiceProviderTypes(): ServiceProviderType[] {
  return Object.keys(SERVICE_PROVIDER_TYPE_LABELS) as ServiceProviderType[];
}
