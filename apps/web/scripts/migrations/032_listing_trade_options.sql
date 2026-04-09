ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS credit_available BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS barter_available BOOLEAN NULL;

CREATE INDEX IF NOT EXISTS idx_listings_credit_available ON listings (credit_available);
CREATE INDEX IF NOT EXISTS idx_listings_barter_available ON listings (barter_available);
