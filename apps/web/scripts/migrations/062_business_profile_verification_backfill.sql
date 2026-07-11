-- Backfill salon verification for owners with active dealer subscriptions
UPDATE dealer_profiles dp
SET verified = TRUE
WHERE dp.verified = FALSE
  AND EXISTS (
    SELECT 1 FROM business_plan_subscriptions s
    WHERE s.owner_user_id = dp.owner_user_id
      AND s.business_type = 'dealer'
      AND s.status = 'active'
      AND (s.expires_at IS NULL OR s.expires_at >= NOW())
  );

-- Backfill reporter_name for logged-in business applications missing display name
UPDATE support_requests sr
SET reporter_name = COALESCE(
  NULLIF(TRIM(up.full_name), ''),
  NULLIF(TRIM(u.email), ''),
  sr.reporter_name
)
FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE sr.reporter_user_id = u.id
  AND sr.reporter_user_id IS NOT NULL
  AND (sr.reporter_name IS NULL OR TRIM(sr.reporter_name) = '');
