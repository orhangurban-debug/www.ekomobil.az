import { AnalyticsEvent } from "@/lib/analytics/events";
import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";

interface AnalyticsRow {
  event_name: string;
  event_timestamp: Date;
  payload: Record<string, unknown>;
}

export async function ingestAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `
      INSERT INTO analytics_events (id, event_name, event_timestamp, payload)
      VALUES ($1, $2, $3, $4::jsonb)
    `,
    [randomUUID(), event.eventName, event.timestamp, JSON.stringify(event.payload)]
  );
}

export async function listAnalyticsEvents(limit = 200): Promise<AnalyticsEvent[]> {
  const pool = getPgPool();
  const result = await pool.query<AnalyticsRow>(
    `
      SELECT event_name, event_timestamp, payload
      FROM analytics_events
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows.map((row) => ({
    eventName: row.event_name as AnalyticsEvent["eventName"],
    timestamp: row.event_timestamp.toISOString(),
    payload: row.payload
  }));
}
