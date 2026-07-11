import { getServerSessionUser } from "@/lib/auth";
import type { DealerPublishContext, DealerPublishPlanSnapshot } from "@/lib/dealer-publish-types";
import {
  getBusinessAccountSnapshot,
  getDealerSubscriptionExpiry,
  getEffectiveDealerPlan,
  hasActiveBusinessSubscription
} from "@/server/business-plan-store";
import { countDealerListingsForUserByKind } from "@/server/listing-store";

export type { DealerPublishContext, DealerPublishPlanSnapshot } from "@/lib/dealer-publish-types";

const EMPTY_CONTEXT: DealerPublishContext = {
  salonAccessEnabled: false,
  plan: null,
  activeVehicleListings: 0,
  subscriptionExpiresAt: null,
  isTrial: false
};

export async function getDealerPublishContext(): Promise<DealerPublishContext> {
  const user = await getServerSessionUser();
  if (!user) return EMPTY_CONTEXT;

  const hasSubscription = await hasActiveBusinessSubscription(user.id, "dealer");
  const salonAccessEnabled =
    user.role === "admin" || (user.role === "dealer" && hasSubscription);
  if (!salonAccessEnabled) return EMPTY_CONTEXT;

  const [plan, activeVehicleListings, expiresAt, snapshot] = await Promise.all([
    getEffectiveDealerPlan(user.id),
    countDealerListingsForUserByKind(user.id, "vehicle"),
    getDealerSubscriptionExpiry(user.id),
    getBusinessAccountSnapshot(user.id, user.role)
  ]);

  return {
    salonAccessEnabled: true,
    plan: {
      id: plan.id,
      nameAz: plan.nameAz,
      priceAzn: plan.priceAzn,
      maxActiveListings: plan.maxActiveListings,
      perListingMaxImages: plan.perListingMaxImages,
      videoEnabled: plan.videoEnabled,
      maxVideosPerListing: plan.maxVideosPerListing,
      listingRefreshDays: plan.listingRefreshDays
    },
    activeVehicleListings,
    subscriptionExpiresAt: expiresAt?.toISOString() ?? snapshot.salonSubscriptionExpiresAt ?? null,
    isTrial: snapshot.salonIsTrial ?? false
  };
}
