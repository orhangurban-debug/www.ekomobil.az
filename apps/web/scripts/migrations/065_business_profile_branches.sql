-- Structured business profile branches (city, address, map URL, contact).

ALTER TABLE dealer_profiles
  ADD COLUMN IF NOT EXISTS map_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS branches JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS store_map_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS store_branches JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE service_listings
  ADD COLUMN IF NOT EXISTS branches JSONB NOT NULL DEFAULT '[]'::jsonb;
