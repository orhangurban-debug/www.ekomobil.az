import { MediaProtocolInput, validateMediaProtocol } from "@/lib/media-protocol";
import { MileageEvent, VehicleIdentity } from "@/lib/vehicle";

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

  if (!input.title.trim()) errors.push("Title is required.");
  if (input.priceAzn <= 0) errors.push("Price must be greater than 0.");
  if (!input.city.trim()) errors.push("City is required.");
  if (!input.vehicle.vin.trim()) errors.push("VIN is required.");
  if (input.vehicle.declaredMileageKm < 0) errors.push("Mileage cannot be negative.");
  if (input.vehicle.year < 1950 || input.vehicle.year > new Date().getFullYear() + 1) {
    errors.push("Vehicle year is out of allowed range.");
  }

  const mediaResult = validateMediaProtocol(input.mediaProtocol);
  errors.push(...mediaResult.missingRequirements);

  return {
    isValid: errors.length === 0,
    errors,
    mediaComplete: mediaResult.isComplete
  };
}
