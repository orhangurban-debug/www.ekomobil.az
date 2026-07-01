-- Module 41: User report evidence workflow (reporter proof + reported defense)
-- NOTE: Requires 040_fraud_legal_compliance.sql first (creates user_reports).

-- Safety: if 040 was skipped, create base table with full schema.
CREATE TABLE IF NOT EXISTS user_reports (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id            TEXT        REFERENCES users(id) ON DELETE SET NULL,
  reported_user_id            TEXT        REFERENCES users(id) ON DELETE SET NULL,
  listing_id                  TEXT        REFERENCES listings(id) ON DELETE SET NULL,
  reason_code                 TEXT        NOT NULL
                                CHECK (reason_code IN ('fraud', 'misleading', 'stolen', 'fake_listing', 'harassment', 'other')),
  description                 TEXT        NOT NULL,
  reporter_evidence           TEXT,
  reported_defense            TEXT,
  defense_due_at              TIMESTAMPTZ,
  defense_submitted_at        TIMESTAMPTZ,
  escalated_to_authorities_at TIMESTAMPTZ,
  false_report_flag           BOOLEAN     NOT NULL DEFAULT FALSE,
  status                      TEXT        NOT NULL DEFAULT 'awaiting_reported_defense',
  incident_id                 TEXT        REFERENCES incident_cases(id) ON DELETE SET NULL,
  reporter_ip                 TEXT,
  reporter_user_agent         TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_reports
  ADD COLUMN IF NOT EXISTS reporter_evidence TEXT,
  ADD COLUMN IF NOT EXISTS reported_defense TEXT,
  ADD COLUMN IF NOT EXISTS defense_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS defense_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalated_to_authorities_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS false_report_flag BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE user_reports DROP CONSTRAINT IF EXISTS user_reports_status_check;
ALTER TABLE user_reports ADD CONSTRAINT user_reports_status_check
  CHECK (status IN (
    'new',
    'awaiting_reported_defense',
    'defense_received',
    'under_review',
    'linked_incident',
    'escalated_to_authorities',
    'dismissed_false_report',
    'resolved',
    'triaged',
    'dismissed'
  ));

CREATE INDEX IF NOT EXISTS idx_user_reports_status_created
  ON user_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user
  ON user_reports (reported_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_reports_awaiting_defense
  ON user_reports (reported_user_id, status, defense_due_at)
  WHERE status = 'awaiting_reported_defense';
