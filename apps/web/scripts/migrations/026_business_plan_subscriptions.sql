CREATE TABLE IF NOT EXISTS business_plan_subscriptions (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_type TEXT NOT NULL CHECK (business_type IN ('dealer', 'parts_store')),
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_plan_subscriptions_owner
  ON business_plan_subscriptions (owner_user_id);

CREATE INDEX IF NOT EXISTS idx_business_plan_subscriptions_business
  ON business_plan_subscriptions (business_type, status, expires_at DESC);
