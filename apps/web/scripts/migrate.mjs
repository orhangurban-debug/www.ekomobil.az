import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, "migrations");
  const files = await readdir(migrationsDir);
  return files.filter((f) => f.endsWith(".sql")).sort().map((f) => path.join(migrationsDir, f));
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Provide PostgreSQL URL in apps/web/.env");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await ensureMigrationsTable(client);
    const files = await getMigrationFiles();
    for (const fullPath of files) {
      const version = path.basename(fullPath);
      const already = await client.query("SELECT 1 FROM schema_migrations WHERE version = $1", [version]);
      if (already.rowCount > 0) {
        console.log(`skip ${version}`);
        continue;
      }

      const sql = await readFile(fullPath, "utf8");
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(version) VALUES ($1)", [version]);
      await client.query("COMMIT");
      console.log(`applied ${version}`);
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
