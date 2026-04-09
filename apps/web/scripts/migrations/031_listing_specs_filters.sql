ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS engine_volume_cc INTEGER NULL,
  ADD COLUMN IF NOT EXISTS interior_material TEXT NULL,
  ADD COLUMN IF NOT EXISTS has_sunroof BOOLEAN NULL;

CREATE INDEX IF NOT EXISTS idx_listings_engine_volume_cc ON listings (engine_volume_cc);
CREATE INDEX IF NOT EXISTS idx_listings_interior_material ON listings (interior_material);
CREATE INDEX IF NOT EXISTS idx_listings_has_sunroof ON listings (has_sunroof);
