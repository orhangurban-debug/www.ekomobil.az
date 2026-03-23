-- AI chat rate limits: gündəlik istifadə sayı
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
