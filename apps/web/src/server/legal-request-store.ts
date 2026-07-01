import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";

export type LegalRequestType = "subpoena" | "court_order" | "investigation" | "emergency" | "other";
export type LegalRequestStatus =
  | "received"
  | "verification"
  | "approved"
  | "partially_disclosed"
  | "disclosed"
  | "rejected"
  | "closed";

export interface LegalDataRequestRecord {
  id: string;
  referenceNumber: string;
  authorityName: string;
  requestType: LegalRequestType;
  status: LegalRequestStatus;
  receivedAt: string;
  dueAt?: string;
  subjectUserId?: string;
  subjectListingId?: string;
  legalHoldUntil?: string;
  requestSummary: string;
  disclosureLog: unknown[];
  internalNotes?: string;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: {
  id: string;
  reference_number: string;
  authority_name: string;
  request_type: LegalRequestType;
  status: LegalRequestStatus;
  received_at: Date;
  due_at: Date | null;
  subject_user_id: string | null;
  subject_listing_id: string | null;
  legal_hold_until: Date | null;
  request_summary: string;
  disclosure_log: unknown;
  internal_notes: string | null;
  created_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
}): LegalDataRequestRecord {
  return {
    id: row.id,
    referenceNumber: row.reference_number,
    authorityName: row.authority_name,
    requestType: row.request_type,
    status: row.status,
    receivedAt: row.received_at.toISOString(),
    dueAt: row.due_at?.toISOString(),
    subjectUserId: row.subject_user_id ?? undefined,
    subjectListingId: row.subject_listing_id ?? undefined,
    legalHoldUntil: row.legal_hold_until?.toISOString(),
    requestSummary: row.request_summary,
    disclosureLog: Array.isArray(row.disclosure_log) ? row.disclosure_log : [],
    internalNotes: row.internal_notes ?? undefined,
    createdByUserId: row.created_by_user_id ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function listLegalDataRequests(limit = 50): Promise<LegalDataRequestRecord[]> {
  const pool = getPgPool();
  const result = await pool.query(
    `SELECT * FROM legal_data_requests ORDER BY received_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows.map(mapRow);
}

export async function createLegalDataRequest(input: {
  authorityName: string;
  requestType: LegalRequestType;
  requestSummary: string;
  referenceNumber?: string;
  dueAt?: string;
  subjectUserId?: string;
  subjectListingId?: string;
  legalHoldUntil?: string;
  internalNotes?: string;
  createdByUserId?: string;
}): Promise<LegalDataRequestRecord> {
  const pool = getPgPool();
  const id = randomUUID();
  const referenceNumber = input.referenceNumber?.trim() || `LE-${Date.now().toString(36).toUpperCase()}`;

  const result = await pool.query(
    `INSERT INTO legal_data_requests (
       id, reference_number, authority_name, request_type, request_summary,
       due_at, subject_user_id, subject_listing_id, legal_hold_until,
       internal_notes, created_by_user_id
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      id,
      referenceNumber,
      input.authorityName.trim(),
      input.requestType,
      input.requestSummary.trim(),
      input.dueAt ? new Date(input.dueAt) : null,
      input.subjectUserId ?? null,
      input.subjectListingId ?? null,
      input.legalHoldUntil ? new Date(input.legalHoldUntil) : null,
      input.internalNotes?.trim() ?? null,
      input.createdByUserId ?? null
    ]
  );

  if (input.subjectUserId && input.legalHoldUntil) {
    await pool.query(
      `UPDATE users
       SET legal_hold = TRUE,
           legal_hold_reason = COALESCE(legal_hold_reason, 'Hüquqi sorğu üzrə legal hold')
       WHERE id = $1`,
      [input.subjectUserId]
    );
  }

  return mapRow(result.rows[0]);
}

export async function updateLegalDataRequestStatus(input: {
  id: string;
  status: LegalRequestStatus;
  internalNotes?: string;
  disclosureEntry?: Record<string, unknown>;
}): Promise<LegalDataRequestRecord | null> {
  const pool = getPgPool();
  const disclosureEntry = input.disclosureEntry
    ? JSON.stringify([input.disclosureEntry])
    : null;

  const result = await pool.query(
    disclosureEntry
      ? `UPDATE legal_data_requests
         SET status = $2,
             internal_notes = COALESCE($3, internal_notes),
             disclosure_log = disclosure_log || $4::jsonb,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`
      : `UPDATE legal_data_requests
         SET status = $2,
             internal_notes = COALESCE($3, internal_notes),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
    disclosureEntry
      ? [input.id, input.status, input.internalNotes ?? null, disclosureEntry]
      : [input.id, input.status, input.internalNotes ?? null]
  );

  return result.rows[0] ? mapRow(result.rows[0]) : null;
}
