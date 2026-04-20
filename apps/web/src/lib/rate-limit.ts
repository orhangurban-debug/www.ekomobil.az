/**
 * DB-based rate limiter using PostgreSQL sliding window counters.
 * Works with serverless (each invocation shares the DB, not memory).
 *
 * Usage: await checkRateLimit("login:1.2.3.4", 5, 1) → { ok: true/false, remaining: N }
 */

import { getPgPool } from "@/lib/postgres";

/**
 * Check and increment rate limit counter.
 * key: unique identifier (e.g. "login:ip", "bid:userId:auctionId")
 * maxRequests: max allowed in windowMinutes
 * windowMinutes: sliding window size
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMinutes: number
): Promise<{ ok: boolean; remaining: number; retryAfterSeconds?: number }> {
  const now = Math.floor(Date.now() / 1000 / 60); // current minute (unix/60)
  const windowStart = now - windowMinutes + 1;

  try {
    const pool = getPgPool();

    // Atomically increment count for current minute
    await pool.query(
      `INSERT INTO security_rate_limits(key, window_minute, count)
       VALUES ($1, $2, 1)
       ON CONFLICT (key, window_minute) DO UPDATE
         SET count = security_rate_limits.count + 1`,
      [key, now]
    );

    // Sum across the window
    const result = await pool.query<{ total: string }>(
      `SELECT COALESCE(SUM(count), 0)::text AS total
       FROM security_rate_limits
       WHERE key = $1 AND window_minute >= $2`,
      [key, windowStart]
    );

    const total = Number(result.rows[0]?.total ?? 0);
    const remaining = Math.max(0, maxRequests - total);

    // Async cleanup: remove entries older than window (fire-and-forget)
    void pool.query(
      `DELETE FROM security_rate_limits WHERE window_minute < $1`,
      [windowStart - windowMinutes]
    ).catch(() => undefined);

    if (total > maxRequests) {
      return {
        ok: false,
        remaining: 0,
        retryAfterSeconds: (now + windowMinutes - Math.floor(Date.now() / 1000 / 60)) * 60
      };
    }

    return { ok: true, remaining };
  } catch (err) {
    // Fail closed by default in production to prevent bypassing abuse controls.
    const failOpen = process.env.RATE_LIMIT_FAIL_OPEN === "true" || process.env.NODE_ENV !== "production";
    if (failOpen) {
      return { ok: true, remaining: maxRequests };
    }
    // OAuth start throttling must not masquerade as user abuse when Postgres is unavailable.
    if (key.startsWith("oauth_google_start:")) {
      console.error("[rate-limit] oauth throttling skipped (database error)", err);
      return { ok: true, remaining: maxRequests };
    }
    return { ok: false, remaining: 0, retryAfterSeconds: 60 };
  }
}

/** Extract best-effort client IP from request headers */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/** Rate limit response helper */
export function rateLimitResponse(retryAfterSeconds = 60): Response {
  return new Response(
    JSON.stringify({ ok: false, error: "Çox sayda sorğu. Bir az gözləyin." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": "0",
      }
    }
  );
}
