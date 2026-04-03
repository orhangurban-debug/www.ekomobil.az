-- Enterprise admin: incidents, audit log, auction controls, and scale indexes

CREATE TABLE IF NOT EXISTS incident_cases (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL, -- listing | user | lead | auction | payment | kyc | system
  subject_id TEXT NOT NULL,
  category TEXT NOT NULL, -- complaint | fraud | policy_violation | false_info | abuse | technical
  severity TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  status TEXT NOT NULL DEFAULT 'open', -- open | triage | in_review | actioned | resolved | dismissed
  source TEXT NOT NULL DEFAULT 'admin', -- admin | user_report | automated_rule | ops
  reporter_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NULL,
  resolution_note TEXT NULL,
  metadata JSONB NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_cases_status_created
  ON incident_cases (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_cases_assignee_status
  ON incident_cases (assigned_to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_incident_cases_subject
  ON incident_cases (subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_incident_cases_category_status
  ON incident_cases (category, status);
CREATE INDEX IF NOT EXISTS idx_incident_cases_severity
  ON incident_cases (severity);

CREATE TABLE IF NOT EXISTS incident_events (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES incident_cases(id) ON DELETE CASCADE,
  actor_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- created | assigned | status_changed | note | action
  note TEXT NULL,
  before_state JSONB NULL,
  after_state JSONB NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_events_incident_created
  ON incident_events (incident_id, created_at DESC);

CREATE TABLE IF NOT EXISTS incident_assignments (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES incident_cases(id) ON DELETE CASCADE,
  assigned_to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_incident_assignments_active_user
  ON incident_assignments (assigned_to_user_id, active);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- user | listing | lead | incident | auction | settings | system
  entity_id TEXT NULL,
  reason TEXT NULL,
  before_state JSONB NULL,
  after_state JSONB NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity
  ON admin_audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor
  ON admin_audit_logs (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action
  ON admin_audit_logs (action_type, created_at DESC);

CREATE TABLE IF NOT EXISTS auction_admin_controls (
  auction_id TEXT PRIMARY KEY REFERENCES auction_listings(id) ON DELETE CASCADE,
  freeze_bidding BOOLEAN NOT NULL DEFAULT FALSE,
  force_manual_review BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT NULL,
  updated_by_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scale indexes for 10k+ admin workloads
CREATE INDEX IF NOT EXISTS idx_leads_stage_created
  ON leads (stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_buyer_created
  ON leads (buyer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_owner_created
  ON listings (owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_status_created
  ON listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manual_review_cases_status_created
  ON manual_review_cases (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manual_review_cases_reviewer_status
  ON manual_review_cases (reviewer_id, status);
