CREATE TABLE IF NOT EXISTS user_oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email_at_provider TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_user_id),
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_oauth_accounts_user_id
  ON user_oauth_accounts (user_id);

CREATE INDEX IF NOT EXISTS idx_user_oauth_accounts_provider
  ON user_oauth_accounts (provider);
