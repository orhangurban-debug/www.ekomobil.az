-- Module 21: Auksion pre-auth checkout metadata + in-app notifications

ALTER TABLE auction_preauth_transactions
  ADD COLUMN IF NOT EXISTS provider_mode TEXT NULL,
  ADD COLUMN IF NOT EXISTS checkout_strategy TEXT NULL,
  ADD COLUMN IF NOT EXISTS provider_payload JSONB NULL;

CREATE TABLE IF NOT EXISTS auction_user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  auction_id TEXT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  cta_href TEXT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_auction_user_notifications_user_created
  ON auction_user_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auction_user_notifications_unread
  ON auction_user_notifications (user_id, is_read)
  WHERE is_read = FALSE;
