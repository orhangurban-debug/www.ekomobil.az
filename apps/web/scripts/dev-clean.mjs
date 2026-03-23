#!/usr/bin/env node
/**
 * Köhnə Next.js proseslərini dayandırır, lock faylını silir və dev serveri işə salır.
 */
import { execSync, spawnSync } from "node:child_process";
import { unlinkSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCK_FILE = path.join(__dirname, "..", ".next", "dev", "lock");
const PORTS = [3000, 3001];

function killPort(port) {
  try {
    const out = execSync(`lsof -ti:${port} 2>/dev/null || true`, { encoding: "utf8" }).trim();
    if (!out) return;
    const pids = out.split(/\s+/).filter(Boolean);
    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: "pipe" });
        console.log(`Port ${port} təmizləndi (PID: ${pid})`);
      } catch {
        // icazə olmaya bilər
      }
    }
  } catch {
    // Port boşdur
  }
}

if (existsSync(LOCK_FILE)) {
  try {
    unlinkSync(LOCK_FILE);
    console.log("Lock faylı silindi");
  } catch (e) {
    console.warn("Lock silinə bilmədi:", e.message);
  }
}

PORTS.forEach(killPort);

// Cache təmizlə (404 düzəltmək üçün)
const nextDir = path.join(__dirname, "..", ".next");
if (existsSync(nextDir)) {
  try {
    rmSync(nextDir, { recursive: true });
    console.log("Cache təmizləndi");
  } catch {
    // ignore
  }
}

console.log("Dev server başladılır...\n");
spawnSync("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, "..")
});
