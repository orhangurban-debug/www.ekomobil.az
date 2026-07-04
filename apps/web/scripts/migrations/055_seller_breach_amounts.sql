-- Satıcı öhdəlik pozuntusu haqqını admin paneldən konfiqurasiya etmək üçün
-- system_settings cədvəlinə seller_breach_amounts sütunu əlavə edilir.
-- Default dəyərlər: nəqliyyat 120 ₼, hissə 20 ₼
ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS seller_breach_amounts JSONB NOT NULL DEFAULT '{"vehicle":120,"part":20}'::jsonb;
