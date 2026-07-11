import { getServerSessionUser } from "@/lib/auth";
import type {
  StorePublishContext,
  StorePublishPlanSnapshot,
  StorePublishProfileSnapshot
} from "@/lib/store-publish-types";
import {
  getBusinessAccountSnapshot,
  getEffectivePartsPlan,
  getPartsStoreSubscriptionExpiry,
  hasActiveBusinessSubscription
} from "@/server/business-plan-store";
import { countDealerListingsForUserByKind } from "@/server/listing-store";
import { getUserProfile } from "@/server/user-store";

export type { StorePublishContext, StorePublishPlanSnapshot, StorePublishProfileSnapshot } from "@/lib/store-publish-types";

const EMPTY_CONTEXT: StorePublishContext = {
  storeAccessEnabled: false,
  plan: null,
  activePartListings: 0,
  subscriptionExpiresAt: null,
  isTrial: false,
  profile: null
};

export async function getStorePublishContext(): Promise<StorePublishContext> {
  const user = await getServerSessionUser();
  if (!user) return EMPTY_CONTEXT;

  const hasSubscription = await hasActiveBusinessSubscription(user.id, "parts_store");
  const storeAccessEnabled = user.role === "admin" || hasSubscription;
  if (!storeAccessEnabled) return EMPTY_CONTEXT;

  const [plan, activePartListings, expiresAt, snapshot, userProfile] = await Promise.all([
    getEffectivePartsPlan(user.id),
    countDealerListingsForUserByKind(user.id, "part"),
    getPartsStoreSubscriptionExpiry(user.id),
    getBusinessAccountSnapshot(user.id, user.role),
    getUserProfile(user.id)
  ]);

  const profile: StorePublishProfileSnapshot = {
    storeName: userProfile?.storeName?.trim() || "Mağazam",
    city: userProfile?.city?.trim() || "Bakı",
    contactPhone: userProfile?.phone?.trim() || null,
    whatsappPhone:
      userProfile?.showStoreWhatsapp && userProfile?.storeWhatsappPhone?.trim()
        ? userProfile.storeWhatsappPhone.trim()
        : null,
    showWhatsapp: userProfile?.showStoreWhatsapp ?? false
  };

  return {
    storeAccessEnabled: true,
    plan: {
      id: plan.id,
      nameAz: plan.nameAz,
      priceAzn: plan.priceAzn,
      maxActiveListings: plan.maxActiveListings,
      perListingMaxImages: plan.perListingMaxImages,
      analyticsEnabled: plan.analyticsEnabled
    },
    activePartListings,
    subscriptionExpiresAt: expiresAt?.toISOString() ?? snapshot.magazaSubscriptionExpiresAt ?? null,
    isTrial: snapshot.magazaIsTrial ?? false,
    profile
  };
}
