CREATE TABLE IF NOT EXISTS listing_plan_payments (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  owner_user_id TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  amount_azn INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'boost',
  provider TEXT NOT NULL DEFAULT 'kapital_bank',
  status TEXT NOT NULL DEFAULT 'pending',
  checkout_url TEXT NOT NULL,
  provider_reference TEXT NULL,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_plan_payments_listing_id ON listing_plan_payments (listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_plan_payments_owner_user_id ON listing_plan_payments (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_listing_plan_payments_status ON listing_plan_payments (status);
