import {
  MediaProtocolInput,
  validateMediaProtocol,
  validatePartListingMediaProtocol
} from "@/lib/media-protocol";
import { MileageEvent, VehicleIdentity } from "@/lib/vehicle";

export interface PartListingPublishInput {
  listingKind: "part";
  title: string;
  description?: string;
  priceAzn: number;
  city: string;
  partCategory?: string;
  partName?: string;
  sellerVerified: boolean;
  mediaProtocol: MediaProtocolInput;
}

export interface ListingInput {
  title: string;
  priceAzn: number;
  city: string;
  vehicle: VehicleIdentity;
  sellerVerified: boolean;
  vinVerified: boolean;
  latestMileageEvent?: MileageEvent;
  mediaProtocol: MediaProtocolInput;
}

export interface ListingValidationResult {
  isValid: boolean;
  errors: string[];
  mediaComplete: boolean;
}

export function validateListingInput(input: ListingInput): ListingValidationResult {
  const errors: string[] = [];
  const title = input?.title?.trim() ?? "";
  const city = input?.city?.trim() ?? "";
  const vin = input?.vehicle?.vin?.trim() ?? "";
  const declaredMileageKm = input?.vehicle?.declaredMileageKm;
  const year = input?.vehicle?.year;
  const priceAzn = input?.priceAzn;

  if (!title) errors.push("Title is required.");
  if (typeof priceAzn !== "number" || Number.isNaN(priceAzn) || priceAzn <= 0) {
    errors.push("Price must be greater than 0.");
  }
  if (!city) errors.push("City is required.");
  if (!vin) errors.push("VIN is required.");
  if (typeof declaredMileageKm !== "number" || Number.isNaN(declaredMileageKm)) {
    errors.push("Mileage is required.");
  } else if (declaredMileageKm < 0) {
    errors.push("Mileage cannot be negative.");
  }
  if (typeof year !== "number" || Number.isNaN(year) || year < 1950 || year > new Date().getFullYear() + 1) {
    errors.push("Vehicle year is out of allowed range.");
  }

  const mediaResult = validateMediaProtocol(
    input?.mediaProtocol ?? {
      imageCount: 0,
      engineVideoDurationSec: 0,
      hasFrontAngle: false,
      hasRearAngle: false,
      hasLeftSide: false,
      hasRightSide: false,
      hasDashboard: false,
      hasInterior: false,
      hasOdometer: false,
      hasTrunk: false
    }
  );
  errors.push(...mediaResult.missingRequirements);

  return {
    isValid: errors.length === 0,
    errors,
    mediaComplete: mediaResult.isComplete
  };
}

export function validatePartListingInput(input: PartListingPublishInput): ListingValidationResult {
  const errors: string[] = [];
  const title = input?.title?.trim() ?? "";
  const city = input?.city?.trim() ?? "";
  const priceAzn = input?.priceAzn;

  if (!title) errors.push("Başlıq tələb olunur.");
  if (typeof priceAzn !== "number" || Number.isNaN(priceAzn) || priceAzn <= 0) {
    errors.push("Qiymət 0-dan böyük olmalıdır.");
  }
  if (!city) errors.push("Şəhər tələb olunur.");

  const mediaResult = validatePartListingMediaProtocol(
    input?.mediaProtocol ?? {
      imageCount: 0,
      engineVideoDurationSec: 0,
      hasFrontAngle: false,
      hasRearAngle: false,
      hasLeftSide: false,
      hasRightSide: false,
      hasDashboard: false,
      hasInterior: false,
      hasOdometer: false,
      hasTrunk: false
    }
  );
  errors.push(...mediaResult.missingRequirements);

  return {
    isValid: errors.length === 0,
    errors,
    mediaComplete: mediaResult.isComplete
  };
}
