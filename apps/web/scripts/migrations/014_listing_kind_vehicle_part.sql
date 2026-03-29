ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_kind TEXT NOT NULL DEFAULT 'vehicle';

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_listing_kind_check;
ALTER TABLE listings ADD CONSTRAINT listings_listing_kind_check CHECK (listing_kind IN ('vehicle', 'part'));
