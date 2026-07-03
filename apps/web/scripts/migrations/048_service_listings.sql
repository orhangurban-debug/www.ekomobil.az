CREATE TABLE IF NOT EXISTS service_listings (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  support_request_id TEXT REFERENCES support_requests(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NULL,
  map_url TEXT NULL,
  about TEXT NOT NULL DEFAULT '',
  services TEXT[] NOT NULL DEFAULT '{}',
  certifications TEXT[] NOT NULL DEFAULT '{}',
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  phone TEXT NOT NULL,
  whatsapp TEXT NULL,
  rating NUMERIC(3, 1) NOT NULL DEFAULT 5.0,
  review_count INTEGER NOT NULL DEFAULT 0,
  response_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_listings_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_service_listings_status ON service_listings (status);
CREATE INDEX IF NOT EXISTS idx_service_listings_provider_type ON service_listings (provider_type);
CREATE INDEX IF NOT EXISTS idx_service_listings_city ON service_listings (city);
CREATE INDEX IF NOT EXISTS idx_service_listings_created_at ON service_listings (created_at DESC);
