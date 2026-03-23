import { Pool } from "pg";

const globalForPg = globalThis as unknown as { ekomobilPgPool?: Pool };

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Please configure PostgreSQL connection.");
  }

  return new Pool({
    connectionString,
    max: readPositiveInt("PG_POOL_MAX", 10),
    idleTimeoutMillis: readPositiveInt("PG_IDLE_TIMEOUT_MS", 30000),
    connectionTimeoutMillis: readPositiveInt("PG_CONNECTION_TIMEOUT_MS", 5000)
  });
}

export function getPgPool(): Pool {
  if (!globalForPg.ekomobilPgPool) {
    globalForPg.ekomobilPgPool = createPool();
  }
  return globalForPg.ekomobilPgPool;
}
