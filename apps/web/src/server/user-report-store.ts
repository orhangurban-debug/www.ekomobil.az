import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { createIncidentCase } from "@/server/admin-incident-store";
import {
  AUTO_INCIDENT_REPORT_REASONS,
  USER_REPORT_REASON_LABELS,
  USER_REPORT_SEVERITY,
  type UserReportReason
} from "@/lib/user-reports";

export type { UserReportReason };

export type UserReportStatus =
  | "new"
  | "awaiting_reported_defense"
  | "defense_received"
  | "under_review"
  | "linked_incident"
  | "escalated_to_authorities"
  | "dismissed_false_report"
  | "resolved"
  | "triaged"
  | "dismissed";

export interface UserReportRecord {
  id: string;
  reporterUserId?: string;
  reportedUserId?: string;
  listingId?: string;
  reasonCode: UserReportReason;
  description: string;
  reporterEvidence?: string;
  reportedDefense?: string;
  defenseDueAt?: string;
  defenseSubmittedAt?: string;
  escalatedToAuthoritiesAt?: string;
  falseReportFlag?: boolean;
  status: UserReportStatus;
  incidentId?: string;
  createdAt: string;
}

const REASON_SEVERITY = USER_REPORT_SEVERITY;
const REASON_LABELS = USER_REPORT_REASON_LABELS;
const DEFENSE_WINDOW_DAYS = 7;

function mapReportRow(row: {
  id: string;
  reporter_user_id: string | null;
  reported_user_id: string | null;
  listing_id: string | null;
  reason_code: UserReportReason;
  description: string;
  reporter_evidence?: string | null;
  reported_defense?: string | null;
  defense_due_at?: Date | null;
  defense_submitted_at?: Date | null;
  escalated_to_authorities_at?: Date | null;
  false_report_flag?: boolean | null;
  status: string;
  incident_id: string | null;
  created_at: Date;
}): UserReportRecord {
  return {
    id: row.id,
    reporterUserId: row.reporter_user_id ?? undefined,
    reportedUserId: row.reported_user_id ?? undefined,
    listingId: row.listing_id ?? undefined,
    reasonCode: row.reason_code,
    description: row.description,
    reporterEvidence: row.reporter_evidence ?? undefined,
    reportedDefense: row.reported_defense ?? undefined,
    defenseDueAt: row.defense_due_at?.toISOString(),
    defenseSubmittedAt: row.defense_submitted_at?.toISOString(),
    escalatedToAuthoritiesAt: row.escalated_to_authorities_at?.toISOString(),
    falseReportFlag: row.false_report_flag ?? undefined,
    status: row.status as UserReportStatus,
    incidentId: row.incident_id ?? undefined,
    createdAt: row.created_at.toISOString()
  };
}

export async function createUserReport(input: {
  reporterUserId?: string;
  reportedUserId?: string;
  listingId?: string;
  reasonCode: UserReportReason;
  description: string;
  reporterEvidence: string;
  reporterIp?: string;
  reporterUserAgent?: string;
}): Promise<{ ok: true; report: UserReportRecord } | { ok: false; error: string }> {
  if (!input.reportedUserId && !input.listingId) {
    return { ok: false, error: "Şikayət üçün elan və ya istifadəçi göstərilməlidir." };
  }

  const id = randomUUID();
  const defenseDueAt = new Date(Date.now() + DEFENSE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  try {
    const pool = getPgPool();
    const result = await pool.query(
      `INSERT INTO user_reports (
         id, reporter_user_id, reported_user_id, listing_id, reason_code, description,
         reporter_evidence, status, defense_due_at, reporter_ip, reporter_user_agent
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'awaiting_reported_defense', $8, $9, $10)
       RETURNING *`,
      [
        id,
        input.reporterUserId ?? null,
        input.reportedUserId ?? null,
        input.listingId ?? null,
        input.reasonCode,
        input.description.trim(),
        input.reporterEvidence.trim(),
        defenseDueAt,
        input.reporterIp ?? null,
        input.reporterUserAgent ?? null
      ]
    );
    return { ok: true, report: mapReportRow(result.rows[0]) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Şikayət qeydə alınmadı"
    };
  }
}

export async function listPendingDefenseReportsForUser(userId: string): Promise<UserReportRecord[]> {
  const pool = getPgPool();
  const result = await pool.query(
    `SELECT * FROM user_reports
     WHERE reported_user_id = $1 AND status = 'awaiting_reported_defense'
     ORDER BY defense_due_at ASC NULLS LAST`,
    [userId]
  );
  return result.rows.map(mapReportRow);
}

export async function submitReportDefense(input: {
  reportId: string;
  reportedUserId: string;
  defense: string;
}): Promise<{ ok: true; report: UserReportRecord } | { ok: false; error: string }> {
  const pool = getPgPool();
  const existing = await pool.query(
    `SELECT * FROM user_reports WHERE id = $1 LIMIT 1`,
    [input.reportId]
  );
  const row = existing.rows[0];
  if (!row) return { ok: false, error: "Şikayət tapılmadı." };
  if (row.reported_user_id !== input.reportedUserId) {
    return { ok: false, error: "Bu şikayətə cavab vermək icazəniz yoxdur." };
  }
  if (row.status !== "awaiting_reported_defense") {
    return { ok: false, error: "Bu şikayət artıq cavablandırılıb və ya bağlanıb." };
  }

  await pool.query(
    `UPDATE user_reports
     SET reported_defense = $2,
         defense_submitted_at = NOW(),
         status = 'defense_received',
         updated_at = NOW()
     WHERE id = $1`,
    [input.reportId, input.defense.trim()]
  );

  let incidentId = row.incident_id as string | null;
  if (!incidentId && AUTO_INCIDENT_REPORT_REASONS.has(row.reason_code)) {
    const subjectType = row.listing_id ? "listing" : "user";
    const subjectId = row.listing_id ?? row.reported_user_id;
    const incident = await createIncidentCase({
      actorUserId: input.reportedUserId,
      reporterUserId: row.reporter_user_id ?? undefined,
      subjectType,
      subjectId,
      category: "fraud",
      severity: REASON_SEVERITY[row.reason_code as UserReportReason],
      title: `Şikayət + müdafiə: ${REASON_LABELS[row.reason_code as UserReportReason]}`,
      description: `Şikayət: ${row.description}\n\nMüdafiə: ${input.defense.trim()}`,
      metadata: {
        userReportId: row.id,
        reasonCode: row.reason_code,
        hasDefense: true
      }
    });
    incidentId = incident.id;
    await pool.query(
      `UPDATE user_reports SET incident_id = $2, status = 'under_review', updated_at = NOW() WHERE id = $1`,
      [input.reportId, incidentId]
    );
    const updated = await pool.query(`SELECT * FROM user_reports WHERE id = $1`, [input.reportId]);
    return { ok: true, report: mapReportRow(updated.rows[0]) };
  }

  await pool.query(
    `UPDATE user_reports SET status = 'under_review', updated_at = NOW() WHERE id = $1`,
    [input.reportId]
  );
  const updated = await pool.query(`SELECT * FROM user_reports WHERE id = $1`, [input.reportId]);
  return { ok: true, report: mapReportRow(updated.rows[0]) };
}

export async function escalateReportsWithoutDefense(): Promise<number> {
  const pool = getPgPool();
  const due = await pool.query(
    `SELECT * FROM user_reports
     WHERE status = 'awaiting_reported_defense'
       AND defense_due_at IS NOT NULL
       AND defense_due_at <= NOW()`
  );

  let count = 0;
  for (const row of due.rows) {
    let incidentId = row.incident_id as string | null;
    if (!incidentId) {
      const subjectType = row.listing_id ? "listing" : "user";
      const subjectId = row.listing_id ?? row.reported_user_id;
      const incident = await createIncidentCase({
        reporterUserId: row.reporter_user_id ?? undefined,
        subjectType,
        subjectId,
        category: "fraud",
        severity: REASON_SEVERITY[row.reason_code as UserReportReason],
        title: `Müdafiə verilmədi — ${REASON_LABELS[row.reason_code as UserReportReason]}`,
        description: `Şikayət edən sübut: ${row.reporter_evidence ?? row.description}\n\nMüdafiə müddəti bitdi (${DEFENSE_WINDOW_DAYS} gün).`,
        metadata: {
          userReportId: row.id,
          reasonCode: row.reason_code,
          escalatedForMissingDefense: true
        }
      });
      incidentId = incident.id;
    }

    await pool.query(
      `UPDATE user_reports
       SET status = 'escalated_to_authorities',
           incident_id = COALESCE(incident_id, $2),
           escalated_to_authorities_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [row.id, incidentId]
    );
    count += 1;
  }
  return count;
}

export async function listAdminUserReports(limit = 50): Promise<UserReportRecord[]> {
  const pool = getPgPool();
  const result = await pool.query(
    `SELECT * FROM user_reports ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows.map(mapReportRow);
}
