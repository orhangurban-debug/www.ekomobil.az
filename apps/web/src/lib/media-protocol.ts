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

export function validateMediaProtocol(input: MediaProtocolInput): MediaProtocolResult {
  const missingRequirements: string[] = [];

  if (input.imageCount < 20) {
    missingRequirements.push("At least 20 photos are required.");
  }

  if (input.engineVideoDurationSec < 15 || input.engineVideoDurationSec > 30) {
    missingRequirements.push("Engine video must be between 15 and 30 seconds.");
  }

  if (!input.hasFrontAngle) missingRequirements.push("Front angle photo is missing.");
  if (!input.hasRearAngle) missingRequirements.push("Rear angle photo is missing.");
  if (!input.hasLeftSide) missingRequirements.push("Left side photo is missing.");
  if (!input.hasRightSide) missingRequirements.push("Right side photo is missing.");
  if (!input.hasDashboard) missingRequirements.push("Dashboard photo is missing.");
  if (!input.hasInterior) missingRequirements.push("Interior photo is missing.");
  if (!input.hasOdometer) missingRequirements.push("Odometer photo is missing.");
  if (!input.hasTrunk) missingRequirements.push("Trunk photo is missing.");

  return {
    isComplete: missingRequirements.length === 0,
    missingRequirements
  };
}
