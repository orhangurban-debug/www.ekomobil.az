ALTER TABLE auction_listings
  ADD COLUMN IF NOT EXISTS seller_bond_required BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS seller_bond_amount_azn INTEGER NULL;

CREATE TABLE IF NOT EXISTS user_kyc_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  kyc_level TEXT NOT NULL DEFAULT 'basic',
  status TEXT NOT NULL DEFAULT 'not_submitted',
  legal_name TEXT NULL,
  national_id_last4 TEXT NULL,
  document_ref TEXT NULL,
  submitted_at TIMESTAMPTZ NULL,
  reviewed_at TIMESTAMPTZ NULL,
  reviewed_by_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  review_note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_kyc_profiles_status
  ON user_kyc_profiles (status);
