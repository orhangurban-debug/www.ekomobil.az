-- Elan rədd etmə qeydi
-- Admin elanı rədd etdikdə səbəbi burada saxlayır; istifadəçiyə göstərilir.
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS rejection_note TEXT;
