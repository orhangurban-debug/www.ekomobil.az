#!/usr/bin/env node
/**
 * Deploy / local hazırlıq: migrasiya işlədir, .env mövcudluğunu yoxlayır.
 * Vercel Blob token yalnız Vercel UI-də yaradıla bilər — bu skript onu avtomatik yaratmır.
 *
 * İstifadə (repo kökündən):
 *   node scripts/deploy-prep.mjs
 * və ya:
 *   npm run db:migrate
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const webDir = path.join(root, "apps", "web");
const envPath = path.join(webDir, ".env");

console.log("EkoMobil deploy-prep\n");

if (!fs.existsSync(envPath)) {
  console.error("Xəta: apps/web/.env tapılmadı.");
  console.error("  apps/web/.env.example əsasında .env yaradın və DATABASE_URL daxil edin.\n");
  process.exit(1);
}

const envRaw = fs.readFileSync(envPath, "utf8");
if (!/^\s*DATABASE_URL\s*=/m.test(envRaw)) {
  console.error("Xəta: .env içində DATABASE_URL sətri yoxdur.\n");
  process.exit(1);
}

const blobSet =
  /^\s*BLOB_READ_WRITE_TOKEN\s*=\s*.+/m.test(envRaw) &&
  !/^\s*BLOB_READ_WRITE_TOKEN\s*=\s*(""|'')\s*$/m.test(envRaw);

console.log("1) PostgreSQL migrasiyası (apps/web/scripts/migrations)…\n");
const result = spawnSync("node", ["--env-file=.env", "./scripts/migrate.mjs"], {
  cwd: webDir,
  stdio: "inherit",
  env: process.env
});

if (result.status !== 0) {
  console.error(
    "\nMigrasiya alınmadı. Ən çox rast gəlinən səbəblər:\n" +
      "  • PostgreSQL işləmir (lokal: postgres servisini işə salın)\n" +
      "  • DATABASE_URL səhvdir (host, parol, sslmode)\n" +
      "  • Uzaq DB üçün firewall / IP allowlist\n"
  );
  process.exit(result.status ?? 1);
}

console.log("\n2) Yoxlama (lokal .env):\n");
console.log(`   DATABASE_URL: təyin olunub`);
console.log(
  blobSet
    ? "   BLOB_READ_WRITE_TOKEN: təyin olunub (production sənəd yükləməsi üçün Vercel-də də eyni env əlavə edin)"
    : "   BLOB_READ_WRITE_TOKEN: boş — production-da Vercel → Storage → Blob → token → Project Env"
);
console.log("\nHazırdır.\n");
