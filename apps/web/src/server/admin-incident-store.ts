import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { listAuctionOpsCases } from "@/server/auction-ops-store";
import { listManualReviews } from "@/server/review-store";

export type IncidentStatus = "open" | "triage" | "in_review" | "actioned" | "resolved" | "dismissed";

export interface AdminIncidentCase {
  id: string;
  sourceType: "incident" | "manual_review" | "auction_case";
  subjectType: string;
  subjectId: string;
  category: string;
  severity: string;
  status: string;
  title: string;
  description?: string;
  assignedToUserId?: string;
  reporterUserId?: string;
  openedAt: string;
  resolvedAt?: string;
  metadata?: unknown;
}

interface IncidentCaseRow {
  id: string;
  subject_type: string;
  subject_id: string;
  category: string;
  severity: string;
  status: string;
  source: string;
  reporter_user_id: string | null;
  assigned_to_user_id: string | null;
  title: string;
  description: string | null;
  metadata: unknown | null;
  opened_at: Date;
  resolved_at: Date | null;
}

function mapIncidentRow(row: IncidentCaseRow): AdminIncidentCase {
  return {
    id: row.id,
    sourceType: "incident",
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    category: row.category,
    severity: row.severity,
    status: row.status,
    title: row.title,
    description: row.description ?? undefined,
    assignedToUserId: row.assigned_to_user_id ?? undefined,
    reporterUserId: row.reporter_user_id ?? undefined,
    openedAt: row.opened_at.toISOString(),
    resolvedAt: row.resolved_at?.toISOString(),
    metadata: row.metadata ?? undefined
  };
}

export async function createIncidentCase(input: {
  actorUserId?: string;
  subjectType: string;
  subjectId: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description?: string;
  reporterUserId?: string;
  metadata?: unknown;
}): Promise<AdminIncidentCase> {
  const pool = getPgPool();
  const id = randomUUID();
  const result = await pool.query<IncidentCaseRow>(
    `INSERT INTO incident_cases (
      id, subject_type, subject_id, category, severity, status, source, reporter_user_id, assigned_to_user_id, title, description, metadata
    )
    VALUES ($1, $2, $3, $4, $5, 'open', 'admin', $6, $7, $8, $9, $10::jsonb)
    RETURNING *`,
    [
      id,
      input.subjectType,
      input.subjectId,
      input.category,
      input.severity,
      input.reporterUserId ?? null,
      input.actorUserId ?? null,
      input.title,
      input.description ?? null,
      JSON.stringify(input.metadata ?? null)
    ]
  );
  await pool.query(
    `INSERT INTO incident_events (id, incident_id, actor_user_id, event_type, note, after_state)
     VALUES ($1, $2, $3, 'created', $4, $5::jsonb)`,
    [randomUUID(), id, input.actorUserId ?? null, input.title, JSON.stringify({ status: "open" })]
  );
  return mapIncidentRow(result.rows[0]);
}

export async function updateIncidentCase(input: {
  incidentId: string;
  actorUserId?: string;
  status?: IncidentStatus;
  assignedToUserId?: string | null;
  resolutionNote?: string;
  note?: string;
}): Promise<AdminIncidentCase | null> {
  const pool = getPgPool();
  const before = await pool.query<IncidentCaseRow>(`SELECT * FROM incident_cases WHERE id = $1 LIMIT 1`, [input.incidentId]);
  if (!before.rows[0]) return null;
  const prev = before.rows[0];
  const resolvedAt = input.status && (input.status === "resolved" || input.status === "dismissed") ? "NOW()" : "resolved_at";
  const next = await pool.query<IncidentCaseRow>(
    `UPDATE incident_cases
     SET
       status = COALESCE($2, status),
       assigned_to_user_id = CASE WHEN $3::text IS NULL THEN assigned_to_user_id ELSE $3 END,
       resolution_note = COALESCE($4, resolution_note),
       resolved_at = ${resolvedAt},
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [input.incidentId, input.status ?? null, input.assignedToUserId ?? null, input.resolutionNote ?? null]
  );
  const row = next.rows[0];
  await pool.query(
    `INSERT INTO incident_events (id, incident_id, actor_user_id, event_type, note, before_state, after_state)
     VALUES ($1, $2, $3, 'status_changed', $4, $5::jsonb, $6::jsonb)`,
    [
      randomUUID(),
      input.incidentId,
      input.actorUserId ?? null,
      input.note ?? input.resolutionNote ?? "Incident update",
      JSON.stringify({ status: prev.status, assignedToUserId: prev.assigned_to_user_id }),
      JSON.stringify({ status: row.status, assignedToUserId: row.assigned_to_user_id })
    ]
  );
  return mapIncidentRow(row);
}

export async function listIncidentInbox(input: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  severity?: string;
  sourceType?: "incident" | "manual_review" | "auction_case" | "all";
}): Promise<{ items: AdminIncidentCase[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, input.pageSize ?? 25));
  const pool = getPgPool();

  const where: string[] = [];
  const values: Array<string | number> = [];
  if (input.status) {
    values.push(input.status);
    where.push(`status = $${values.length}`);
  }
  if (input.severity) {
    values.push(input.severity);
    where.push(`severity = $${values.length}`);
  }
  if (input.q?.trim()) {
    values.push(`%${input.q.trim().toLowerCase()}%`);
    where.push(`(
      LOWER(title) LIKE $${values.length}
      OR LOWER(COALESCE(description, '')) LIKE $${values.length}
      OR LOWER(subject_id) LIKE $${values.length}
      OR LOWER(category) LIKE $${values.length}
    )`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM incident_cases ${whereSql}`,
    values
  );
  const offset = (page - 1) * pageSize;
  const listValues = [...values, pageSize, offset];
  const baseRows = await pool.query<IncidentCaseRow>(
    `SELECT *
     FROM incident_cases
     ${whereSql}
     ORDER BY opened_at DESC
     LIMIT $${listValues.length - 1} OFFSET $${listValues.length}`,
    listValues
  );
  const items = baseRows.rows.map(mapIncidentRow);

  if (input.sourceType && input.sourceType !== "all" && input.sourceType !== "incident") {
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }
  if (input.sourceType === "incident") {
    const total = Number(countResult.rows[0]?.total ?? 0);
    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  // Derived cases for unified inbox (manual reviews + auction ops)
  const [manualReviews, auctionCases] = await Promise.all([
    listManualReviews(),
    listAuctionOpsCases()
  ]);
  const derived: AdminIncidentCase[] = [
    ...manualReviews
      .filter((row) => row.status === "open" || row.status === "in_review")
      .map((row) => ({
        id: `review:${row.id}`,
        sourceType: "manual_review" as const,
        subjectType: "listing",
        subjectId: row.listingId,
        category: row.reasonCode.toLowerCase(),
        severity: row.reasonCode.includes("HIGH") ? "high" : "medium",
        status: row.status,
        title: `Manual review: ${row.reasonCode}`,
        description: row.message,
        assignedToUserId: row.reviewerId,
        openedAt: row.createdAt,
        metadata: { originalId: row.id }
      })),
    ...auctionCases.map((row) => ({
      id: `auction:${row.auctionId}:${row.reasonCode}`,
      sourceType: "auction_case" as const,
      subjectType: "auction",
      subjectId: row.auctionId,
      category: row.reasonCode.toLowerCase(),
      severity: row.reasonCode === "DISPUTE" ? "high" : "medium",
      status: row.status,
      title: `Auction case: ${row.reasonCode}`,
      description: row.message,
      openedAt: row.createdAt,
      metadata: { auctionId: row.auctionId, reasonCode: row.reasonCode, slaDueAt: row.slaDueAt }
    }))
  ];
  const sourceFilter = input.sourceType;
  const filteredDerived = derived.filter((item) => {
    if (sourceFilter && sourceFilter !== "all" && item.sourceType !== sourceFilter) return false;
    if (input.status && item.status !== input.status) return false;
    if (input.severity && item.severity !== input.severity) return false;
    if (input.q?.trim()) {
      const term = input.q.trim().toLowerCase();
      return `${item.title} ${item.description ?? ""} ${item.subjectId} ${item.category}`.toLowerCase().includes(term);
    }
    return true;
  });

  const merged = [...items, ...filteredDerived].sort((a, b) => (a.openedAt < b.openedAt ? 1 : -1));
  const mergedTotal = Number(countResult.rows[0]?.total ?? 0) + filteredDerived.length;
  const start = (page - 1) * pageSize;
  const paged = merged.slice(start, start + pageSize);
  return {
    items: paged,
    total: mergedTotal,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(mergedTotal / pageSize))
  };
}
