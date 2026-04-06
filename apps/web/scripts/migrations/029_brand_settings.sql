ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS brand_settings JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE system_settings
SET brand_settings = jsonb_build_object(
  'logoUrl', '/brand/ekomobil-logo.png',
  'logoSquareUrl', '/brand/ekomobil-logo.png',
  'faviconUrl', '/brand/ekomobil-logo.png',
  'primaryColor', '#0891B2',
  'primaryHoverColor', '#0E7490',
  'deepBaseColor', '#3E2F28',
  'softBrownColor', '#E5D3B3',
  'softBrownBorderColor', '#D4C4A8',
  'canvasColor', '#FFFFFF',
  'gallery', jsonb_build_array(
    jsonb_build_object(
      'id', 'default-main-logo',
      'label', 'Əsas loqo (PNG)',
      'url', '/brand/ekomobil-logo.png',
      'kind', 'logo'
    )
  )
)
WHERE COALESCE(brand_settings, '{}'::jsonb) = '{}'::jsonb;
