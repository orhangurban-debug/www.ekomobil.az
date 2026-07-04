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
  isComplete: boolean;
  missingRequirements: string[];
}

interface ValidateMediaProtocolOptions {
  minimumImageCount?: number;
  requireVideo?: boolean;
}

export function validateMediaProtocol(
  input: MediaProtocolInput,
  options?: ValidateMediaProtocolOptions
): MediaProtocolResult {
  const missingRequirements: string[] = [];
  const minimumImageCount = options?.minimumImageCount ?? 8;
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

  if (!input.hasFrontAngle) missingRequirements.push("Ön tərəfin şəkli seçilməyib.");
  if (!input.hasRearAngle) missingRequirements.push("Arxa tərəfin şəkli seçilməyib.");
  if (!input.hasLeftSide) missingRequirements.push("Sol tərəfin şəkli seçilməyib.");
  if (!input.hasRightSide) missingRequirements.push("Sağ tərəfin şəkli seçilməyib.");
  if (!input.hasDashboard) {
    missingRequirements.push("Sükan və cihazlar panelinin şəkli seçilməyib.");
  }
  if (!input.hasInterior) {
    missingRequirements.push("Salon şəkli seçilməyib (ön oturacaq, arxa oturacaq və ya tavan).");
  }
  if (!input.hasOdometer) missingRequirements.push("Yürüş sayğacının şəkli seçilməyib.");
  if (!input.hasTrunk) missingRequirements.push("Baqajın şəkli seçilməyib.");

  return {
    isComplete: missingRequirements.length === 0,
    missingRequirements
  };
}

/** Avtomobil hissəsi elanları üçün — tam avtomobil media protokolu tətbiq olunmur */
export function validatePartListingMediaProtocol(input: MediaProtocolInput): MediaProtocolResult {
  const missingRequirements: string[] = [];
  if (input.imageCount < 4) {
    missingRequirements.push("Hissə üçün ən azı 4 şəkil tələb olunur.");
  }
  return {
    isComplete: missingRequirements.length === 0,
    missingRequirements
  };
}
