import type { PlanType } from "@/lib/listing-plans";
import { getPlanById, LISTING_PLANS } from "@/lib/listing-plans";
import type { DealerPlan } from "@/lib/dealer-plans";
import type { PartsStorePlan } from "@/lib/parts-store-plans";
import { getEffectiveDealerPlan, getEffectivePartsPlan } from "@/server/business-plan-store";
import { checkListingAiLimit, incrementListingAiUsage } from "@/lib/ai/analysis-limits";
import { getServicePartnerPlanLimits } from "@/lib/ai/service-plan-limits";

export type AiAnalysisContext = "vehicle" | "part" | "part_bulk" | "service";

export interface ListingAiQuota {
  context: AiAnalysisContext;
  dailyLimit: number;
  remaining: number;
  allowed: boolean;
  identifier: string;
  maxImages: number;
  maxBulkImages: number;
  planLabel: string;
  singleListingOnly: boolean;
  requiresAuth: boolean;
}

interface ResolveQuotaInput {
  userId: string | null;
  userRole?: string | null;
  ip: string;
  context: AiAnalysisContext;
  planType?: PlanType;
  servicePlanGroup?: "official" | "inspection" | "mechanic";
  servicePlanId?: string;
}

function privateVehicleLimits(planType: PlanType = "free") {
  const plan = getPlanById(planType) ?? LISTING_PLANS[0];
  const dailyLimit = planType === "vip" ? 10 : planType === "standard" ? 8 : 5;
  return {
    dailyLimit,
    maxImages: plan.maxImages,
    maxBulkImages: 0,
    planLabel: `${plan.nameAz} elan planı`,
    singleListingOnly: true
  };
}

function dealerVehicleLimits(plan: DealerPlan) {
  const dailyLimit = Math.min(40, Math.max(8, Math.ceil(plan.maxActiveListings / 4)));
  return {
    dailyLimit,
    maxImages: plan.perListingMaxImages,
    maxBulkImages: 0,
    planLabel: `Salon · ${plan.nameAz}`,
    singleListingOnly: true
  };
}

function partsBusinessLimits(plan: PartsStorePlan) {
  const dailyLimit = Math.min(30, Math.max(6, Math.ceil(plan.maxActiveListings / 25)));
  const maxBulkImages = Math.min(50, Math.max(10, Math.ceil(plan.maxActiveListings / 15)));
  return {
    dailyLimit,
    maxImages: plan.perListingMaxImages,
    maxBulkImages,
    planLabel: `Mağaza · ${plan.nameAz}`,
    singleListingOnly: false
  };
}

function privatePartsLimits() {
  return {
    dailyLimit: 5,
    maxImages: 8,
    maxBulkImages: 15,
    planLabel: "Fərdi hissə elanı",
    singleListingOnly: false
  };
}

function serviceLimits(group: "official" | "inspection" | "mechanic", planId?: string) {
  const plan = getServicePartnerPlanLimits(group, planId);
  return {
    dailyLimit: plan.dailyAiLimit,
    maxImages: plan.imageLimit,
    maxBulkImages: 0,
    planLabel: plan.label,
    singleListingOnly: true
  };
}


export async function resolveListingAiQuota(input: ResolveQuotaInput): Promise<ListingAiQuota> {
  let limits: {
    dailyLimit: number;
    maxImages: number;
    maxBulkImages: number;
    planLabel: string;
    singleListingOnly: boolean;
  };
  let requiresAuth = false;

  if (!input.userId) {
    requiresAuth = true;
    const fallback =
      input.context === "vehicle"
        ? privateVehicleLimits(input.planType ?? "free")
        : input.context === "service"
          ? serviceLimits(input.servicePlanGroup ?? "mechanic", input.servicePlanId)
          : privatePartsLimits();
    limits = { ...fallback, dailyLimit: 0 };
  } else if (input.context === "service") {
    const group = input.servicePlanGroup ?? "mechanic";
    limits = serviceLimits(group, input.servicePlanId);
  } else if (input.context === "vehicle") {
    const isDealer = input.userRole === "dealer" || input.userRole === "admin";
    if (isDealer) {
      const plan = await getEffectiveDealerPlan(input.userId);
      limits = dealerVehicleLimits(plan);
    } else {
      limits = privateVehicleLimits(input.planType ?? "free");
    }
  } else if (input.context === "part" || input.context === "part_bulk") {
    const isDealer = input.userRole === "dealer" || input.userRole === "admin";
    if (isDealer) {
      const plan = await getEffectivePartsPlan(input.userId);
      limits = partsBusinessLimits(plan);
    } else {
      limits = privatePartsLimits();
    }
  } else {
    limits = privateVehicleLimits(input.planType ?? "free");
  }

  if (requiresAuth) {
    return {
      context: input.context,
      dailyLimit: 0,
      remaining: 0,
      allowed: false,
      identifier: `listing-ai:ip:${input.ip}`,
      maxImages: limits.maxImages,
      maxBulkImages: limits.maxBulkImages,
      planLabel: limits.planLabel,
      singleListingOnly: limits.singleListingOnly,
      requiresAuth: true
    };
  }

  const usage = await checkListingAiLimit(input.userId, input.ip, limits.dailyLimit);
  return {
    context: input.context,
    dailyLimit: limits.dailyLimit,
    remaining: usage.remaining,
    allowed: usage.allowed,
    identifier: usage.identifier,
    maxImages: limits.maxImages,
    maxBulkImages: limits.maxBulkImages,
    planLabel: limits.planLabel,
    singleListingOnly: limits.singleListingOnly,
    requiresAuth: false
  };
}

export { incrementListingAiUsage };

export function maxImagesForRequest(quota: ListingAiQuota, bulkMode?: boolean): number {
  if (bulkMode) return quota.maxBulkImages || quota.maxImages;
  return quota.maxImages;
}
