ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS part_authenticity TEXT NULL;

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_part_authenticity_check;
ALTER TABLE listings
  ADD CONSTRAINT listings_part_authenticity_check
  CHECK (part_authenticity IS NULL OR part_authenticity IN ('original', 'oem', 'aftermarket'));

CREATE INDEX IF NOT EXISTS idx_listings_part_authenticity ON listings (part_authenticity);

CREATE TABLE IF NOT EXISTS listing_stats (
  listing_id TEXT PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 0,
  contact_click_count INTEGER NOT NULL DEFAULT 0,
  test_drive_click_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
