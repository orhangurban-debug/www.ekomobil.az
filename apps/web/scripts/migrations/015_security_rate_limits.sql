-- Rate limiting table for login, bid, payment and other critical endpoints
CREATE TABLE IF NOT EXISTS security_rate_limits (
  key           TEXT    NOT NULL,
  window_minute BIGINT  NOT NULL,
  count         INT     NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_minute)
);

-- Index for fast cleanup of expired windows
CREATE INDEX IF NOT EXISTS idx_security_rate_limits_window ON security_rate_limits(window_minute);
