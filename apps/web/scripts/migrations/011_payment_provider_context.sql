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
