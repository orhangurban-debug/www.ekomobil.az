// ─── Provider types ─────────────────────────────────────────────────────────

export type ServiceProviderType =
  // Official / branded
  | "official_service"
  | "inspection_company"
  // Routine maintenance
  | "oil_change"
  | "diagnostics"
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
  | "tire_wheel"
  // Appearance
  | "car_wash"
  | "detailing"
  | "tinting_wrap"
  // Roadside
  | "roadside_assistance";

export const SERVICE_PROVIDER_TYPE_LABELS: Record<ServiceProviderType, string> = {
  official_service: "Rəsmi servis mərkəzi",
  inspection_company: "Ekspertiza şirkəti",
  oil_change: "Yağ dəyişmə / texniki baxım",
  diagnostics: "Diaqnostika mərkəzi",
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
  tire_wheel: "Şin balansı / texeraltı",
  car_wash: "Avtomobil yuma",
  detailing: "Deteylinq / bərpa",
  tinting_wrap: "Tinting / vinyl örtük",
  roadside_assistance: "Yol kənarı yardım"
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
    id: "maintenance",
    label: "Baxım və diaqnostika",
    types: ["oil_change", "diagnostics"]
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
  },
  {
    id: "appearance",
    label: "Görünüş və baxım",
    types: ["car_wash", "detailing", "tinting_wrap"]
  },
  {
    id: "roadside",
    label: "Yol kənarı yardım",
    types: ["roadside_assistance"]
  }
];

// ─── Listing record ──────────────────────────────────────────────────────────

export interface ServiceListingRecord {
  id: string;
  slug: string;
  name: string;
  providerType: ServiceProviderType;
  city: string;
  address?: string;
  mapUrl?: string;
  branches?: import("@/lib/business-branches").BusinessProfileBranch[];
  rating: number;
  reviewCount: number;
  responseMinutes: number;
  about: string;
  services: string[];
  certifications?: string[];
  phone: string;
  whatsapp: string;
  imageUrls?: string[];
  status: string;
  ownerUserId?: string | null;
}

// Actual listing data is fetched from the database (`service_listings` table) via
// `@/server/service-listing-store`, populated by the approved partner onboarding pipeline
// (see `inspection-partner-application-form.tsx` → `/api/support/requests` → admin approval).

export function getAllServiceProviderTypes(): ServiceProviderType[] {
  return Object.keys(SERVICE_PROVIDER_TYPE_LABELS) as ServiceProviderType[];
}
