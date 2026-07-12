import {
  VEHICLE_MEDIA_PROTOCOL_MIN_IMAGES,
  VEHICLE_MEDIA_RECOMMENDED_PROTOCOL_ANGLES
} from "@/lib/vehicle-media-constants";

export interface MediaProtocolInput {
  imageCount: number;
  engineVideoDurationSec: number;
  hasFrontAngle: boolean;
  hasRearAngle: boolean;
  hasLeftSide: boolean;
  hasRightSide: boolean;
  hasDashboard: boolean;
  hasInterior: boolean;
  hasOdometer: boolean;
  hasTrunk: boolean;
}

export interface MediaProtocolResult {
  /** Publish gate — yalnız zəruri şərtlər */
  isComplete: boolean;
  missingRequirements: string[];
  /** Trust / auksion keyfiyyəti — tövsiyə olunan rakurslar */
  isRecommendedComplete: boolean;
  missingRecommendations: string[];
  recommendedCompletedCount: number;
  recommendedTotalCount: number;
}

interface ValidateMediaProtocolOptions {
  minimumImageCount?: number;
  requireVideo?: boolean;
}

const RECOMMENDATION_CHECKS: Array<{
  key: keyof MediaProtocolInput;
  message: string;
}> = [
  { key: "hasFrontAngle", message: "Ön tərəf (tövsiyə)" },
  { key: "hasRearAngle", message: "Arxa tərəf (tövsiyə)" },
  { key: "hasLeftSide", message: "Sol profil (tövsiyə)" },
  { key: "hasRightSide", message: "Sağ profil (tövsiyə)" },
  { key: "hasDashboard", message: "Sükan paneli (tövsiyə)" },
  { key: "hasInterior", message: "Salon (tövsiyə)" },
  { key: "hasOdometer", message: "Yürüş sayğacı (tövsiyə)" },
  { key: "hasTrunk", message: "Baqaj (tövsiyə)" }
];

export function validateMediaProtocol(
  input: MediaProtocolInput,
  options?: ValidateMediaProtocolOptions
): MediaProtocolResult {
  const missingRequirements: string[] = [];
  const minimumImageCount = options?.minimumImageCount ?? VEHICLE_MEDIA_PROTOCOL_MIN_IMAGES;
  const requireVideo = options?.requireVideo ?? false;

  if (input.imageCount < minimumImageCount) {
    missingRequirements.push(`Ən azı ${minimumImageCount} şəkil əlavə edin.`);
  }

  if (
    requireVideo &&
    (input.engineVideoDurationSec < 15 || input.engineVideoDurationSec > 30)
  ) {
    missingRequirements.push("Mühərrik videosu 15-30 saniyə aralığında olmalıdır.");
  }

  const missingRecommendations: string[] = [];
  for (const item of RECOMMENDATION_CHECKS) {
    if (!input[item.key]) missingRecommendations.push(item.message);
  }

  const recommendedCompletedCount =
    VEHICLE_MEDIA_RECOMMENDED_PROTOCOL_ANGLES - missingRecommendations.length;

  return {
    isComplete: missingRequirements.length === 0,
    missingRequirements,
    isRecommendedComplete:
      missingRequirements.length === 0 && missingRecommendations.length === 0,
    missingRecommendations,
    recommendedCompletedCount,
    recommendedTotalCount: VEHICLE_MEDIA_RECOMMENDED_PROTOCOL_ANGLES
  };
}

/** Hissə elanı üçün minimum şəkil sayı (avtomobil protokolundan asılı deyil). */
export const PART_MEDIA_PROTOCOL_MIN_IMAGES = 1;

/** Avtomobil hissəsi elanları üçün — tam avtomobil media protokolu tətbiq olunmur */
export function validatePartListingMediaProtocol(input: MediaProtocolInput): MediaProtocolResult {
  const missingRequirements: string[] = [];
  if (input.imageCount < PART_MEDIA_PROTOCOL_MIN_IMAGES) {
    missingRequirements.push(`Hissə üçün ən azı ${PART_MEDIA_PROTOCOL_MIN_IMAGES} şəkil tələb olunur.`);
  }
  return {
    isComplete: missingRequirements.length === 0,
    missingRequirements,
    isRecommendedComplete: missingRequirements.length === 0,
    missingRecommendations: [],
    recommendedCompletedCount: 0,
    recommendedTotalCount: 0
  };
}
