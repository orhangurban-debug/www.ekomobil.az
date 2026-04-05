ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS part_category TEXT NULL,
  ADD COLUMN IF NOT EXISTS part_subcategory TEXT NULL,
  ADD COLUMN IF NOT EXISTS part_brand TEXT NULL,
  ADD COLUMN IF NOT EXISTS part_condition TEXT NULL,
  ADD COLUMN IF NOT EXISTS part_oem_code TEXT NULL,
  ADD COLUMN IF NOT EXISTS part_sku TEXT NULL,
  ADD COLUMN IF NOT EXISTS part_quantity INTEGER NULL,
  ADD COLUMN IF NOT EXISTS part_compatibility TEXT NULL;

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_part_condition_check;
ALTER TABLE listings
  ADD CONSTRAINT listings_part_condition_check
  CHECK (part_condition IS NULL OR part_condition IN ('new', 'used', 'refurbished'));

CREATE INDEX IF NOT EXISTS idx_listings_part_category ON listings (part_category);
CREATE INDEX IF NOT EXISTS idx_listings_part_subcategory ON listings (part_subcategory);
CREATE INDEX IF NOT EXISTS idx_listings_part_brand ON listings (part_brand);
CREATE INDEX IF NOT EXISTS idx_listings_part_condition ON listings (part_condition);
CREATE INDEX IF NOT EXISTS idx_listings_part_quantity ON listings (part_quantity);
CREATE INDEX IF NOT EXISTS idx_listings_part_oem_code ON listings (part_oem_code);
CREATE INDEX IF NOT EXISTS idx_listings_part_sku ON listings (part_sku);
