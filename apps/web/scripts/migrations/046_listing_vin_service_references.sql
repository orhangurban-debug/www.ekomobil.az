ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS vin_info_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS vin_document_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS service_history_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS service_history_document_ref TEXT NULL;
