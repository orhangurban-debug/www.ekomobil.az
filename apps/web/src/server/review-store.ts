import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { ensureSeedData } from "@/server/bootstrap-seed";

export type ReviewStatus = "open" | "in_review" | "approved" | "rejected";

export interface ManualReviewCase {
  id: string;
  listingId: string;
  reasonCode: string;
  message: string;
  createdAt: string;
  status: ReviewStatus;
  reviewerId?: string;
  reviewStartedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  slaDueAt?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

interface ManualReviewRow {
  id: string;
  listing_id: string;
  reason_code: string;
  message: string;
  status: string;
  reviewer_id: string | null;
  review_started_at: Date | null;
  approved_at: Date | null;
  rejected_at: Date | null;
  sla_due_at: Date | null;
  created_at: Date;
  resolved_at: Date | null;
  resolution_note: string | null;
}

function mapRow(row: ManualReviewRow): ManualReviewCase {
  return {
    id: row.id,
    listingId: row.listing_id,
    reasonCode: row.reason_code,
    message: row.message,
    status: row.status as ReviewStatus,
    reviewerId: row.reviewer_id ?? undefined,
    reviewStartedAt: row.review_started_at?.toISOString(),
    approvedAt: row.approved_at?.toISOString(),
    rejectedAt: row.rejected_at?.toISOString(),
    slaDueAt: row.sla_due_at?.toISOString(),
    createdAt: row.created_at.toISOString(),
    resolvedAt: row.resolved_at?.toISOString(),
    resolutionNote: row.resolution_note ?? undefined
  };
}

export async function enqueueManualReview(input: {
  listingId: string;
  reasonCode: string;
  message: string;
}): Promise<ManualReviewCase> {
  await ensureSeedData();
  const pool = getPgPool();
  const result = await pool.query<ManualReviewRow>(
    `
      INSERT INTO manual_review_cases (id, listing_id, reason_code, message, status, sla_due_at)
      VALUES ($1, $2, $3, $4, 'open', NOW() + INTERVAL '24 hours')
      RETURNING id, listing_id, reason_code, message, status, reviewer_id, review_started_at, approved_at, rejected_at, sla_due_at, created_at, resolved_at, resolution_note
    `,
    [randomUUID(), input.listingId, input.reasonCode, input.message]
  );
  return mapRow(result.rows[0]);
}

export async function listManualReviews(): Promise<ManualReviewCase[]> {
  await ensureSeedData();
  const pool = getPgPool();
  const result = await pool.query<ManualReviewRow>(
    `
      SELECT id, listing_id, reason_code, message, status, reviewer_id, review_started_at, approved_at, rejected_at, sla_due_at, created_at, resolved_at, resolution_note
      FROM manual_review_cases
      ORDER BY created_at DESC
    `
  );
  return result.rows.map(mapRow);
}

export async function startManualReview(id: string, reviewerId: string): Promise<ManualReviewCase | null> {
  await ensureSeedData();
  const pool = getPgPool();
  const result = await pool.query<ManualReviewRow>(
    `
      UPDATE manual_review_cases
      SET status = 'in_review', reviewer_id = $2, review_started_at = NOW()
      WHERE id = $1
      RETURNING id, listing_id, reason_code, message, status, reviewer_id, review_started_at, approved_at, rejected_at, sla_due_at, created_at, resolved_at, resolution_note
    `,
    [id, reviewerId]
  );
  if (result.rowCount === 0) return null;
  return mapRow(result.rows[0]);
}

export async function resolveManualReview(
  id: string,
  resolutionNote: string,
  status: Exclude<ReviewStatus, "open"> = "approved",
  reviewerId?: string
): Promise<ManualReviewCase | null> {
  await ensureSeedData();
  const pool = getPgPool();
  const result = await pool.query<ManualReviewRow>(
    `
      UPDATE manual_review_cases
      SET
        status = $2,
        reviewer_id = COALESCE($4, reviewer_id),
        review_started_at = COALESCE(review_started_at, NOW()),
        approved_at = CASE WHEN $2 = 'approved' THEN NOW() ELSE approved_at END,
        rejected_at = CASE WHEN $2 = 'rejected' THEN NOW() ELSE rejected_at END,
        resolved_at = NOW(),
        resolution_note = $3
      WHERE id = $1
      RETURNING id, listing_id, reason_code, message, status, reviewer_id, review_started_at, approved_at, rejected_at, sla_due_at, created_at, resolved_at, resolution_note
    `,
    [id, status, resolutionNote, reviewerId ?? null]
  );
  if (result.rowCount === 0) return null;
  return mapRow(result.rows[0]);
}
