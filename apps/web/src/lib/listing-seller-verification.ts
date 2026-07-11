import { estimateTrustScore } from "@/lib/trust-score";
import type { ListingSummary } from "@/lib/marketplace-types";

export interface ListingSellerVerificationContext {
  storedSellerVerified?: boolean | null;
  dealerProfileVerified?: boolean | null;
  ownerKycApproved?: boolean | null;
  ownerEmailVerified?: boolean | null;
  ownerPhoneSet?: boolean | null;
  sellerType?: string | null;
  listingKind?: string | null;
  hasStorePlan?: boolean | null;
}

/**
 * Resolves whether the seller is considered verified for Avto-Bioqrafiya.
 * Salon admin təsdiqi, KYC və mağaza planı bu siqnala təsir edir.
 */
export function resolveListingSellerVerified(input: ListingSellerVerificationContext): boolean {
  if (input.dealerProfileVerified) return true;
  if (input.ownerKycApproved) return true;
  if (input.listingKind === "part" && input.hasStorePlan && input.ownerEmailVerified) return true;
  if (input.sellerType === "private" && input.ownerEmailVerified && input.ownerPhoneSet) return true;
  return Boolean(input.storedSellerVerified);
}

export function listingSellerContextSelectSql(): string {
  return `
    COALESCE(dp.verified, FALSE) AS dealer_verified,
    COALESCE(ou.email_verified, FALSE) AS owner_email_verified,
    (NULLIF(BTRIM(COALESCE(ou.phone, '')), '') IS NOT NULL) AS owner_phone_set,
    EXISTS (
      SELECT 1
      FROM kyc_profiles kp
      WHERE kp.status = 'approved'
        AND kp.user_id IN (l.owner_user_id, dp.owner_user_id)
    ) AS owner_kyc_approved,
    EXISTS (
      SELECT 1
      FROM business_plan_subscriptions bps
      WHERE bps.owner_user_id = l.owner_user_id
        AND bps.business_type = 'parts_store'
        AND bps.status = 'active'
        AND (bps.expires_at IS NULL OR bps.expires_at > NOW())
    ) AS owner_has_store_plan
  `;
}

export interface ListingTrustRowContext extends ListingSellerVerificationContext {
  ownerHasStorePlan?: boolean | null;
  trustScore?: number | null;
  vinVerified?: boolean | null;
  mediaComplete?: boolean | null;
  mileageFlagSeverity?: ListingSummary["mileageFlagSeverity"] | string | null;
}

export function resolveListingTrustSignals(row: ListingTrustRowContext): {
  sellerVerified: boolean;
  trustScore: number;
} {
  const sellerVerified = resolveListingSellerVerified({
    storedSellerVerified: row.storedSellerVerified,
    dealerProfileVerified: row.dealerProfileVerified,
    ownerKycApproved: row.ownerKycApproved,
    ownerEmailVerified: row.ownerEmailVerified,
    ownerPhoneSet: row.ownerPhoneSet,
    sellerType: row.sellerType,
    listingKind: row.listingKind,
    hasStorePlan: row.ownerHasStorePlan
  });

  const trustScore = estimateTrustScore({
    vinVerification: {
      status: row.vinVerified ? "verified" : "pending",
      sourceType: "user_submitted"
    },
    sellerVerified,
    mediaComplete: row.mediaComplete ?? false,
    mileageFlag:
      row.mileageFlagSeverity === "warning" || row.mileageFlagSeverity === "high_risk"
        ? {
            severity: row.mileageFlagSeverity,
            reasonCode: "MILEAGE_FLAG",
            message: ""
          }
        : undefined
  });

  return { sellerVerified, trustScore };
}
