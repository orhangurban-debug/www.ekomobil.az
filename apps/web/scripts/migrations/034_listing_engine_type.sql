ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS engine_type TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_engine_type ON listings (engine_type);
