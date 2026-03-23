export type SourceType = "user_submitted" | "service_partner" | "gov_partner";

export type VerificationStatus = "pending" | "verified" | "failed" | "manual_review";

export type SeverityLevel = "info" | "warning" | "high_risk";

export interface VehicleIdentity {
  vin: string;
  make: string;
  model: string;
  year: number;
  declaredMileageKm: number;
}

export interface MileageEvent {
  sourceType: SourceType;
  recordedAt: string;
  mileageKm: number;
}

export interface MileageFlag {
  severity: SeverityLevel;
  reasonCode: string;
  message: string;
}

export interface TrustSignals {
  vinVerification: {
    status: VerificationStatus;
    sourceType: SourceType;
    verifiedAt?: string;
  };
  mileageFlag?: MileageFlag;
  sellerVerified: boolean;
  mediaComplete: boolean;
}
