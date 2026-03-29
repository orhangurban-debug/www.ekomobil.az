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
