import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";

export interface AdminAuditLogRecord {
  id: string;
  actorUserId?: string;
  actorRole?: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  reason?: string;
  beforeState?: unknown;
  afterState?: unknown;
  metadata?: unknown;
  createdAt: string;
}

interface AdminAuditLogRow {
  id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  reason: string | null;
  before_state: unknown | null;
  after_state: unknown | null;
  metadata: unknown | null;
  created_at: Date;
}

function mapAuditRow(row: AdminAuditLogRow): AdminAuditLogRecord {
  return {
    id: row.id,
    actorUserId: row.actor_user_id ?? undefined,
    actorRole: row.actor_role ?? undefined,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id ?? undefined,
    reason: row.reason ?? undefined,
    beforeState: row.before_state ?? undefined,
    afterState: row.after_state ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at.toISOString()
  };
}

export async function createAdminAuditLog(input: {
  actorUserId?: string;
  actorRole?: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  reason?: string;
  beforeState?: unknown;
  afterState?: unknown;
  metadata?: unknown;
}): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `INSERT INTO admin_audit_logs (
      id, actor_user_id, actor_role, action_type, entity_type, entity_id, reason, before_state, after_state, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb)`,
    [
      randomUUID(),
      input.actorUserId ?? null,
      input.actorRole ?? null,
      input.actionType,
      input.entityType,
      input.entityId ?? null,
      input.reason ?? null,
      JSON.stringify(input.beforeState ?? null),
      JSON.stringify(input.afterState ?? null),
      JSON.stringify(input.metadata ?? null)
    ]
  );
}

export async function listAdminAuditLogs(input: {
  page?: number;
  pageSize?: number;
  entityType?: string;
  actionType?: string;
  actorUserId?: string;
  q?: string;
}): Promise<{ items: AdminAuditLogRecord[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, input.pageSize ?? 25));
  const offset = (page - 1) * pageSize;
  const where: string[] = [];
  const values: Array<string | number> = [];

  if (input.entityType) {
    values.push(input.entityType);
    where.push(`entity_type = $${values.length}`);
  }
  if (input.actionType) {
    values.push(input.actionType);
    where.push(`action_type = $${values.length}`);
  }
  if (input.actorUserId) {
    values.push(input.actorUserId);
    where.push(`actor_user_id = $${values.length}`);
  }
  if (input.q?.trim()) {
    values.push(`%${input.q.trim().toLowerCase()}%`);
    where.push(`(
      LOWER(action_type) LIKE $${values.length}
      OR LOWER(entity_type) LIKE $${values.length}
      OR LOWER(COALESCE(reason, '')) LIKE $${values.length}
    )`);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const pool = getPgPool();
  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM admin_audit_logs ${whereSql}`,
    values
  );
  values.push(pageSize, offset);
  const listResult = await pool.query<AdminAuditLogRow>(
    `SELECT *
     FROM admin_audit_logs
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  const total = Number(countResult.rows[0]?.total ?? 0);
  return {
    items: listResult.rows.map(mapAuditRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}
