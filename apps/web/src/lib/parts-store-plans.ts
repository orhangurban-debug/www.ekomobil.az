export type PartsStorePlanId = "starter" | "growth" | "network";

export interface PartsStorePlan {
  id: PartsStorePlanId;
  nameAz: string;
  priceAzn: number;
  billingCycle: "monthly";
  maxPartsListings: number | null;
  features: string[];
  highlight?: boolean;
}

export const PARTS_STORE_PLANS: PartsStorePlan[] = [
  {
    id: "starter",
    nameAz: "Mağaza Start",
    priceAzn: 0,
    billingCycle: "monthly",
    maxPartsListings: 30,
    features: [
      "Aylıq 30 aktiv hissə elanı",
      "Mağaza profili",
      "Standart hissə axtarış görünüşü"
    ]
  },
  {
    id: "growth",
    nameAz: "Mağaza Pro",
    priceAzn: 24,
    billingCycle: "monthly",
    maxPartsListings: 200,
    highlight: true,
    features: [
      "Aylıq 200 aktiv hissə elanı",
      "Toplu hissə əlavə etmə (CSV)",
      "Sifariş sorğuları üçün lead qutusu",
      "Hissə elanları üçün prioritet görünüş"
    ]
  },
  {
    id: "network",
    nameAz: "Mağaza Network",
    priceAzn: 59,
    billingCycle: "monthly",
    maxPartsListings: null,
    features: [
      "Limitsiz aktiv hissə elanı",
      "Filiallar üzrə vahid idarəetmə",
      "Qabaqcıl hissə analitikası",
      "Prioritet dəstək və hesab meneceri"
    ]
  }
];
