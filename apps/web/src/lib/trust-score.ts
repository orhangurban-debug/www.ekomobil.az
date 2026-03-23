import { MileageEvent, MileageFlag, TrustSignals, VehicleIdentity } from "@/lib/vehicle";

function getMileageFlag(vehicle: VehicleIdentity, latestEvent?: MileageEvent): MileageFlag | undefined {
  if (!latestEvent) {
    return {
      severity: "info",
      reasonCode: "MILEAGE_NO_EXTERNAL_DATA",
      message: "External mileage data is not available yet."
    };
  }

  const diff = vehicle.declaredMileageKm - latestEvent.mileageKm;
  const absDiff = Math.abs(diff);

  if (absDiff <= 2000) {
    return undefined;
  }

  if (absDiff <= 10000) {
    return {
      severity: "warning",
      reasonCode: "MILEAGE_PARTIAL_MISMATCH",
      message: "Declared mileage has a noticeable mismatch with historical records."
    };
  }

  return {
    severity: "high_risk",
    reasonCode: "MILEAGE_HIGH_RISK_MISMATCH",
    message: "Declared mileage strongly conflicts with trusted historical records."
  };
}

export function buildTrustSignals(input: {
  vehicle: VehicleIdentity;
  vinVerified: boolean;
  sellerVerified: boolean;
  mediaComplete: boolean;
  latestMileageEvent?: MileageEvent;
}): TrustSignals {
  const mileageFlag = getMileageFlag(input.vehicle, input.latestMileageEvent);

  return {
    vinVerification: {
      status: input.vinVerified ? "verified" : "pending",
      sourceType: input.latestMileageEvent?.sourceType ?? "user_submitted",
      verifiedAt: input.vinVerified ? new Date().toISOString() : undefined
    },
    mileageFlag,
    sellerVerified: input.sellerVerified,
    mediaComplete: input.mediaComplete
  };
}

export function estimateTrustScore(signals: TrustSignals): number {
  let score = 50;

  if (signals.vinVerification.status === "verified") score += 25;
  if (signals.sellerVerified) score += 10;
  if (signals.mediaComplete) score += 10;

  if (signals.mileageFlag?.severity === "warning") score -= 10;
  if (signals.mileageFlag?.severity === "high_risk") score -= 30;

  return Math.max(0, Math.min(100, score));
}
