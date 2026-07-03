import { Pool, type QueryResult, type QueryResultRow } from "pg";

const globalForPg = globalThis as unknown as { ekomobilPgPool?: Pool };

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Neon (və bənzər serverless Postgres) pooler-i, aktiv istifadə olunmayan backend
 * bağlantılarını app-ın xəbəri olmadan istənilən vaxt bağlaya bilər (compute auto-suspend,
 * pooler-in öz idle timeout-u və s.). Bu zaman `pg.Pool`-dakı "boş" (idle) client hələ də
 * sağlam görünür, amma növbəti sorğu ilə "Connection terminated unexpectedly" / "57P01" kimi
 * keçici bir xəta atır. Çağıran tərəflərin əksəriyyəti bu xətanı sükutla udub `null`/`[]`
 * qaytarır (bax: `service-listing-store.ts`, `listing-store.ts` və s.), yəni sadə bir şəbəkə
 * kəsilməsi istifadəçiyə YANLIŞ "404 tapılmadı" kimi görünür. Bunun qarşısını almaq üçün
 * keçici bağlantı xətalarında sorğunu BİR DƏFƏ avtomatik təkrarlayırıq (təzə client ilə).
 */
function isTransientConnectionError(err: unknown): boolean {
  const code = (err as { code?: string } | undefined)?.code;
  const message = err instanceof Error ? err.message : String(err);
  return (
    code === "ECONNRESET" ||
    code === "EPIPE" ||
    code === "57P01" || // admin_shutdown
    code === "08006" || // connection_failure
    code === "08003" || // connection_does_not_exist
    code === "08000" || // connection_exception
    /Connection terminated unexpectedly/i.test(message) ||
    /terminating connection/i.test(message) ||
    /server closed the connection/i.test(message)
  );
}

function attachResilience(pool: Pool): void {
  // Node-postgres tələb edir ki, pool-un idle client-lərində 'error' listener olsun —
  // əks halda arxa fon şəbəkə xətası tutulmamış istisna kimi bütün prosesi çökdürə bilər.
  pool.on("error", (err) => {
    console.error("Unexpected error on idle PG client (pool kept alive):", err);
  });

  const originalQuery = pool.query.bind(pool);
  pool.query = ((...args: Parameters<typeof pool.query>) => {
    const run = () => (originalQuery as (...a: unknown[]) => Promise<QueryResult<QueryResultRow>>)(...args);
    return run().catch((err: unknown) => {
      if (!isTransientConnectionError(err)) throw err;
      console.warn("PG query failed due to a transient connection error, retrying once:", err);
      return run();
    });
  }) as typeof pool.query;
}

function createPool(): Pool {
  const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Please configure PostgreSQL connection.");
  }

  const pool = new Pool({
    connectionString,
    max: readPositiveInt("PG_POOL_MAX", 10),
    idleTimeoutMillis: readPositiveInt("PG_IDLE_TIMEOUT_MS", 30000),
    connectionTimeoutMillis: readPositiveInt("PG_CONNECTION_TIMEOUT_MS", 5000),
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
  });
  attachResilience(pool);
  return pool;
}

function normalizeDatabaseUrl(raw?: string): string | undefined {
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    const mode = (url.searchParams.get("sslmode") ?? "").toLowerCase();
    const hasLibpqCompat = url.searchParams.has("uselibpqcompat");
    // Keep secure defaults stable across upcoming pg/libpq behavior change.
    if ((mode === "prefer" || mode === "require" || mode === "verify-ca") && !hasLibpqCompat) {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    // Fallback for non-URL DSN formats
    return raw;
  }
}

export function getPgPool(): Pool {
  if (!globalForPg.ekomobilPgPool) {
    globalForPg.ekomobilPgPool = createPool();
  }
  return globalForPg.ekomobilPgPool;
}
