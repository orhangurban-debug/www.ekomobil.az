CREATE TABLE IF NOT EXISTS auction_listings (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  seller_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_dealer_profile_id TEXT NULL REFERENCES dealer_profiles(id) ON DELETE SET NULL,
  mode TEXT NOT NULL DEFAULT 'ascending',
  settlement_model TEXT NOT NULL DEFAULT 'off_platform_direct',
  title_snapshot TEXT NOT NULL,
  starting_bid_azn INTEGER NOT NULL,
  reserve_price_azn INTEGER NULL,
  buy_now_price_azn INTEGER NULL,
  current_bid_azn INTEGER NULL,
  current_bidder_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  minimum_increment_azn INTEGER NOT NULL DEFAULT 500,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  deposit_required BOOLEAN NOT NULL DEFAULT FALSE,
  deposit_amount_azn INTEGER NULL,
  winner_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  buyer_confirmed_at TIMESTAMPTZ NULL,
  seller_confirmed_at TIMESTAMPTZ NULL,
  sale_confirmed_at TIMESTAMPTZ NULL,
  no_show_reported_at TIMESTAMPTZ NULL,
  dispute_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auction_listings_listing_id
  ON auction_listings (listing_id);

CREATE INDEX IF NOT EXISTS idx_auction_listings_status
  ON auction_listings (status);

CREATE INDEX IF NOT EXISTS idx_auction_listings_seller_user_id
  ON auction_listings (seller_user_id);

CREATE INDEX IF NOT EXISTS idx_auction_listings_ends_at
  ON auction_listings (ends_at);

CREATE TABLE IF NOT EXISTS auction_bids (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  bidder_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_azn INTEGER NOT NULL,
  is_auto_bid BOOLEAN NOT NULL DEFAULT FALSE,
  max_auto_bid_azn INTEGER NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  ip_hash TEXT NULL,
  device_fingerprint TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id_created_at
  ON auction_bids (auction_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auction_bids_bidder_user_id
  ON auction_bids (bidder_user_id);

CREATE TABLE IF NOT EXISTS auction_participants (
  auction_id TEXT NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  bidder_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  deposit_required BOOLEAN NOT NULL DEFAULT FALSE,
  deposit_status TEXT NOT NULL DEFAULT 'not_required',
  risk_level TEXT NOT NULL DEFAULT 'normal',
  can_bid BOOLEAN NOT NULL DEFAULT TRUE,
  blocked_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (auction_id, bidder_user_id)
);

CREATE INDEX IF NOT EXISTS idx_auction_participants_risk_level
  ON auction_participants (risk_level);

CREATE TABLE IF NOT EXISTS auction_outcomes (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL UNIQUE REFERENCES auction_listings(id) ON DELETE CASCADE,
  winner_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  winning_bid_azn INTEGER NULL,
  status TEXT NOT NULL DEFAULT 'ended_pending_confirmation',
  buyer_confirmed_at TIMESTAMPTZ NULL,
  seller_confirmed_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  no_show_at TIMESTAMPTZ NULL,
  ops_verified_at TIMESTAMPTZ NULL,
  resolution_note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_outcomes_status
  ON auction_outcomes (status);

CREATE TABLE IF NOT EXISTS auction_financial_events (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  amount_azn INTEGER NOT NULL,
  provider TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  checkout_url TEXT NULL,
  payment_reference TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_financial_events_auction_id
  ON auction_financial_events (auction_id);

CREATE INDEX IF NOT EXISTS idx_auction_financial_events_status
  ON auction_financial_events (status);

CREATE TABLE IF NOT EXISTS auction_deposits (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  bidder_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_azn INTEGER NOT NULL,
  provider TEXT NOT NULL DEFAULT 'kapital_bank',
  status TEXT NOT NULL DEFAULT 'pending',
  checkout_url TEXT NULL,
  payment_reference TEXT NULL,
  returned_at TIMESTAMPTZ NULL,
  forfeited_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_deposits_auction_id
  ON auction_deposits (auction_id);

CREATE INDEX IF NOT EXISTS idx_auction_deposits_bidder_user_id
  ON auction_deposits (bidder_user_id);
