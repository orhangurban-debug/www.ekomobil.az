-- =============================================================================
-- EkoMobil: BÜTÜN DB MİQRASİYALARI (001 → 019) — ARDICILLIQ ÖNƏMLİDİR
-- Supabase SQL Editor-də bütün skripti bir dəfə və ya blok-blok işlədin.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 001_init.sql
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manual_review_cases (
  id UUID PRIMARY KEY,
  listing_id TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ NULL,
  resolution_note TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_manual_review_cases_created_at
  ON manual_review_cases (created_at DESC);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name
  ON analytics_events (event_name);

-- ---------------------------------------------------------------------------
-- 002_marketplace_core.sql
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role
  ON users (role);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NULL,
  city TEXT NULL,
  avatar_url TEXT NULL,
  bio TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dealer_profiles (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  response_sla_minutes INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  dealer_profile_id TEXT REFERENCES dealer_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  city TEXT NOT NULL,
  price_azn INTEGER NOT NULL,
  mileage_km INTEGER NOT NULL,
  fuel_type TEXT NOT NULL,
  transmission TEXT NOT NULL,
  vin TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  seller_type TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_created_at
  ON listings (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listings_city
  ON listings (city);

CREATE INDEX IF NOT EXISTS idx_listings_make_model
  ON listings (make, model);

CREATE INDEX IF NOT EXISTS idx_listings_status
  ON listings (status);

CREATE TABLE IF NOT EXISTS listing_media (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listing_trust_signals (
  listing_id TEXT PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  trust_score INTEGER NOT NULL DEFAULT 50,
  vin_verified BOOLEAN NOT NULL DEFAULT FALSE,
  seller_verified BOOLEAN NOT NULL DEFAULT FALSE,
  media_complete BOOLEAN NOT NULL DEFAULT FALSE,
  mileage_flag_severity TEXT NULL,
  mileage_flag_message TEXT NULL,
  service_history_summary TEXT NULL,
  risk_summary TEXT NULL,
  last_verified_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listing_service_records (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  service_date TIMESTAMPTZ NOT NULL,
  mileage_km INTEGER NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  dealer_profile_id TEXT NULL REFERENCES dealer_profiles(id) ON DELETE SET NULL,
  buyer_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NULL,
  customer_email TEXT NULL,
  note TEXT NULL,
  stage TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'listing_detail',
  response_time_minutes INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_listing_stage
  ON leads (listing_id, stage);

CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query_params JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 003_trust_workflow.sql
-- ---------------------------------------------------------------------------
ALTER TABLE manual_review_cases
  ADD COLUMN IF NOT EXISTS reviewer_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ NULL;

ALTER TABLE manual_review_cases
  ALTER COLUMN status SET DEFAULT 'open';

CREATE INDEX IF NOT EXISTS idx_manual_review_cases_status
  ON manual_review_cases (status);

-- ---------------------------------------------------------------------------
-- 004_listing_extended_filters.sql
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 005_listing_plans.sql
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_az TEXT NOT NULL,
  price_azn INTEGER NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 30,
  priority_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  is_highlighted BOOLEAN NOT NULL DEFAULT FALSE,
  featured_in_home BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO listing_plans (id, name, name_az, price_azn, duration_days, priority_multiplier, is_highlighted, featured_in_home, sort_order) VALUES
  ('free', 'Free', 'Pulsuz', 0, 30, 1.0, FALSE, FALSE, 1),
  ('standard', 'Standard', 'Standart', 9, 30, 1.5, TRUE, FALSE, 2),
  ('vip', 'VIP', 'VIP', 19, 30, 3.0, TRUE, TRUE, 3)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE listings ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'free';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_listings_plan_type ON listings (plan_type);
CREATE INDEX IF NOT EXISTS idx_listings_plan_expires ON listings (plan_expires_at) WHERE plan_expires_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 006_inspection_requests.sql
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_requests (
  id TEXT PRIMARY KEY,
  listing_id TEXT NULL REFERENCES listings(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NULL,
  preferred_date DATE NULL,
  note TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspection_requests_listing ON inspection_requests (listing_id);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_created ON inspection_requests (created_at DESC);

-- ---------------------------------------------------------------------------
-- 007_ai_chat_limits.sql
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_chat_usage (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  period_date DATE NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identifier, period_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_usage_lookup ON ai_chat_usage (identifier, period_date);

-- ---------------------------------------------------------------------------
-- 008_listing_plan_payments.sql
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 009_auction_platform_model.sql
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 010_auction_ops.sql
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auction_audit_logs (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  actor_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_audit_logs_auction_id_created_at
  ON auction_audit_logs (auction_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auction_audit_logs_action_type
  ON auction_audit_logs (action_type);

-- ---------------------------------------------------------------------------
-- 011_payment_provider_context.sql
-- ---------------------------------------------------------------------------
ALTER TABLE listing_plan_payments
  ADD COLUMN IF NOT EXISTS provider_mode TEXT NULL,
  ADD COLUMN IF NOT EXISTS checkout_strategy TEXT NULL,
  ADD COLUMN IF NOT EXISTS provider_payload JSONB NULL;

ALTER TABLE auction_financial_events
  ADD COLUMN IF NOT EXISTS provider_mode TEXT NULL,
  ADD COLUMN IF NOT EXISTS checkout_strategy TEXT NULL,
  ADD COLUMN IF NOT EXISTS provider_payload JSONB NULL;

ALTER TABLE auction_deposits
  ADD COLUMN IF NOT EXISTS provider_mode TEXT NULL,
  ADD COLUMN IF NOT EXISTS checkout_strategy TEXT NULL,
  ADD COLUMN IF NOT EXISTS provider_payload JSONB NULL;

-- ---------------------------------------------------------------------------
-- 012_auction_concurrency.sql
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 013_auction_listing_documents.sql
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auction_listing_documents (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  uploaded_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review',
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  storage_backend TEXT NOT NULL,
  storage_ref TEXT NOT NULL,
  ops_note TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  reviewed_by_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_listing_documents_auction_id
  ON auction_listing_documents (auction_id);

CREATE INDEX IF NOT EXISTS idx_auction_listing_documents_status
  ON auction_listing_documents (status);

CREATE INDEX IF NOT EXISTS idx_auction_listing_documents_pending
  ON auction_listing_documents (status, created_at DESC)
  WHERE status = 'pending_review';

-- ---------------------------------------------------------------------------
-- 014_listing_kind_vehicle_part.sql
-- ---------------------------------------------------------------------------
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_kind TEXT NOT NULL DEFAULT 'vehicle';

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_listing_kind_check;
ALTER TABLE listings ADD CONSTRAINT listings_listing_kind_check CHECK (listing_kind IN ('vehicle', 'part'));

-- ---------------------------------------------------------------------------
-- 015_security_rate_limits.sql
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_rate_limits (
  key           TEXT    NOT NULL,
  window_minute BIGINT  NOT NULL,
  count         INT     NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_minute)
);

CREATE INDEX IF NOT EXISTS idx_security_rate_limits_window ON security_rate_limits(window_minute);

-- ---------------------------------------------------------------------------
-- 016_dispute_evidence.sql
-- ---------------------------------------------------------------------------
ALTER TABLE auction_listing_documents
  ADD COLUMN IF NOT EXISTS uploader_role TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_auction_listing_documents_dispute
  ON auction_listing_documents (auction_id, doc_type)
  WHERE doc_type = 'dispute_evidence';

-- ---------------------------------------------------------------------------
-- 017_auction_sla_reminders.sql
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auction_sla_reminders (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  reminder_key TEXT NOT NULL,
  reminder_type TEXT NOT NULL,
  auction_status TEXT NOT NULL,
  severity TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message TEXT NOT NULL,
  delivery_channel TEXT NOT NULL DEFAULT 'ops_audit',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (auction_id, reminder_key)
);

CREATE INDEX IF NOT EXISTS idx_auction_sla_reminders_triggered_at
  ON auction_sla_reminders (triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_auction_sla_reminders_auction_id
  ON auction_sla_reminders (auction_id);

-- ---------------------------------------------------------------------------
-- 018_auction_seller_bond_and_deep_kyc.sql
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 019_auction_hybrid_engine.sql
-- ---------------------------------------------------------------------------
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

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS engine_volume_cc INTEGER NULL,
  ADD COLUMN IF NOT EXISTS interior_material TEXT NULL,
  ADD COLUMN IF NOT EXISTS has_sunroof BOOLEAN NULL;

CREATE INDEX IF NOT EXISTS idx_listings_engine_volume_cc ON listings (engine_volume_cc);
CREATE INDEX IF NOT EXISTS idx_listings_interior_material ON listings (interior_material);
CREATE INDEX IF NOT EXISTS idx_listings_has_sunroof ON listings (has_sunroof);

-- =============================================================================
-- SON
-- =============================================================================
