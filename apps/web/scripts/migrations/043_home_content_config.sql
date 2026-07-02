-- Ana səhifə məzmunu konfiqurasiyası (admin paneldən idarə olunur:
-- hero slaydları, kateqoriyalar, başlıqlar).
ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS home_content_config JSONB NOT NULL DEFAULT '{}'::jsonb;
