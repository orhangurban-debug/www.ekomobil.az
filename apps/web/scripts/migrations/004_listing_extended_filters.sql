-- Genişləndirilmiş filter sahələri (Turbo.az referansı)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS body_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS drive_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS color TEXT NULL,
  ADD COLUMN IF NOT EXISTS condition TEXT NULL,
  ADD COLUMN IF NOT EXISTS engine_power_hp INTEGER NULL;

CREATE INDEX IF NOT EXISTS idx_listings_body_type ON listings (body_type);
CREATE INDEX IF NOT EXISTS idx_listings_drive_type ON listings (drive_type);
CREATE INDEX IF NOT EXISTS idx_listings_color ON listings (color);
CREATE INDEX IF NOT EXISTS idx_listings_mileage_km ON listings (mileage_km);
