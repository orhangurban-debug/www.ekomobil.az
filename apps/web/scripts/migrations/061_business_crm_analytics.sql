-- Business CRM, analytics, and plan enforcement enhancements

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS owner_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS business_type TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_owner_business
  ON leads (owner_user_id, business_type, created_at DESC);

-- Normalize legacy admin CRM stages to dealer portal stages
UPDATE leads SET stage = 'contacted' WHERE stage = 'in_progress';
UPDATE leads SET stage = 'visit_booked' WHERE stage IN ('test_drive', 'offer');
UPDATE leads SET stage = 'closed' WHERE stage = 'won';

-- Backfill owner_user_id from listing ownership
UPDATE leads l
SET owner_user_id = COALESCE(lis.owner_user_id, dp.owner_user_id),
    business_type = CASE
      WHEN COALESCE(lis.listing_kind, 'vehicle') = 'part' THEN 'parts_store'
      ELSE 'dealer'
    END
FROM listings lis
LEFT JOIN dealer_profiles dp ON dp.id = lis.dealer_profile_id
WHERE l.listing_id = lis.id
  AND l.owner_user_id IS NULL;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS inventory_refreshed_at TIMESTAMPTZ NULL;

UPDATE listings
SET inventory_refreshed_at = COALESCE(inventory_refreshed_at, updated_at, created_at)
WHERE inventory_refreshed_at IS NULL;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS store_whatsapp_phone TEXT NULL,
  ADD COLUMN IF NOT EXISTS store_website_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS store_address TEXT NULL,
  ADD COLUMN IF NOT EXISTS store_working_hours TEXT NULL,
  ADD COLUMN IF NOT EXISTS show_store_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_store_website BOOLEAN NOT NULL DEFAULT FALSE;

-- Service partner inquiry CRM
ALTER TABLE inspection_requests
  ADD COLUMN IF NOT EXISTS service_listing_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS owner_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_inspection_requests_owner
  ON inspection_requests (owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inspection_requests_service
  ON inspection_requests (service_listing_id, created_at DESC);

CREATE TABLE IF NOT EXISTS service_listing_stats (
  service_listing_id TEXT PRIMARY KEY REFERENCES service_listings(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 0,
  contact_click_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
