import { getPgPool } from "@/lib/postgres";

const LIMIT_ANONYMOUS = 3;
const LIMIT_LOGGED_IN = 15;
const LISTING_AI_PREFIX = "listing-ai:";

export async function checkListingAiLimit(userId: string | null, ip: string) {
  const identifier = userId ? `${LISTING_AI_PREFIX}${userId}` : `${LISTING_AI_PREFIX}ip:${ip}`;
  const limit = userId ? LIMIT_LOGGED_IN : LIMIT_ANONYMOUS;
  const today = new Date().toISOString().slice(0, 10);

  try {
    const pool = getPgPool();
    const r = await pool.query<{ request_count: number }>(
      `
        SELECT request_count
        FROM ai_chat_usage
        WHERE identifier = $1 AND period_date = $2
      `,
      [identifier, today]
    );
    const count = r.rows[0]?.request_count ?? 0;
    const remaining = Math.max(0, limit - count);
    return { allowed: count < limit, remaining, limit, identifier };
  } catch {
    return { allowed: true, remaining: limit, limit, identifier };
  }
}

export async function incrementListingAiUsage(identifier: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const id = `${identifier}-${today}`;

  try {
    const pool = getPgPool();
    await pool.query(
      `
        INSERT INTO ai_chat_usage (id, identifier, period_date, request_count, updated_at)
        VALUES ($1, $2, $3, 1, NOW())
        ON CONFLICT (identifier, period_date)
        DO UPDATE SET request_count = ai_chat_usage.request_count + 1, updated_at = NOW()
      `,
      [id, identifier, today]
    );
  } catch {
    // ignore
  }
}
