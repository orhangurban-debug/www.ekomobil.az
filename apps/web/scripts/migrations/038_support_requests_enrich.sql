-- Forensic and admin fields for support inbox

ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS reporter_ip TEXT;
ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS reporter_user_agent TEXT;
ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS risk_flag TEXT NOT NULL DEFAULT 'none';

ALTER TABLE support_requests DROP CONSTRAINT IF EXISTS support_requests_risk_flag_check;
ALTER TABLE support_requests ADD CONSTRAINT support_requests_risk_flag_check CHECK (
  risk_flag IN ('none', 'watch', 'abuse', 'legal')
);

CREATE INDEX IF NOT EXISTS idx_support_requests_risk_flag
  ON support_requests(risk_flag)
  WHERE risk_flag <> 'none';

CREATE INDEX IF NOT EXISTS idx_support_requests_reporter_email
  ON support_requests(reporter_email)
  WHERE reporter_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_requests_reporter_user
  ON support_requests(reporter_user_id)
  WHERE reporter_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_requests_type_status
  ON support_requests(request_type, status);
