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
// No hard-coded demo records are kept here.

export const demoServiceListings: ServiceListingRecord[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getServiceListingBySlug(_slug: string): ServiceListingRecord | null {
  return null;
}

export function getAllServiceProviderTypes(): ServiceProviderType[] {
  return Object.keys(SERVICE_PROVIDER_TYPE_LABELS) as ServiceProviderType[];
}
