-- İnvoys cədvəli və vergi sahələri (ƏDV hesabatı üçün)
CREATE TABLE IF NOT EXISTS invoices (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number     TEXT NOT NULL UNIQUE,
  user_id            UUID NOT NULL,
  user_email         TEXT NOT NULL,
  user_name          TEXT NOT NULL DEFAULT '',
  payment_type       TEXT NOT NULL,
  payment_id         TEXT NOT NULL,
  amount_azn         NUMERIC(10,2) NOT NULL,
  vat_rate           NUMERIC(5,2) NOT NULL DEFAULT 18,
  net_amount_azn     NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_amount_azn     NUMERIC(10,2) NOT NULL DEFAULT 0,
  description        TEXT NOT NULL DEFAULT '',
  payment_reference  TEXT,
  email_sent_at      TIMESTAMPTZ,
  email_error        TEXT,
  issued_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) NOT NULL DEFAULT 18;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS net_amount_azn NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS vat_amount_azn NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_payment_id_idx ON invoices(payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS invoices_payment_unique_idx ON invoices(payment_type, payment_id);
CREATE INDEX IF NOT EXISTS invoices_issued_at_idx ON invoices(issued_at DESC);

-- Köhnə sətirlərdə ƏDV məbləğlərini brütdən hesabla (18% daxil)
UPDATE invoices
SET
  vat_rate = COALESCE(NULLIF(vat_rate, 0), 18),
  net_amount_azn = CASE
    WHEN net_amount_azn > 0 THEN net_amount_azn
    ELSE ROUND(amount_azn / 1.18, 2)
  END,
  vat_amount_azn = CASE
    WHEN vat_amount_azn > 0 THEN vat_amount_azn
    ELSE ROUND(amount_azn - amount_azn / 1.18, 2)
  END
WHERE amount_azn > 0;
