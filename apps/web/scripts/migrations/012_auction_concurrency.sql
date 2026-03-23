CREATE INDEX IF NOT EXISTS idx_auction_listings_status_starts_at
  ON auction_listings (status, starts_at);

CREATE INDEX IF NOT EXISTS idx_auction_listings_status_ends_at
  ON auction_listings (status, ends_at);

CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id_amount_created_at
  ON auction_bids (auction_id, amount_azn DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auction_bids_device_fingerprint_created_at
  ON auction_bids (device_fingerprint, created_at DESC)
  WHERE device_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_auction_financial_events_auction_type_status
  ON auction_financial_events (auction_id, event_type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auction_deposits_auction_bidder_status
  ON auction_deposits (auction_id, bidder_user_id, status, created_at DESC);
