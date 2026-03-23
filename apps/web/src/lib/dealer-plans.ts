export type DealerPlanId = "starter" | "pro" | "enterprise";

export interface DealerPlan {
  id: DealerPlanId;
  nameAz: string;
  priceAzn: number;
  billingCycle: "monthly";
  maxListings: number | null;
  features: string[];
  highlight?: boolean;
}

export const DEALER_PLANS: DealerPlan[] = [
  {
    id: "starter",
    nameAz: "Başlanğıc",
    priceAzn: 0,
    billingCycle: "monthly",
    maxListings: 10,
    features: [
      "Aylıq 10 aktiv elan",
      "Lead qutusu (məhdud)",
      "Standart axtarış görünüşü",
      "CSV import yoxdur"
    ]
  },
  {
    id: "pro",
    nameAz: "Pro",
    priceAzn: 29,
    billingCycle: "monthly",
    maxListings: 50,
    highlight: true,
    features: [
      "Aylıq 50 aktiv elan",
      "Tam lead CRM qutusu",
      "Baxış & lead statistikası",
      "CSV toplu import",
      "VIN yoxlama — 5 kredit/ay",
      "Salon 'Doğrulanmış diler' badge"
    ]
  },
  {
    id: "enterprise",
    nameAz: "Enterprise",
    priceAzn: 79,
    billingCycle: "monthly",
    maxListings: null,
    features: [
      "Limitsiz aktiv elan",
      "Tam lead CRM + SLA izləmə",
      "Qabaqcıl analytics & export",
      "CSV toplu import",
      "VIN yoxlama — 20 kredit/ay",
      "Auksion lot yerləşdirmə hüququ",
      "Prioritet müştəri dəstəyi"
    ]
  }
];
