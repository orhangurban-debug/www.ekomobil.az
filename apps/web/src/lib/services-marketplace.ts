export type ServiceProviderType =
  | "inspection_company"
  | "official_service"
  | "auto_electrician"
  | "body_shop"
  | "mechanic";

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

export const SERVICE_PROVIDER_TYPE_LABELS: Record<ServiceProviderType, string> = {
  inspection_company: "Ekspertiza şirkəti",
  official_service: "Rəsmi servis",
  auto_electrician: "Avto elektrik",
  body_shop: "Dəmirçi / kuzov",
  mechanic: "Usta / mexanik"
};

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
  }
];

export function getServiceListingBySlug(slug: string): ServiceListingRecord | null {
  return demoServiceListings.find((item) => item.slug === slug) ?? null;
}
