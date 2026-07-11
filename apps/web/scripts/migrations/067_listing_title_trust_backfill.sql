-- Canonical vehicle titles + seller verification backfill for verified salons/KYC.

UPDATE listings
SET
  title = UPPER(BTRIM(make)) || ' ' || UPPER(BTRIM(model)) || ' ' || year::text
    || ' — ' || UPPER(BTRIM(fuel_type))
    || ' — ' || REPLACE(TO_CHAR(mileage_km, 'FM999G999'), ',', ' ') || ' KM'
    || CASE
      WHEN color IS NOT NULL AND BTRIM(color) <> '' THEN ' — ' || UPPER(BTRIM(color))
      ELSE ''
    END,
  updated_at = NOW()
WHERE COALESCE(listing_kind, 'vehicle') = 'vehicle'
  AND BTRIM(make) <> ''
  AND BTRIM(model) <> '';

UPDATE listing_trust_signals lts
SET
  seller_verified = TRUE,
  trust_score = LEAST(
    100,
    COALESCE(lts.trust_score, 50)
      + CASE WHEN COALESCE(lts.seller_verified, FALSE) THEN 0 ELSE 10 END
  ),
  last_verified_at = NOW(),
  updated_at = NOW()
FROM listings l
LEFT JOIN dealer_profiles dp ON dp.id = l.dealer_profile_id
WHERE lts.listing_id = l.id
  AND COALESCE(lts.seller_verified, FALSE) = FALSE
  AND (
    COALESCE(dp.verified, FALSE) = TRUE
    OR EXISTS (
      SELECT 1
      FROM kyc_profiles kp
      WHERE kp.status = 'approved'
        AND kp.user_id IN (l.owner_user_id, dp.owner_user_id)
    )
  );
