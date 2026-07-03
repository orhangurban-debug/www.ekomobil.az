CREATE INDEX IF NOT EXISTS idx_listings_part_compatibility ON listings (part_compatibility);
CREATE INDEX IF NOT EXISTS idx_listings_part_oem_code_lower ON listings (LOWER(part_oem_code));
