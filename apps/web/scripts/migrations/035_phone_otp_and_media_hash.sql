ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_normalized TEXT NULL,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_normalized_unique
  ON users (phone_normalized)
  WHERE phone_normalized IS NOT NULL;

CREATE TABLE IF NOT EXISTS phone_otp_challenges (
  id TEXT PRIMARY KEY,
  phone_normalized TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ NULL,
  consumed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_otp_phone_created
  ON phone_otp_challenges (phone_normalized, created_at DESC);

ALTER TABLE listing_media
  ADD COLUMN IF NOT EXISTS perceptual_hash TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_listing_media_perceptual_hash
  ON listing_media (perceptual_hash)
  WHERE perceptual_hash IS NOT NULL;
