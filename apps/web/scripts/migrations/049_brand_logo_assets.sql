-- Yeni peşəkar EkoMobil loqosu tətbiq edildi (bax: apps/web/public/brand/).
-- Kvadrat loqo/favicon əvvəllər səhvən eninə (wordmark) loqoya işarə edirdi;
-- indi xüsusi kvadrat nişana (ekomobil-mark.png) yönləndirilir. Yalnız hələ
-- fərdiləşdirilməmiş (defolt) qiymətləri yeniləyirik ki, admin-in əlavə etdiyi
-- xüsusi loqolar üzərinə yazılmasın.

UPDATE system_settings
SET brand_settings = jsonb_set(
  jsonb_set(brand_settings, '{logoSquareUrl}', '"/brand/ekomobil-mark.png"'),
  '{faviconUrl}', '"/brand/ekomobil-mark.png"'
),
updated_at = NOW()
WHERE id = 1
  AND brand_settings->>'logoSquareUrl' = '/brand/ekomobil-logo.png'
  AND brand_settings->>'faviconUrl' = '/brand/ekomobil-logo.png';

-- Yeni asset-ləri qalereyaya əlavə et (yalnız hələ mövcud deyilsə).
UPDATE system_settings
SET brand_settings = jsonb_set(
  brand_settings,
  '{gallery}',
  brand_settings->'gallery' || jsonb_build_array(
    jsonb_build_object(
      'id', 'ekomobil-logo-dark',
      'label', 'Loqo (tünd fon üçün, ağ mətn)',
      'url', '/brand/ekomobil-logo-dark.png',
      'kind', 'logo'
    ),
    jsonb_build_object(
      'id', 'ekomobil-mark',
      'label', 'Kvadrat loqo nişanı (favicon/app icon)',
      'url', '/brand/ekomobil-mark.png',
      'kind', 'logo'
    ),
    jsonb_build_object(
      'id', 'ekomobil-og',
      'label', 'Sosial paylaşım banneri (1200x630)',
      'url', '/brand/ekomobil-og.png',
      'kind', 'social'
    )
  )
),
updated_at = NOW()
WHERE id = 1
  AND NOT (brand_settings->'gallery' @> '[{"id": "ekomobil-mark"}]'::jsonb);
