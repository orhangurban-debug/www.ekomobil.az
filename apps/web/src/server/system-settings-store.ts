import type { SystemSettingsRow, PenaltyAmountsJson, AuctionPaymentMode } from "@/lib/auction-system-settings";
import { DEFAULT_PENALTY_AMOUNTS } from "@/lib/auction-system-settings";
import { getPgPool } from "@/lib/postgres";

interface SystemSettingsDbRow {
  id: number;
  auction_mode: string;
  penalty_amounts: PenaltyAmountsJson;
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
