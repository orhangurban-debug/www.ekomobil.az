-- Dispute evidence: uploader role (buyer vs seller) for ops clarity
ALTER TABLE auction_listing_documents
  ADD COLUMN IF NOT EXISTS uploader_role TEXT NULL;

-- Index for fast dispute evidence queries
CREATE INDEX IF NOT EXISTS idx_auction_listing_documents_dispute
  ON auction_listing_documents (auction_id, doc_type)
  WHERE doc_type = 'dispute_evidence';
