-- Reklam slotları konfiqurasiyası (admin paneldən idarə olunur)
ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS ad_slots_config JSONB NOT NULL DEFAULT '{}'::jsonb;
