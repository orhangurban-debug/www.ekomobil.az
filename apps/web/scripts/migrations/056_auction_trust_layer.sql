-- Auksion etibar qatı: ekspertiza hesabatı + shill bid izləmə + satış sənədi
-- -----------------------------------------------------------------------

-- 1. Vəziyyət hesabatı: satıcı tərəfindən doldurulan 40+ bəndlik standart şablon
CREATE TABLE IF NOT EXISTS auction_inspection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  submitted_by_user_id UUID NOT NULL,

  -- Gövdə & xarici görünüş
  body_front        TEXT NOT NULL DEFAULT 'unknown',  -- excellent|good|fair|poor|unknown
  body_rear         TEXT NOT NULL DEFAULT 'unknown',
  body_left         TEXT NOT NULL DEFAULT 'unknown',
  body_right        TEXT NOT NULL DEFAULT 'unknown',
  body_roof         TEXT NOT NULL DEFAULT 'unknown',
  body_underbody    TEXT NOT NULL DEFAULT 'unknown',
  glass_windshield  TEXT NOT NULL DEFAULT 'unknown',
  lights            TEXT NOT NULL DEFAULT 'unknown',
  paint_status      TEXT NOT NULL DEFAULT 'unknown',  -- original|partial|full|unknown
  rust_presence     TEXT NOT NULL DEFAULT 'unknown',  -- none|minor|moderate|severe|unknown

  -- Mexanika
  engine_condition       TEXT NOT NULL DEFAULT 'unknown',
  engine_oil             TEXT NOT NULL DEFAULT 'unknown',
  transmission_condition TEXT NOT NULL DEFAULT 'unknown',
  clutch_condition       TEXT NOT NULL DEFAULT 'na',  -- na for automatics
  suspension             TEXT NOT NULL DEFAULT 'unknown',
  brakes_front           TEXT NOT NULL DEFAULT 'unknown',
  brakes_rear            TEXT NOT NULL DEFAULT 'unknown',
  exhaust                TEXT NOT NULL DEFAULT 'unknown',
  cooling                TEXT NOT NULL DEFAULT 'unknown',
  fuel_system            TEXT NOT NULL DEFAULT 'unknown',

  -- Elektrik
  battery_condition   TEXT NOT NULL DEFAULT 'unknown',
  ac_system           TEXT NOT NULL DEFAULT 'unknown',
  infotainment        TEXT NOT NULL DEFAULT 'unknown',
  warning_lights      TEXT NOT NULL DEFAULT 'unknown',  -- none|minor|major|unknown
  power_accessories   TEXT NOT NULL DEFAULT 'unknown',

  -- Salon
  seats_condition    TEXT NOT NULL DEFAULT 'unknown',
  dashboard_condition TEXT NOT NULL DEFAULT 'unknown',
  carpet_condition   TEXT NOT NULL DEFAULT 'unknown',
  trunk_condition    TEXT NOT NULL DEFAULT 'unknown',

  -- Sənədlər
  has_tech_passport   BOOLEAN NOT NULL DEFAULT FALSE,
  has_service_history BOOLEAN NOT NULL DEFAULT FALSE,
  accident_history    TEXT NOT NULL DEFAULT 'unknown',  -- none|minor|moderate|major|unknown
  vin_matches_docs    BOOLEAN NOT NULL DEFAULT TRUE,
  registration_valid  BOOLEAN NOT NULL DEFAULT TRUE,

  -- Açıqlama
  known_defects       TEXT,
  recent_repairs      TEXT,
  inspector_note      TEXT,

  -- Müfəttiş məlumatı
  inspector_type      TEXT NOT NULL DEFAULT 'seller_self',  -- seller_self|certified_partner
  inspector_name      TEXT,
  inspector_cert_no   TEXT,
  inspection_date     DATE,

  status TEXT NOT NULL DEFAULT 'submitted',  -- submitted|ops_verified|disputed
  ops_note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS auction_inspection_reports_auction_id_idx
  ON auction_inspection_reports(auction_id);

-- 2. Shill bid xəbərdarlıqları
CREATE TABLE IF NOT EXISTS auction_shill_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL,  -- ip_collision|seller_ip_match|rapid_bidder_cluster
  detail JSONB NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'warning',  -- warning|critical
  reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by_user_id UUID,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auction_shill_flags_auction_id_idx ON auction_shill_flags(auction_id);
CREATE INDEX IF NOT EXISTS auction_shill_flags_reviewed_idx ON auction_shill_flags(reviewed) WHERE reviewed = FALSE;

-- 3. Platforma satış sənədi (escrow əvəzinə hüquqi qeyd)
CREATE TABLE IF NOT EXISTS auction_sale_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auction_listings(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL,
  seller_user_id UUID NOT NULL,
  buyer_user_id UUID NOT NULL,
  hammer_price_azn NUMERIC(12,2) NOT NULL,
  vin TEXT,
  vehicle_title_snapshot TEXT NOT NULL,
  lot_fee_azn NUMERIC(12,2),
  seller_commission_azn NUMERIC(12,2),
  settlement_note TEXT NOT NULL DEFAULT 'off_platform_direct — avtomobilin dəyəri birbaşa alıcı-satıcı arasında ödənir',
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS auction_sale_agreements_auction_id_idx
  ON auction_sale_agreements(auction_id);

-- 4. Inspection period support: ended_pending_inspection
-- (Status məntiqini yalnız kod səviyyəsində idarə edirik — DB-də TEXT column)
-- auction_listings.inspection_deadline_at: alıcının 24 saatlıq müayinə müddəti
ALTER TABLE auction_listings
  ADD COLUMN IF NOT EXISTS inspection_deadline_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS inspection_accepted_at TIMESTAMPTZ NULL;
