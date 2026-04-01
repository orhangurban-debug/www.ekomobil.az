-- Module 1: System settings (feature flags), user trust/penalty fields,
-- pre-auth transactions for STRICT_PRE_AUTH, card ping audit for BETA_FIN_ONLY.

CREATE TABLE IF NOT EXISTS system_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  auction_mode TEXT NOT NULL DEFAULT 'BETA_FIN_ONLY'
    CHECK (auction_mode IN ('BETA_FIN_ONLY', 'STRICT_PRE_AUTH')),
  penalty_amounts JSONB NOT NULL DEFAULT '{"vehicle":80,"part":15}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (id, auction_mode, penalty_amounts)
VALUES (1, 'BETA_FIN_ONLY', '{"vehicle":80,"part":15}'::jsonb)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS fin_code TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_identity_verified BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS penalty_balance_azn INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_account_status TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_users_penalty_balance
  ON users (penalty_balance_azn)
  WHERE penalty_balance_azn > 0;

CREATE INDEX IF NOT EXISTS idx_users_account_status
  ON users (user_account_status);

CREATE TABLE IF NOT EXISTS auction_preauth_transactions (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_azn INTEGER NOT NULL CHECK (amount_azn > 0),
  status TEXT NOT NULL DEFAULT 'pending_hold'
    CHECK (status IN ('pending_hold', 'held', 'voided', 'captured', 'failed')),
  provider TEXT NOT NULL DEFAULT 'kapital_bank',
  payment_reference TEXT NULL,
  checkout_url TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  voided_at TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_auction_preauth_one_held_per_user
  ON auction_preauth_transactions (auction_id, user_id)
  WHERE status = 'held';

CREATE INDEX IF NOT EXISTS idx_auction_preauth_auction_status
  ON auction_preauth_transactions (auction_id, status);

CREATE INDEX IF NOT EXISTS idx_auction_preauth_user_held
  ON auction_preauth_transactions (user_id)
  WHERE status = 'held';

CREATE TABLE IF NOT EXISTS auction_bid_card_validations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  auction_id TEXT NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  amount_azn INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated', 'voided', 'simulated_ok', 'failed')),
  provider_ref TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_bid_card_val_user_auction
  ON auction_bid_card_validations (user_id, auction_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auction_bids_proxy_tiebreak
  ON auction_bids (auction_id, max_auto_bid_azn, created_at ASC)
  WHERE max_auto_bid_azn IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_auction_listings_close_worker
  ON auction_listings (status, ends_at)
  WHERE status IN ('live', 'extended');
