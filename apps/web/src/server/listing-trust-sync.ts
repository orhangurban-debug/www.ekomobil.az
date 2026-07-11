import { getPgPool } from "@/lib/postgres";
import { resolveListingSellerVerified } from "@/lib/listing-seller-verification";
import { estimateTrustScore } from "@/lib/trust-score";

async function syncTrustForListingIds(listingIds: string[]): Promise<void> {
  if (listingIds.length === 0) return;
  const pool = getPgPool();

  const rows = await pool.query<{
    listing_id: string;
    seller_verified: boolean | null;
    vin_verified: boolean | null;
    media_complete: boolean | null;
    mileage_flag_severity: string | null;
    dealer_verified: boolean;
    owner_kyc_approved: boolean;
    owner_email_verified: boolean;
    owner_phone_set: boolean;
    seller_type: string;
    listing_kind: string | null;
    owner_has_store_plan: boolean;
  }>(
    `
      SELECT
        l.id AS listing_id,
        ts.seller_verified,
        ts.vin_verified,
        ts.media_complete,
        ts.mileage_flag_severity,
        COALESCE(dp.verified, FALSE) AS dealer_verified,
        EXISTS (
          SELECT 1 FROM user_kyc_profiles kp
          WHERE kp.status = 'approved'
            AND kp.user_id IN (l.owner_user_id, dp.owner_user_id)
        ) AS owner_kyc_approved,
        COALESCE(ou.email_verified, FALSE) AS owner_email_verified,
        (NULLIF(BTRIM(COALESCE(ou.phone, '')), '') IS NOT NULL) AS owner_phone_set,
        l.seller_type,
        l.listing_kind,
        EXISTS (
          SELECT 1 FROM business_plan_subscriptions bps
          WHERE bps.owner_user_id = l.owner_user_id
            AND bps.business_type = 'parts_store'
            AND bps.status = 'active'
            AND (bps.expires_at IS NULL OR bps.expires_at > NOW())
        ) AS owner_has_store_plan
      FROM listings l
      LEFT JOIN listing_trust_signals ts ON ts.listing_id = l.id
      LEFT JOIN dealer_profiles dp ON dp.id = l.dealer_profile_id
      LEFT JOIN users ou ON ou.id = l.owner_user_id
      WHERE l.id = ANY($1::text[])
    `,
    [listingIds]
  );

  for (const row of rows.rows) {
    const sellerVerified = resolveListingSellerVerified({
      storedSellerVerified: row.seller_verified,
      dealerProfileVerified: row.dealer_verified,
      ownerKycApproved: row.owner_kyc_approved,
      ownerEmailVerified: row.owner_email_verified,
      ownerPhoneSet: row.owner_phone_set,
      sellerType: row.seller_type,
      listingKind: row.listing_kind === "part" ? "part" : "vehicle",
      hasStorePlan: row.owner_has_store_plan
    });

    const trustScore = estimateTrustScore({
      vinVerification: {
        status: row.vin_verified ? "verified" : "pending",
        sourceType: "user_submitted"
      },
      sellerVerified,
      mediaComplete: row.media_complete ?? false,
      mileageFlag:
        row.mileage_flag_severity === "warning" || row.mileage_flag_severity === "high_risk"
          ? {
              severity: row.mileage_flag_severity as "warning" | "high_risk",
              reasonCode: "MILEAGE_FLAG",
              message: ""
            }
          : undefined
    });

    await pool.query(
      `
        INSERT INTO listing_trust_signals (
          listing_id, trust_score, vin_verified, seller_verified, media_complete,
          mileage_flag_severity, last_verified_at, updated_at
        )
        VALUES ($1, $2, COALESCE($3, FALSE), $4, COALESCE($5, FALSE), $6, NOW(), NOW())
        ON CONFLICT (listing_id)
        DO UPDATE SET
          trust_score = EXCLUDED.trust_score,
          seller_verified = EXCLUDED.seller_verified,
          last_verified_at = NOW(),
          updated_at = NOW()
      `,
      [
        row.listing_id,
        trustScore,
        row.vin_verified,
        sellerVerified,
        row.media_complete,
        row.mileage_flag_severity
      ]
    );
  }
}

export async function syncListingTrustForDealerOwner(ownerUserId: string): Promise<void> {
  const pool = getPgPool();
  const result = await pool.query<{ id: string }>(
    `
      SELECT l.id
      FROM listings l
      JOIN dealer_profiles dp ON dp.id = l.dealer_profile_id
      WHERE dp.owner_user_id = $1
    `,
    [ownerUserId]
  );
  await syncTrustForListingIds(result.rows.map((row) => row.id));
}

export async function syncListingTrustForOwner(ownerUserId: string): Promise<void> {
  const pool = getPgPool();
  const result = await pool.query<{ id: string }>(
    `SELECT id FROM listings WHERE owner_user_id = $1`,
    [ownerUserId]
  );
  await syncTrustForListingIds(result.rows.map((row) => row.id));
}

export async function syncListingTrustForListing(listingId: string): Promise<void> {
  await syncTrustForListingIds([listingId]);
}

export async function resolveSellerVerifiedForPublish(input: {
  ownerUserId: string;
  dealerProfileId?: string | null;
  listingKind?: "vehicle" | "part";
}): Promise<boolean> {
  const pool = getPgPool();
  const result = await pool.query<{
    dealer_verified: boolean;
    owner_kyc_approved: boolean;
    owner_email_verified: boolean;
    owner_phone_set: boolean;
    owner_has_store_plan: boolean;
  }>(
    `
      SELECT
        COALESCE(dp.verified, FALSE) AS dealer_verified,
        EXISTS (
          SELECT 1 FROM user_kyc_profiles kp
          WHERE kp.status = 'approved'
            AND kp.user_id IN ($1, dp.owner_user_id)
        ) AS owner_kyc_approved,
        COALESCE(u.email_verified, FALSE) AS owner_email_verified,
        (NULLIF(BTRIM(COALESCE(u.phone, '')), '') IS NOT NULL) AS owner_phone_set,
        EXISTS (
          SELECT 1 FROM business_plan_subscriptions bps
          WHERE bps.owner_user_id = $1
            AND bps.business_type = 'parts_store'
            AND bps.status = 'active'
            AND (bps.expires_at IS NULL OR bps.expires_at > NOW())
        ) AS owner_has_store_plan
      FROM users u
      LEFT JOIN dealer_profiles dp ON dp.id = $2
      WHERE u.id = $1
      LIMIT 1
    `,
    [input.ownerUserId, input.dealerProfileId ?? null]
  );

  const row = result.rows[0];
  if (!row) return false;

  return resolveListingSellerVerified({
    dealerProfileVerified: row.dealer_verified,
    ownerKycApproved: row.owner_kyc_approved,
    ownerEmailVerified: row.owner_email_verified,
    ownerPhoneSet: row.owner_phone_set,
    sellerType: input.dealerProfileId ? "dealer" : "private",
    listingKind: input.listingKind ?? "vehicle",
    hasStorePlan: row.owner_has_store_plan
  });
}
