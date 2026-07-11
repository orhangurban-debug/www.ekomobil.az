import type { PartsStorePlanId } from "@/lib/parts-store-plans";

export interface StorePublishPlanSnapshot {
  id: PartsStorePlanId;
  nameAz: string;
  priceAzn: number;
  maxActiveListings: number;
  perListingMaxImages: number;
  analyticsEnabled: boolean;
}

export interface StorePublishProfileSnapshot {
  storeName: string;
  city: string;
  contactPhone: string | null;
  whatsappPhone: string | null;
  showWhatsapp: boolean;
}

export interface StorePublishContext {
  storeAccessEnabled: boolean;
  plan: StorePublishPlanSnapshot | null;
  activePartListings: number;
  subscriptionExpiresAt: string | null;
  isTrial: boolean;
  profile: StorePublishProfileSnapshot | null;
}
