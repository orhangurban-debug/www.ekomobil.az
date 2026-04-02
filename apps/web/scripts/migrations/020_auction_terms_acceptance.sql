-- Module 20: Auksion şərt qəbulu (terms acceptance)
--
-- Məqsəd: hər istifadəçinin alıcı/satıcı rolunda şərtləri server tərəfindən
-- qəbul etdiyini qeyd edirik. localStorage baxımı artıq yetərli deyil:
--   - fərqli cihazlarda silinir
--   - API yoxlaması üçün istifadə edilə bilmir
--
-- terms_version: şərtlər dəyişdikdə yeni versiya ilə yenidən qəbul tələb oluna bilər.

CREATE TABLE IF NOT EXISTS auction_terms_acceptances (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- 'bidder' = alıcı, 'seller' = satıcı
  role           TEXT        NOT NULL CHECK (role IN ('bidder', 'seller')),
  terms_version  TEXT        NOT NULL DEFAULT 'v1',
  accepted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address     TEXT,
  user_agent     TEXT,

  -- Bir istifadəçi eyni rol + versiya üçün yalnız bir dəfə qəbul edir
  UNIQUE (user_id, role, terms_version)
);

CREATE INDEX IF NOT EXISTS idx_auction_terms_acceptances_user_role
  ON auction_terms_acceptances (user_id, role, terms_version);
