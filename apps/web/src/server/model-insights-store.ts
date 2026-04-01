/**
 * EkoMobil — Model Analitika Mağazası
 *
 * AI tərəfindən yaradılmış model insights-larını PostgreSQL-də saxlayır.
 * 30 günlük freshness window: köhnə məlumat avtomatik yenilənir.
 *
 * Prioritet qaydası:
 *   1. Statik DB (car-insights.ts)
 *   2. PostgreSQL cache (bu fayl)
 *   3. Gemini AI generasiya → PostgreSQL-ə saxla
 *   4. Brand-level fallback
 */

import { getPgPool } from "@/lib/postgres";
import type { CarModelInsights } from "@/lib/car-insights";

const FRESHNESS_DAYS = 30;

// ── DB Schema ─────────────────────────────────────────────────────────────────

export async function ensureModelInsightsTable(): Promise<void> {
  try {
    const pool = getPgPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS model_insights (
        id          TEXT PRIMARY KEY,
        make        TEXT NOT NULL,
        model       TEXT NOT NULL,
        year_from   INTEGER,
        data        JSONB NOT NULL,
        source      TEXT NOT NULL DEFAULT 'ai',
        generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_model_insights_make_model
        ON model_insights (LOWER(make), LOWER(model))
    `);
  } catch {
    // Table may already exist or DB may be unavailable — fail silently
  }
}

function cacheKey(make: string, model: string, yearBucket: number): string {
  return `${make.toLowerCase()}::${model.toLowerCase()}::${yearBucket}`;
}

function yearBucket(year: number): number {
  // Group years in 5-year buckets so 2019/2020/2021 share the same cache entry
  return Math.floor(year / 5) * 5;
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getCachedInsight(
  make: string,
  model: string,
  year: number
): Promise<{ data: CarModelInsights; isStale: boolean } | null> {
  try {
    const pool = getPgPool();
    const key = cacheKey(make, model, yearBucket(year));
    const result = await pool.query<{
      data: CarModelInsights;
      generated_at: Date;
    }>(
      `SELECT data, generated_at FROM model_insights WHERE id = $1 LIMIT 1`,
      [key]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const ageMs = Date.now() - row.generated_at.getTime();
    const isStale = ageMs > FRESHNESS_DAYS * 24 * 60 * 60 * 1000;

    return { data: row.data, isStale };
  } catch {
    return null;
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function saveInsightToCache(
  make: string,
  model: string,
  year: number,
  data: CarModelInsights,
  source: "ai" | "manual" = "ai"
): Promise<void> {
  try {
    const pool = getPgPool();
    const key = cacheKey(make, model, yearBucket(year));
    await pool.query(
      `
        INSERT INTO model_insights (id, make, model, year_from, data, source, generated_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
          SET data = EXCLUDED.data,
              source = EXCLUDED.source,
              updated_at = NOW(),
              generated_at = NOW()
      `,
      [key, make, model, yearBucket(year), JSON.stringify(data), source]
    );
  } catch {
    // Save failure — continue silently, AI cache is best-effort
  }
}

// ── Stale refresh (background, non-blocking) ──────────────────────────────────

/**
 * Checks if insight is stale and schedules a background refresh.
 * Returns the existing (stale) data immediately for fast page loads.
 */
export function scheduleRefreshIfStale(
  make: string,
  model: string,
  year: number,
  generator: () => Promise<CarModelInsights | null>
): void {
  // Non-blocking background refresh
  Promise.resolve().then(async () => {
    const existing = await getCachedInsight(make, model, year);
    if (!existing?.isStale) return;

    const fresh = await generator();
    if (fresh) {
      await saveInsightToCache(make, model, year, fresh, "ai");
    }
  }).catch(() => {
    // Background refresh failure — silent
  });
}

// ── Batch operations ──────────────────────────────────────────────────────────

export interface InsightCacheStats {
  total: number;
  stale: number;
  fresh: number;
  oldest: string | null;
}

export async function getInsightCacheStats(): Promise<InsightCacheStats> {
  try {
    const pool = getPgPool();
    const result = await pool.query<{
      total: string;
      stale: string;
      oldest: string | null;
    }>(
      `
        SELECT
          COUNT(*)::text as total,
          COUNT(*) FILTER (WHERE generated_at < NOW() - INTERVAL '${FRESHNESS_DAYS} days')::text as stale,
          MIN(generated_at)::text as oldest
        FROM model_insights
      `
    );
    const row = result.rows[0];
    const total = Number(row?.total ?? 0);
    const stale = Number(row?.stale ?? 0);
    return { total, stale, fresh: total - stale, oldest: row?.oldest ?? null };
  } catch {
    return { total: 0, stale: 0, fresh: 0, oldest: null };
  }
}

export async function listStaleInsights(limit = 20): Promise<Array<{
  id: string;
  make: string;
  model: string;
  generatedAt: Date;
}>> {
  try {
    const pool = getPgPool();
    const result = await pool.query<{
      id: string;
      make: string;
      model: string;
      generated_at: Date;
    }>(
      `
        SELECT id, make, model, generated_at
        FROM model_insights
        WHERE generated_at < NOW() - INTERVAL '${FRESHNESS_DAYS} days'
        ORDER BY generated_at ASC
        LIMIT $1
      `,
      [limit]
    );
    return result.rows.map((r) => ({
      id: r.id,
      make: r.make,
      model: r.model,
      generatedAt: r.generated_at
    }));
  } catch {
    return [];
  }
}
