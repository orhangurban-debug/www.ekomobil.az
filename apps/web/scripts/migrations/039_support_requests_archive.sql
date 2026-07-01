-- Support inbox retention: resolved/closed → archived → admin delete

ALTER TABLE support_requests DROP CONSTRAINT IF EXISTS support_requests_status_check;

ALTER TABLE support_requests ADD CONSTRAINT support_requests_status_check CHECK (
  status IN ('new', 'in_progress', 'waiting_user', 'resolved', 'closed', 'archived')
);

ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_support_requests_archived_at
  ON support_requests(archived_at)
  WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_requests_status_resolved
  ON support_requests(status, resolved_at)
  WHERE status IN ('resolved', 'closed');
