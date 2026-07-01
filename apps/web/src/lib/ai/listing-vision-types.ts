export type ListingKindForAi = "vehicle" | "part";

export interface AiFieldConfidence {
  value: unknown;
  confidence: number;
}

export interface VehicleAiSuggestion {
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  bodyType?: string;
  fuelType?: string;
  engineType?: string;
  transmission?: string;
  driveType?: string;
  vehicleCondition?: string;
  declaredMileageKm?: number;
  vin?: string;
  description?: string;
  priceAzn?: number;
  mediaAngles?: {
    hasFrontAngle?: boolean;
    hasRearAngle?: boolean;
    hasLeftSide?: boolean;
    hasRightSide?: boolean;
    hasDashboard?: boolean;
    hasInterior?: boolean;
    hasOdometer?: boolean;
    hasTrunk?: boolean;
  };
  fieldConfidence?: Record<string, number>;
  notes?: string;
}

export interface PartAiSuggestion {
  title?: string;
  partName?: string;
  partCategory?: string;
  partSubcategory?: string;
  partBrand?: string;
  partCondition?: "new" | "used" | "refurbished";
  partAuthenticity?: "original" | "oem" | "aftermarket";
  partOemCode?: string;
  partSku?: string;
  partCompatibility?: string;
  description?: string;
  priceAzn?: number;
  partQuantity?: number;
  fieldConfidence?: Record<string, number>;
  notes?: string;
}

export interface PartBulkProductSuggestion extends PartAiSuggestion {
  imageIndices: number[];
  suggestedTitle?: string;
}

export interface ListingAiAnalyzeResult {
  listingKind: ListingKindForAi;
  vehicle?: VehicleAiSuggestion;
  part?: PartAiSuggestion;
  bulkProducts?: PartBulkProductSuggestion[];
  analyzedImageCount: number;
  optional?: boolean;
  disclaimer: string;
}
