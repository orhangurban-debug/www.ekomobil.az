-- Module 41: User report evidence workflow (reporter proof + reported defense)

ALTER TABLE user_reports
  ADD COLUMN IF NOT EXISTS reporter_evidence TEXT,
  ADD COLUMN IF NOT EXISTS reported_defense TEXT,
  ADD COLUMN IF NOT EXISTS defense_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS defense_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalated_to_authorities_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS false_report_flag BOOLEAN NOT NULL DEFAULT FALSE;

-- Genişləndirilmiş status dəyərləri
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

CREATE INDEX IF NOT EXISTS idx_user_reports_awaiting_defense
  ON user_reports (reported_user_id, status, defense_due_at)
  WHERE status = 'awaiting_reported_defense';
