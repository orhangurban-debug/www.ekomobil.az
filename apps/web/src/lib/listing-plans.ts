/**
 * EkoMobil elan qiymət planları
 * Referans: Turbo.az (30 gün pulsuz), mobile.de (Basis/Standard/Premium)
 */

export type PlanType = "free" | "standard" | "vip";

export interface ListingPlan {
  id: PlanType;
  name: string;
  nameAz: string;
  priceAzn: number;
  durationDays: number;
  priorityMultiplier: number;
  isHighlighted: boolean;
  featuredInHome: boolean;
}

export const LISTING_PLANS: ListingPlan[] = [
  {
    id: "free",
    name: "Free",
    nameAz: "Pulsuz",
    priceAzn: 0,
    durationDays: 30,
    priorityMultiplier: 1,
    isHighlighted: false,
    featuredInHome: false
  },
  {
    id: "standard",
    name: "Standard",
    nameAz: "Standart",
    priceAzn: 9,
    durationDays: 30,
    priorityMultiplier: 1.5,
    isHighlighted: true,
    featuredInHome: false
  },
  {
    id: "vip",
    name: "VIP",
    nameAz: "VIP",
    priceAzn: 19,
    durationDays: 30,
    priorityMultiplier: 3,
    isHighlighted: true,
    featuredInHome: true
  }
];

export function getPlanById(id: PlanType): ListingPlan | undefined {
  return LISTING_PLANS.find((p) => p.id === id);
}

export function isPaidPlan(planType: PlanType): boolean {
  return planType !== "free";
}

export function calculatePlanExpiry(planType: PlanType): Date {
  const plan = getPlanById(planType);
  const days = plan?.durationDays ?? 30;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
