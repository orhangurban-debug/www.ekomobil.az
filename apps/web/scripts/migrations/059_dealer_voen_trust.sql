-- Add VÖEN and trust-related fields to dealer_profiles
-- VÖEN is a voluntary trust signal, not a hard requirement
ALTER TABLE dealer_profiles
  ADD COLUMN IF NOT EXISTS voen TEXT NULL,
  ADD COLUMN IF NOT EXISTS voen_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trust_score INTEGER NOT NULL DEFAULT 0;

-- Add voen to user_profiles for store owners
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS voen TEXT NULL;
