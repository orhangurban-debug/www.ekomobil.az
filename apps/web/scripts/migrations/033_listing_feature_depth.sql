ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS seat_heating BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS seat_cooling BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS camera_360 BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS parking_sensors BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS adaptive_cruise BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS lane_assist BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS owners_count INTEGER NULL,
  ADD COLUMN IF NOT EXISTS has_service_book BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS has_repair_history BOOLEAN NULL;

CREATE INDEX IF NOT EXISTS idx_listings_seat_heating ON listings (seat_heating);
CREATE INDEX IF NOT EXISTS idx_listings_seat_cooling ON listings (seat_cooling);
CREATE INDEX IF NOT EXISTS idx_listings_camera_360 ON listings (camera_360);
CREATE INDEX IF NOT EXISTS idx_listings_parking_sensors ON listings (parking_sensors);
CREATE INDEX IF NOT EXISTS idx_listings_adaptive_cruise ON listings (adaptive_cruise);
CREATE INDEX IF NOT EXISTS idx_listings_lane_assist ON listings (lane_assist);
CREATE INDEX IF NOT EXISTS idx_listings_owners_count ON listings (owners_count);
CREATE INDEX IF NOT EXISTS idx_listings_has_service_book ON listings (has_service_book);
CREATE INDEX IF NOT EXISTS idx_listings_has_repair_history ON listings (has_repair_history);
