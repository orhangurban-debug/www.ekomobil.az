-- Add owner_user_id to service_listings so profiles can be linked to user accounts
ALTER TABLE service_listings
  ADD COLUMN IF NOT EXISTS owner_user_id TEXT REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_service_listings_owner ON service_listings (owner_user_id);
