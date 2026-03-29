CREATE TABLE IF NOT EXISTS auction_listing_documents (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  uploaded_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review',
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  storage_backend TEXT NOT NULL,
  storage_ref TEXT NOT NULL,
  ops_note TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  reviewed_by_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_listing_documents_auction_id
  ON auction_listing_documents (auction_id);

CREATE INDEX IF NOT EXISTS idx_auction_listing_documents_status
  ON auction_listing_documents (status);

CREATE INDEX IF NOT EXISTS idx_auction_listing_documents_pending
  ON auction_listing_documents (status, created_at DESC)
  WHERE status = 'pending_review';
