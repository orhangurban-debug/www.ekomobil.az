import { Pool } from "pg";

const globalForPg = globalThis as unknown as { ekomobilPgPool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Please configure PostgreSQL connection.");
  }

  return new Pool({
    connectionString,
    max: 10
  });
}

export function getPgPool(): Pool {
  if (!globalForPg.ekomobilPgPool) {
    globalForPg.ekomobilPgPool = createPool();
  }
  return globalForPg.ekomobilPgPool;
}
