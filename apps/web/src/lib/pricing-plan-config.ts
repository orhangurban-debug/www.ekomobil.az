import type { DealerPlanId } from "@/lib/dealer-plans";
import type { PartsStorePlanId } from "@/lib/parts-store-plans";

export interface PricingCostModel {
  storageCostPerImageAzn: number;
  egressCostPerImageViewAzn: number;
  avgDealerImageViewsPerListingPerMonth: number;
  avgPartsImageViewsPerListingPerMonth: number;
  moderationCostPerListingAzn: number;
  supportCostPerListingAzn: number;
  paymentOpsCostPerOrderAzn: number;
  riskBufferPct: number;
  targetCogsRatioPct: number;
}

export const DEFAULT_PRICING_COST_MODEL: PricingCostModel = {
  storageCostPerImageAzn: 0.0025,
  egressCostPerImageViewAzn: 0.0009,
  avgDealerImageViewsPerListingPerMonth: 420,
  avgPartsImageViewsPerListingPerMonth: 260,
  moderationCostPerListingAzn: 0.35,
  supportCostPerListingAzn: 0.22,
  paymentOpsCostPerOrderAzn: 0.18,
  riskBufferPct: 18,
  targetCogsRatioPct: 55
};

export interface DealerPlanOverride {
  nameAz?: string;
  priceAzn?: number;
  maxActiveListings?: number;
  perListingMaxImages?: number;
  maxVideosPerListing?: number;
  csvImportEnabled?: boolean;
  analyticsEnabled?: boolean;
  leadInboxLimit?: number | null;
  gracePeriodDays?: number;
  features?: string[];
}

export interface PartsStorePlanOverride {
  nameAz?: string;
  priceAzn?: number;
  maxActiveListings?: number;
  perListingMaxImages?: number;
  analyticsEnabled?: boolean;
  gracePeriodDays?: number;
  features?: string[];
}

export interface ServicePlanOverride {
  nameAz?: string;
  priceAzn?: number;
  billingAz?: string;
  descriptionAz?: string;
  launchOfferAz?: string;
  ctaLabel?: string;
  features?: string[];
}

export interface PricingPlanAdminConfig {
  dealer: Partial<Record<DealerPlanId, DealerPlanOverride>>;
  parts: Partial<Record<PartsStorePlanId, PartsStorePlanOverride>>;
  service: Record<string, ServicePlanOverride>;
  economics: PricingCostModel;
}

export const DEFAULT_PRICING_PLAN_ADMIN_CONFIG: PricingPlanAdminConfig = {
  dealer: {},
  parts: {},
  service: {},
  economics: { ...DEFAULT_PRICING_COST_MODEL }
};

function sanitizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const clean = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  return clean.length > 0 ? clean : [];
}

export function parsePricingPlanAdminConfig(rawConfig: unknown, rawEconomics: unknown): PricingPlanAdminConfig {
  const cfg = (rawConfig && typeof rawConfig === "object" ? rawConfig : {}) as Record<string, unknown>;
  const econ = (rawEconomics && typeof rawEconomics === "object" ? rawEconomics : {}) as Record<string, unknown>;
  const dealerRaw = (cfg.dealer && typeof cfg.dealer === "object" ? cfg.dealer : {}) as Record<string, unknown>;
  const partsRaw = (cfg.parts && typeof cfg.parts === "object" ? cfg.parts : {}) as Record<string, unknown>;
  const serviceRaw = (cfg.service && typeof cfg.service === "object" ? cfg.service : {}) as Record<string, unknown>;

  const dealer: PricingPlanAdminConfig["dealer"] = {};
  for (const [planId, value] of Object.entries(dealerRaw)) {
    if (!value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    dealer[planId as DealerPlanId] = {
      nameAz: typeof row.nameAz === "string" ? row.nameAz.trim() : undefined,
      priceAzn: typeof row.priceAzn === "number" ? Math.max(0, Math.round(row.priceAzn)) : undefined,
      maxActiveListings: typeof row.maxActiveListings === "number" ? Math.max(1, Math.round(row.maxActiveListings)) : undefined,
      perListingMaxImages: typeof row.perListingMaxImages === "number" ? Math.max(1, Math.round(row.perListingMaxImages)) : undefined,
      maxVideosPerListing: typeof row.maxVideosPerListing === "number" ? Math.max(0, Math.round(row.maxVideosPerListing)) : undefined,
      csvImportEnabled: typeof row.csvImportEnabled === "boolean" ? row.csvImportEnabled : undefined,
      analyticsEnabled: typeof row.analyticsEnabled === "boolean" ? row.analyticsEnabled : undefined,
      leadInboxLimit:
        typeof row.leadInboxLimit === "number"
          ? Math.max(1, Math.round(row.leadInboxLimit))
          : row.leadInboxLimit === null
            ? null
            : undefined,
      gracePeriodDays: typeof row.gracePeriodDays === "number" ? Math.max(1, Math.round(row.gracePeriodDays)) : undefined,
      features: sanitizeStringArray(row.features)
    };
  }

  const parts: PricingPlanAdminConfig["parts"] = {};
  for (const [planId, value] of Object.entries(partsRaw)) {
    if (!value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    parts[planId as PartsStorePlanId] = {
      nameAz: typeof row.nameAz === "string" ? row.nameAz.trim() : undefined,
      priceAzn: typeof row.priceAzn === "number" ? Math.max(0, Math.round(row.priceAzn)) : undefined,
      maxActiveListings: typeof row.maxActiveListings === "number" ? Math.max(1, Math.round(row.maxActiveListings)) : undefined,
      perListingMaxImages: typeof row.perListingMaxImages === "number" ? Math.max(1, Math.round(row.perListingMaxImages)) : undefined,
      analyticsEnabled: typeof row.analyticsEnabled === "boolean" ? row.analyticsEnabled : undefined,
      gracePeriodDays: typeof row.gracePeriodDays === "number" ? Math.max(1, Math.round(row.gracePeriodDays)) : undefined,
      features: sanitizeStringArray(row.features)
    };
  }

  const service: PricingPlanAdminConfig["service"] = {};
  for (const [planId, value] of Object.entries(serviceRaw)) {
    if (!value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    service[planId] = {
      nameAz: typeof row.nameAz === "string" ? row.nameAz.trim() : undefined,
      billingAz: typeof row.billingAz === "string" ? row.billingAz.trim() : undefined,
      descriptionAz: typeof row.descriptionAz === "string" ? row.descriptionAz.trim() : undefined,
      launchOfferAz: typeof row.launchOfferAz === "string" ? row.launchOfferAz.trim() : undefined,
      ctaLabel: typeof row.ctaLabel === "string" ? row.ctaLabel.trim() : undefined,
      priceAzn: typeof row.priceAzn === "number" ? Math.max(0, Math.round(row.priceAzn)) : undefined,
      features: sanitizeStringArray(row.features)
    };
  }

  const economics: PricingCostModel = {
    storageCostPerImageAzn: typeof econ.storageCostPerImageAzn === "number" ? Math.max(0, econ.storageCostPerImageAzn) : DEFAULT_PRICING_COST_MODEL.storageCostPerImageAzn,
    egressCostPerImageViewAzn:
      typeof econ.egressCostPerImageViewAzn === "number" ? Math.max(0, econ.egressCostPerImageViewAzn) : DEFAULT_PRICING_COST_MODEL.egressCostPerImageViewAzn,
    avgDealerImageViewsPerListingPerMonth:
      typeof econ.avgDealerImageViewsPerListingPerMonth === "number"
        ? Math.max(1, econ.avgDealerImageViewsPerListingPerMonth)
        : DEFAULT_PRICING_COST_MODEL.avgDealerImageViewsPerListingPerMonth,
    avgPartsImageViewsPerListingPerMonth:
      typeof econ.avgPartsImageViewsPerListingPerMonth === "number"
        ? Math.max(1, econ.avgPartsImageViewsPerListingPerMonth)
        : DEFAULT_PRICING_COST_MODEL.avgPartsImageViewsPerListingPerMonth,
    moderationCostPerListingAzn:
      typeof econ.moderationCostPerListingAzn === "number" ? Math.max(0, econ.moderationCostPerListingAzn) : DEFAULT_PRICING_COST_MODEL.moderationCostPerListingAzn,
    supportCostPerListingAzn:
      typeof econ.supportCostPerListingAzn === "number" ? Math.max(0, econ.supportCostPerListingAzn) : DEFAULT_PRICING_COST_MODEL.supportCostPerListingAzn,
    paymentOpsCostPerOrderAzn:
      typeof econ.paymentOpsCostPerOrderAzn === "number" ? Math.max(0, econ.paymentOpsCostPerOrderAzn) : DEFAULT_PRICING_COST_MODEL.paymentOpsCostPerOrderAzn,
    riskBufferPct: typeof econ.riskBufferPct === "number" ? Math.max(0, econ.riskBufferPct) : DEFAULT_PRICING_COST_MODEL.riskBufferPct,
    targetCogsRatioPct: typeof econ.targetCogsRatioPct === "number" ? Math.max(5, Math.min(95, econ.targetCogsRatioPct)) : DEFAULT_PRICING_COST_MODEL.targetCogsRatioPct
  };

  return { dealer, parts, service, economics };
}

export function calculateRecommendedActiveLimit(input: {
  priceAzn: number;
  maxImagesPerListing: number;
  segment: "dealer" | "parts";
  model: PricingCostModel;
}): number {
  const listingViews =
    input.segment === "dealer" ? input.model.avgDealerImageViewsPerListingPerMonth : input.model.avgPartsImageViewsPerListingPerMonth;
  const storageCost = input.maxImagesPerListing * input.model.storageCostPerImageAzn;
  const egressCost = input.maxImagesPerListing * listingViews * input.model.egressCostPerImageViewAzn;
  const variableCost = storageCost + egressCost + input.model.moderationCostPerListingAzn + input.model.supportCostPerListingAzn;
  const bufferedUnitCost = variableCost * (1 + input.model.riskBufferPct / 100);
  if (bufferedUnitCost <= 0) return 1;
  const budgetForCogs = Math.max(0, input.priceAzn - input.model.paymentOpsCostPerOrderAzn) * (input.model.targetCogsRatioPct / 100);
  return Math.max(1, Math.floor(budgetForCogs / bufferedUnitCost));
}
