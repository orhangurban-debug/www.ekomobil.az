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

export interface DealerSalonProfileSnapshot {
  dealerName: string;
  city: string;
  contactPhone: string | null;
  whatsappPhone: string | null;
  showWhatsapp: boolean;
}

export interface DealerPublishContext {
  salonAccessEnabled: boolean;
  plan: DealerPublishPlanSnapshot | null;
  activeVehicleListings: number;
  subscriptionExpiresAt: string | null;
  isTrial: boolean;
  profile: DealerSalonProfileSnapshot | null;
}
