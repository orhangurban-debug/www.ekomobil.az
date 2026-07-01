-- Module 40: Fraud prevention, platform consent, activity logs, law-enforcement workflow

CREATE TABLE IF NOT EXISTS user_consent_acceptances (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type     TEXT        NOT NULL CHECK (consent_type IN ('terms', 'privacy')),
  document_version TEXT        NOT NULL,
  accepted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address       TEXT,
  user_agent       TEXT,
  source           TEXT        NOT NULL DEFAULT 'register'
                     CHECK (source IN ('register', 'oauth', 'reaccept', 'manual')),
  UNIQUE (user_id, consent_type, document_version)
);

CREATE INDEX IF NOT EXISTS idx_user_consent_acceptances_user
  ON user_consent_acceptances (user_id, consent_type, document_version);

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT        NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  ip_hash     TEXT,
  user_agent  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_created
  ON user_activity_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_created
  ON user_activity_logs (action_type, created_at DESC);

CREATE TABLE IF NOT EXISTS user_reports (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id    TEXT        REFERENCES users(id) ON DELETE SET NULL,
  reported_user_id    TEXT        REFERENCES users(id) ON DELETE SET NULL,
  listing_id          TEXT        REFERENCES listings(id) ON DELETE SET NULL,
  reason_code         TEXT        NOT NULL
                        CHECK (reason_code IN ('fraud', 'misleading', 'stolen', 'fake_listing', 'harassment', 'other')),
  description         TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new', 'triaged', 'linked_incident', 'dismissed', 'resolved')),
  incident_id         TEXT        REFERENCES incident_cases(id) ON DELETE SET NULL,
  reporter_ip         TEXT,
  reporter_user_agent TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_reports_status_created
  ON user_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user
  ON user_reports (reported_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS legal_data_requests (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number    TEXT        NOT NULL UNIQUE,
  authority_name      TEXT        NOT NULL,
  request_type        TEXT        NOT NULL
                        CHECK (request_type IN ('subpoena', 'court_order', 'investigation', 'emergency', 'other')),
  status              TEXT        NOT NULL DEFAULT 'received'
                        CHECK (status IN ('received', 'verification', 'approved', 'partially_disclosed', 'disclosed', 'rejected', 'closed')),
  received_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at              TIMESTAMPTZ,
  subject_user_id     TEXT        REFERENCES users(id) ON DELETE SET NULL,
  subject_listing_id  TEXT        REFERENCES listings(id) ON DELETE SET NULL,
  legal_hold_until    TIMESTAMPTZ,
  request_summary     TEXT        NOT NULL,
  disclosure_log      JSONB       NOT NULL DEFAULT '[]'::jsonb,
  internal_notes      TEXT,
  created_by_user_id  TEXT        REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_data_requests_status
  ON legal_data_requests (status, received_at DESC);

ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_hold_reason TEXT;
