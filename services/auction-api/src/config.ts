function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function splitCsv(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for auction-api.`);
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV ?? "development",
  // Cloud runtimes (Railway/Render/Fly) usually inject PORT.
  port: readInt("PORT", readInt("AUCTION_API_PORT", 4001)),
  host: process.env.AUCTION_API_HOST ?? "0.0.0.0",
  databaseUrl: requireEnv("DATABASE_URL"),
  pgPoolMax: readInt("AUCTION_API_PG_POOL_MAX", 20),
  redisUrl: process.env.REDIS_URL ?? "",
  appUrl: process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  allowOrigins: splitCsv(process.env.AUCTION_API_ALLOWED_ORIGINS ?? process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL),
  internalSecret: process.env.AUCTION_API_INTERNAL_SECRET ?? "",
  heartbeatMs: readInt("AUCTION_SSE_HEARTBEAT_MS", 15000),
  antiSnipingWindowMs: readInt("AUCTION_ANTI_SNIPING_WINDOW_MS", 5 * 60 * 1000),
  antiSnipingExtensionMs: readInt("AUCTION_ANTI_SNIPING_EXTENSION_MS", 2 * 60 * 1000),
  bidHistoryLimit: readInt("AUCTION_STREAM_HISTORY_LIMIT", 50)
} as const;

if (config.env === "production" && !config.redisUrl) {
  throw new Error("REDIS_URL is required in production for auction-api.");
}

if (config.env === "production" && !config.internalSecret) {
  throw new Error("AUCTION_API_INTERNAL_SECRET is required in production.");
}
