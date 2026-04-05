CREATE TABLE IF NOT EXISTS support_requests (
  id TEXT PRIMARY KEY,
  request_type TEXT NOT NULL DEFAULT 'question',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'normal',
  source TEXT NOT NULL DEFAULT 'web',
  reporter_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reporter_name TEXT,
  reporter_email TEXT,
  reporter_phone TEXT,
  listing_id TEXT REFERENCES listings(id) ON DELETE SET NULL,
  assigned_to_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  admin_response TEXT,
  response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT support_requests_type_check CHECK (request_type IN ('question', 'problem', 'complaint', 'partnership', 'other')),
  CONSTRAINT support_requests_status_check CHECK (status IN ('new', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  CONSTRAINT support_requests_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE INDEX IF NOT EXISTS idx_support_requests_status_created ON support_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_requests_priority_created ON support_requests(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_requests_assignee ON support_requests(assigned_to_user_id, status);
