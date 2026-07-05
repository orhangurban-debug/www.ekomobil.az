-- Satıcı profil sahələri: mağaza adı, loqo, cover şəkili
-- Fərdi satıcılar: avatar_url + bio (artıq var)
-- Mağaza satıcıları: store_name + store_logo_url + store_cover_url

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS store_name        TEXT NULL,
  ADD COLUMN IF NOT EXISTS store_logo_url    TEXT NULL,
  ADD COLUMN IF NOT EXISTS store_cover_url   TEXT NULL,
  ADD COLUMN IF NOT EXISTS store_description TEXT NULL;
