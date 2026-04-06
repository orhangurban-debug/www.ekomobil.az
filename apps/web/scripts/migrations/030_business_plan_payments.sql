CREATE TABLE IF NOT EXISTS business_plan_payments (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_type TEXT NOT NULL CHECK (business_type IN ('dealer', 'parts_store')),
  plan_id TEXT NOT NULL,
  amount_azn INTEGER NOT NULL,
  provider TEXT NOT NULL DEFAULT 'kapital_bank',
  status TEXT NOT NULL DEFAULT 'pending',
  checkout_url TEXT NOT NULL,
  provider_reference TEXT NULL,
  provider_mode TEXT NULL,
  checkout_strategy TEXT NULL,
  provider_payload JSONB NULL,
  completed_at TIMESTAMPTZ NULL,
  starts_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_plan_payments_owner
  ON business_plan_payments (owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_plan_payments_status
  ON business_plan_payments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_plan_payments_business
  ON business_plan_payments (business_type, plan_id, created_at DESC);
