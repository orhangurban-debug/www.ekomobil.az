import { createHash } from "node:crypto";
import { getPgPool } from "@/lib/postgres";

export function hashClientIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`ekomobil-activity:${ip}`).digest("hex").slice(0, 32);
}

export async function recordUserActivity(input: {
  userId?: string | null;
  actionType: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO user_activity_logs (user_id, action_type, entity_type, entity_id, ip_hash, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        input.userId ?? null,
        input.actionType,
        input.entityType ?? null,
        input.entityId ?? null,
        hashClientIp(input.ipAddress),
        input.userAgent ?? null,
        JSON.stringify(input.metadata ?? {})
      ]
    );
  } catch {
    // Activity logging must not block primary flows.
  }
}
