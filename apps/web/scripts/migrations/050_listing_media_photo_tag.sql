-- Elan şəkillərinin növü (ön tərəf, salon və s.) — kart üzlüyü və vahid sıralama üçün
ALTER TABLE listing_media
  ADD COLUMN IF NOT EXISTS photo_tag TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_listing_media_photo_tag
  ON listing_media (listing_id, photo_tag)
  WHERE media_type = 'image';
