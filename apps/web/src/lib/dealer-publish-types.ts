import type { DealerPlanId } from "@/lib/dealer-plans";

export interface DealerPublishPlanSnapshot {
  id: DealerPlanId;
  nameAz: string;
  priceAzn: number;
  maxActiveListings: number;
  perListingMaxImages: number;
  videoEnabled: boolean;
  maxVideosPerListing: number;
  listingRefreshDays: number;
}

export interface DealerPublishContext {
  salonAccessEnabled: boolean;
  plan: DealerPublishPlanSnapshot | null;
  activeVehicleListings: number;
  subscriptionExpiresAt: string | null;
  isTrial: boolean;
}
