ALTER TABLE manual_review_cases
  ADD COLUMN IF NOT EXISTS reviewer_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ NULL;

ALTER TABLE manual_review_cases
  ALTER COLUMN status SET DEFAULT 'open';

CREATE INDEX IF NOT EXISTS idx_manual_review_cases_status
  ON manual_review_cases (status);
