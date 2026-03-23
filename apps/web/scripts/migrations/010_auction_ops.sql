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
