ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS pricing_plan_config JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS pricing_economics_config JSONB NOT NULL DEFAULT '{}'::jsonb;
