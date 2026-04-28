import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { ensureModelInsightsTable } from "@/server/model-insights-store";

let seeded = false;

export async function ensureSeedData(): Promise<void> {
  if (seeded) return;

  // Kept for backward compatibility: only ensures required system tables.
  // No demo/sample records are inserted.
  await ensureModelInsightsTable();

  // Touch DB connection once so callers still fail fast on connectivity problems.
  const pool = getPgPool();
  await pool.query("SELECT 1");
  seeded = true;
}

export function buildSavedSearchName(query: Record<string, unknown>): string {
  const parts = [query.city, query.make, query.minPrice && `${query.minPrice}+₼`, query.maxPrice && `${query.maxPrice}-₼`]
    .filter(Boolean)
    .map(String);
  return parts.length > 0 ? parts.join(" · ") : "Yeni axtarış";
}

export function createUuidLikeId(): string {
  return randomUUID();
}
