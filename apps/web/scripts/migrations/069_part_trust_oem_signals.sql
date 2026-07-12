-- Part listings: drop vehicle-centric VIN N/A copy and rescore with OEM/SKU identity.

UPDATE listing_trust_signals ts
SET
  service_history_summary = NULL,
  vin_verified = FALSE,
  mileage_flag_severity = NULL,
  mileage_flag_message = NULL,
  risk_summary = CASE
    WHEN NULLIF(BTRIM(COALESCE(l.part_oem_code, '')), '') IS NOT NULL
      THEN 'OEM kodu, media və satıcı siqnalları yoxlanıb'
    ELSE 'Media və satıcı siqnalları yoxlanıb'
  END,
  updated_at = NOW()
FROM listings l
WHERE ts.listing_id = l.id
  AND COALESCE(l.listing_kind, 'vehicle') = 'part';

UPDATE listing_trust_signals ts
SET
  trust_score = LEAST(
    100,
    GREATEST(
      0,
      50
      + CASE
          WHEN NULLIF(BTRIM(COALESCE(l.part_oem_code, '')), '') IS NOT NULL
            OR NULLIF(BTRIM(COALESCE(l.part_sku, '')), '') IS NOT NULL
          THEN 20
          ELSE 0
        END
      + CASE WHEN l.part_authenticity IS NOT NULL THEN 10 ELSE 0 END
      + CASE WHEN COALESCE(ts.seller_verified, FALSE) THEN 10 ELSE 0 END
      + CASE WHEN COALESCE(ts.media_complete, FALSE) THEN 10 ELSE 0 END
    )
  ),
  updated_at = NOW()
FROM listings l
WHERE ts.listing_id = l.id
  AND COALESCE(l.listing_kind, 'vehicle') = 'part';
