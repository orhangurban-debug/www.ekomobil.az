import { getServerSessionUser } from "@/lib/auth";
import type { DealerPublishContext, DealerPublishPlanSnapshot, DealerSalonProfileSnapshot } from "@/lib/dealer-publish-types";
import {
  getBusinessAccountSnapshot,
  getDealerSubscriptionExpiry,
  getEffectiveDealerPlan,
  hasActiveBusinessSubscription
} from "@/server/business-plan-store";
import { getDealerProfileSettingsForOwner } from "@/server/dealer-store";
import { countDealerListingsForUserByKind } from "@/server/listing-store";
import { getUserProfile } from "@/server/user-store";

export type { DealerPublishContext, DealerPublishPlanSnapshot, DealerSalonProfileSnapshot } from "@/lib/dealer-publish-types";

const EMPTY_CONTEXT: DealerPublishContext = {
  salonAccessEnabled: false,
  plan: null,
  activeVehicleListings: 0,
  subscriptionExpiresAt: null,
  isTrial: false,
  profile: null
};

export async function getDealerPublishContext(): Promise<DealerPublishContext> {
  const user = await getServerSessionUser();
  if (!user) return EMPTY_CONTEXT;

  const hasSubscription = await hasActiveBusinessSubscription(user.id, "dealer");
  const salonAccessEnabled =
    user.role === "admin" || (user.role === "dealer" && hasSubscription);
  if (!salonAccessEnabled) return EMPTY_CONTEXT;

  const [plan, activeVehicleListings, expiresAt, snapshot, profileSettings, userProfile] = await Promise.all([
    getEffectiveDealerPlan(user.id),
    countDealerListingsForUserByKind(user.id, "vehicle"),
    getDealerSubscriptionExpiry(user.id),
    getBusinessAccountSnapshot(user.id, user.role),
    getDealerProfileSettingsForOwner(user.id),
    getUserProfile(user.id)
  ]);

  const profile: DealerSalonProfileSnapshot | null = profileSettings
    ? {
        dealerName: profileSettings.name,
        city: profileSettings.city,
        contactPhone: userProfile?.phone?.trim() || null,
        whatsappPhone: profileSettings.showWhatsapp ? profileSettings.whatsappPhone?.trim() || null : null,
        showWhatsapp: profileSettings.showWhatsapp
      }
    : null;

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
    isTrial: snapshot.salonIsTrial ?? false,
    profile
  };
}
