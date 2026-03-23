-- EkoMobil elan qiymət planları
-- Referans: Turbo.az (30 gün pulsuz), mobile.de (Basis/Standard/Premium)

CREATE TABLE IF NOT EXISTS listing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_az TEXT NOT NULL,
  price_azn INTEGER NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 30,
  priority_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  is_highlighted BOOLEAN NOT NULL DEFAULT FALSE,
  featured_in_home BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO listing_plans (id, name, name_az, price_azn, duration_days, priority_multiplier, is_highlighted, featured_in_home, sort_order) VALUES
  ('free', 'Free', 'Pulsuz', 0, 30, 1.0, FALSE, FALSE, 1),
  ('standard', 'Standard', 'Standart', 9, 30, 1.5, TRUE, FALSE, 2),
  ('vip', 'VIP', 'VIP', 19, 30, 3.0, TRUE, TRUE, 3)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE listings ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'free';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_listings_plan_type ON listings (plan_type);
CREATE INDEX IF NOT EXISTS idx_listings_plan_expires ON listings (plan_expires_at) WHERE plan_expires_at IS NOT NULL;
