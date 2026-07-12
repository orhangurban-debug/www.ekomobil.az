-- Admin staff grants: fine-grained permissions on top of users.role
CREATE TABLE IF NOT EXISTS user_admin_grants (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  staff_type TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  granted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_admin_grants_staff_type
  ON user_admin_grants (staff_type);

-- Backfill existing platform admins as super_admin with full capability set
INSERT INTO user_admin_grants (user_id, staff_type, permissions, granted_by, updated_at)
SELECT
  u.id,
  'super_admin',
  ARRAY[
    'users.read',
    'users.write',
    'users.assign_staff',
    'users.delete',
    'listings.moderate',
    'business.manage',
    'services.moderate',
    'support.manage',
    'finance.view',
    'finance.manage',
    'legal.manage',
    'settings.manage',
    'audit.view'
  ]::text[],
  NULL,
  NOW()
FROM users u
WHERE u.role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Existing support staff get a support grant if missing
INSERT INTO user_admin_grants (user_id, staff_type, permissions, granted_by, updated_at)
SELECT
  u.id,
  'support',
  ARRAY[
    'users.read',
    'listings.moderate',
    'services.moderate',
    'support.manage',
    'audit.view'
  ]::text[],
  NULL,
  NOW()
FROM users u
WHERE u.role = 'support'
ON CONFLICT (user_id) DO NOTHING;
