export type ListingStatus = "active" | "draft" | "sold" | "pending_review" | "rejected" | "archived" | "inactive";
export type SellerType = "private" | "dealer";
export type PlanType = "free" | "standard" | "vip";
export type PriceInsight = "below_market" | "market_rate" | "above_market";
export type MileageFlagSeverity = "info" | "warning" | "high_risk";
export type ListingKind = "vehicle" | "part";
export type PartCondition = "new" | "used" | "refurbished";
export type PartAuthenticity = "original" | "oem" | "aftermarket";

export interface ListingRecord {
  id: string;
  title: string;
  description: string;
  priceAzn: number;
  city: string;
  year: number;
  mileageKm: number;
  fuelType: string;
  transmission: string;
  make: string;
  model: string;
  vin: string;
  status: ListingStatus;
  sellerType: SellerType;
  ownerUserId?: string;
  dealerProfileId?: string;
  bodyType?: string;
  driveType?: string;
  color?: string;
  condition?: string;
  engineVolumeCc?: number;
  interiorMaterial?: string;
  hasSunroof?: boolean;
  /** Avtomobil və ya hissə elanı; auksion qapıları üçün */
  listingKind?: ListingKind;
  partCategory?: string;
  partSubcategory?: string;
  partBrand?: string;
  partCondition?: PartCondition;
  partAuthenticity?: PartAuthenticity;
  partOemCode?: string;
  partSku?: string;
  partQuantity?: number;
  partCompatibility?: string;
  planType?: PlanType;
  planExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListingTrustRecord {
  trustScore: number;
  vinVerified: boolean;
  sellerVerified: boolean;
  mediaComplete: boolean;
  mileageFlagSeverity?: MileageFlagSeverity;
  mileageFlagMessage?: string;
  serviceHistorySummary?: string;
  riskSummary?: string;
  lastVerifiedAt?: string;
}

export interface ListingMediaRecord {
  id: string;
  listingId: string;
  mediaType: "image" | "video";
  url: string;
  sortOrder: number;
}

export interface ListingSummary extends ListingRecord, ListingTrustRecord {
  imageUrl?: string;
  priceInsight?: PriceInsight;
}

export interface ListingDetail extends ListingSummary {
  serviceRecords: Array<{
    id: string;
    sourceType: string;
    serviceDate: string;
    mileageKm: number;
    summary: string;
  }>;
  relatedIds: string[];
}

export interface ListingQuery {
  city?: string;
  make?: string;
  model?: string;
  search?: string;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  driveType?: string;
  color?: string;
  condition?: string;
  minEngineVolumeCc?: number;
  maxEngineVolumeCc?: number;
  interiorMaterial?: string;
  hasSunroof?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  vinVerified?: boolean;
  sellerVerified?: boolean;
  sellerType?: "private" | "dealer";
  listingKind?: ListingKind;
  partCategory?: string;
  partSubcategory?: string;
  partBrand?: string;
  partCondition?: PartCondition;
  partAuthenticity?: PartAuthenticity;
  inStock?: boolean;
  compareIds?: string[];
  page?: number;
  pageSize?: number;
  sort?: "trust_desc" | "price_asc" | "price_desc" | "year_desc" | "mileage_asc" | "recent";
}

export interface ListingQueryResult {
  items: ListingSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LeadRecord {
  id: string;
  listingId: string;
  dealerProfileId?: string;
  buyerUserId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  note?: string;
  stage: "new" | "contacted" | "visit_booked" | "closed";
  source: string;
  responseTimeMinutes?: number;
  createdAt: string;
  updatedAt: string;
}
