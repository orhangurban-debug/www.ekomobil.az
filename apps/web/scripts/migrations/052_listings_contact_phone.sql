-- Elan sahibinin əlaqə nömrəsini elanda saxla
-- Alıcı elan üzərindən birbaşa satıcı ilə əlaqə saxlaya bilsin.
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS contact_phone  TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
