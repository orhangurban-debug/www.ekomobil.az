-- Reklam müraciətləri — reklam vermək istəyən şirkətlərin sorğuları
-- Admin paneldən baxılır, qiymət danışıqları aparılır, sonra slot aktivləşdirilir.

CREATE TABLE IF NOT EXISTS ad_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id          TEXT NOT NULL,
  company_name     TEXT NOT NULL,
  contact_name     TEXT NOT NULL,
  contact_email    TEXT NOT NULL,
  contact_phone    TEXT,
  website_url      TEXT,
  message          TEXT,
  budget_azn       NUMERIC(10,2),
  duration_days    INT,
  is_waitlist      BOOLEAN NOT NULL DEFAULT FALSE,
  status           TEXT NOT NULL DEFAULT 'pending',
  admin_note       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ad_requests_status_idx ON ad_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_requests_slot_idx   ON ad_requests (slot_id, created_at DESC);
