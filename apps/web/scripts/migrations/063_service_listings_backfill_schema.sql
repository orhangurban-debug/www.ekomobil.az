-- Ensure service_listings has columns required by runtime inserts/backfill
ALTER TABLE service_listings ADD COLUMN IF NOT EXISTS owner_user_id TEXT;
ALTER TABLE service_listings ADD COLUMN IF NOT EXISTS branch_cities TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_service_listings_owner ON service_listings (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_service_listings_support_request ON service_listings (support_request_id);
