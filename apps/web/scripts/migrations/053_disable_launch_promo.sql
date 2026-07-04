-- Açılış kampaniyası yalnız biznes planlarına (salon, mağaza, servis) aiddir.
-- Fərdi elan Standart/VIP planları bu kampaniyadan kənardır — həmişə ödənişlidir.
-- DB-dəki köhnə `launchPromo.enabled = true` dəyərini sıfırla.
UPDATE system_settings
SET pricing_plan_config = jsonb_set(
    COALESCE(pricing_plan_config, '{}'::jsonb),
    '{launchPromo,enabled}',
    'false'::jsonb
)
WHERE id = 1;
