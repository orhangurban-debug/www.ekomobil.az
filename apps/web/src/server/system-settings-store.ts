import type { SystemSettingsRow, PenaltyAmountsJson, AuctionPaymentMode } from "@/lib/auction-system-settings";
import { DEFAULT_PENALTY_AMOUNTS } from "@/lib/auction-system-settings";
import type { BrandSettings } from "@/lib/brand-settings";
import { DEFAULT_BRAND_SETTINGS, parseBrandSettings } from "@/lib/brand-settings";
import {
  DEFAULT_PRICING_PLAN_ADMIN_CONFIG,
  parsePricingPlanAdminConfig,
  type PricingPlanAdminConfig
} from "@/lib/pricing-plan-config";
import { getPgPool } from "@/lib/postgres";

interface SystemSettingsDbRow {
  id: number;
  auction_mode: string;
  penalty_amounts: PenaltyAmountsJson;
  brand_settings?: unknown;
  pricing_plan_config?: unknown;
  pricing_economics_config?: unknown;
  updated_at: Date;
}

function parsePenaltyAmounts(raw: unknown): PenaltyAmountsJson {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PENALTY_AMOUNTS };
  const o = raw as Record<string, number>;
  return {
    vehicle: typeof o.vehicle === "number" ? o.vehicle : DEFAULT_PENALTY_AMOUNTS.vehicle,
    part: typeof o.part === "number" ? o.part : DEFAULT_PENALTY_AMOUNTS.part
  };
}

export async function getSystemSettings(): Promise<SystemSettingsRow> {
  const pool = getPgPool();
  const result = await pool.query<SystemSettingsDbRow>(
    `SELECT id, auction_mode, penalty_amounts, updated_at FROM system_settings WHERE id = 1 LIMIT 1`
  );
  const row = result.rows[0];
  if (!row) {
    return {
      id: 1,
      auctionMode: "BETA_FIN_ONLY",
      penaltyAmounts: { ...DEFAULT_PENALTY_AMOUNTS },
      updatedAt: new Date().toISOString()
    };
  }
  const mode = row.auction_mode === "STRICT_PRE_AUTH" ? "STRICT_PRE_AUTH" : "BETA_FIN_ONLY";
  return {
    id: row.id,
    auctionMode: mode as AuctionPaymentMode,
    penaltyAmounts: parsePenaltyAmounts(row.penalty_amounts),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function updateSystemSettings(input: {
  auctionMode: AuctionPaymentMode;
  penaltyAmounts: PenaltyAmountsJson;
}): Promise<SystemSettingsRow> {
  const pool = getPgPool();
  const result = await pool.query<SystemSettingsDbRow>(
    `INSERT INTO system_settings (id, auction_mode, penalty_amounts, updated_at)
     VALUES (1, $1, $2::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET
       auction_mode = EXCLUDED.auction_mode,
       penalty_amounts = EXCLUDED.penalty_amounts,
       updated_at = NOW()
     RETURNING id, auction_mode, penalty_amounts, updated_at`,
    [input.auctionMode, JSON.stringify(input.penaltyAmounts)]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    auctionMode: (row.auction_mode === "STRICT_PRE_AUTH" ? "STRICT_PRE_AUTH" : "BETA_FIN_ONLY"),
    penaltyAmounts: parsePenaltyAmounts(row.penalty_amounts),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function getBrandSettings(): Promise<BrandSettings> {
  try {
    const pool = getPgPool();
    const result = await pool.query<{ brand_settings: unknown }>(
      `SELECT brand_settings FROM system_settings WHERE id = 1 LIMIT 1`
    );
    const raw = result.rows[0]?.brand_settings;
    return parseBrandSettings(raw ?? DEFAULT_BRAND_SETTINGS);
  } catch {
    return { ...DEFAULT_BRAND_SETTINGS };
  }
}

export async function updateBrandSettings(input: BrandSettings): Promise<BrandSettings> {
  const pool = getPgPool();
  const payload = parseBrandSettings(input);
  const result = await pool.query<{ brand_settings: unknown }>(
    `INSERT INTO system_settings (id, auction_mode, penalty_amounts, brand_settings, updated_at)
     VALUES (1, 'BETA_FIN_ONLY', '{"vehicle":80,"part":15}'::jsonb, $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET
       brand_settings = EXCLUDED.brand_settings,
       updated_at = NOW()
     RETURNING brand_settings`,
    [JSON.stringify(payload)]
  );
  return parseBrandSettings(result.rows[0]?.brand_settings ?? payload);
}

export async function getPricingPlanAdminConfig(): Promise<PricingPlanAdminConfig> {
  try {
    const pool = getPgPool();
    const result = await pool.query<{
      pricing_plan_config: unknown;
      pricing_economics_config: unknown;
    }>(`SELECT pricing_plan_config, pricing_economics_config FROM system_settings WHERE id = 1 LIMIT 1`);
    return parsePricingPlanAdminConfig(
      result.rows[0]?.pricing_plan_config ?? DEFAULT_PRICING_PLAN_ADMIN_CONFIG,
      result.rows[0]?.pricing_economics_config ?? DEFAULT_PRICING_PLAN_ADMIN_CONFIG.economics
    );
  } catch {
    return { ...DEFAULT_PRICING_PLAN_ADMIN_CONFIG };
  }
}

export async function updatePricingPlanAdminConfig(input: PricingPlanAdminConfig): Promise<PricingPlanAdminConfig> {
  const pool = getPgPool();
  const payload = parsePricingPlanAdminConfig(input, input.economics);
  const result = await pool.query<{
    pricing_plan_config: unknown;
    pricing_economics_config: unknown;
  }>(
    `INSERT INTO system_settings (id, auction_mode, penalty_amounts, pricing_plan_config, pricing_economics_config, updated_at)
     VALUES (1, 'BETA_FIN_ONLY', '{"vehicle":80,"part":15}'::jsonb, $1::jsonb, $2::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET
       pricing_plan_config = EXCLUDED.pricing_plan_config,
       pricing_economics_config = EXCLUDED.pricing_economics_config,
       updated_at = NOW()
     RETURNING pricing_plan_config, pricing_economics_config`,
    [JSON.stringify(payload), JSON.stringify(payload.economics)]
  );
  return parsePricingPlanAdminConfig(
    result.rows[0]?.pricing_plan_config ?? payload,
    result.rows[0]?.pricing_economics_config ?? payload.economics
  );
}
