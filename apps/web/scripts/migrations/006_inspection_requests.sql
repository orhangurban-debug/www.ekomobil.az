-- Ekspertiza sifariş sorğuları
CREATE TABLE IF NOT EXISTS inspection_requests (
  id TEXT PRIMARY KEY,
  listing_id TEXT NULL REFERENCES listings(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NULL,
  preferred_date DATE NULL,
  note TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspection_requests_listing ON inspection_requests (listing_id);
CREATE INDEX IF NOT EXISTS idx_inspection_requests_created ON inspection_requests (created_at DESC);
