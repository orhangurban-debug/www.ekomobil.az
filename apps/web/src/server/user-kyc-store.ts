import { getPgPool } from "@/lib/postgres";

export type DeepKycStatus = "not_submitted" | "submitted" | "approved" | "rejected";

interface UserKycRow {
  user_id: string;
  kyc_level: string;
  status: string;
  legal_name: string | null;
  national_id_last4: string | null;
  document_ref: string | null;
  submitted_at: Date | null;
  reviewed_at: Date | null;
  reviewed_by_user_id: string | null;
  review_note: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserKycProfile {
  userId: string;
  level: "basic" | "deep";
  status: DeepKycStatus;
  legalName?: string;
  nationalIdLast4?: string;
  documentRef?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedByUserId?: string;
  reviewNote?: string;
  updatedAt: string;
}

function mapRow(row: UserKycRow): UserKycProfile {
  return {
    userId: row.user_id,
    level: row.kyc_level === "deep" ? "deep" : "basic",
    status: (row.status as DeepKycStatus) ?? "not_submitted",
    legalName: row.legal_name ?? undefined,
    nationalIdLast4: row.national_id_last4 ?? undefined,
    documentRef: row.document_ref ?? undefined,
    submittedAt: row.submitted_at?.toISOString(),
    reviewedAt: row.reviewed_at?.toISOString(),
    reviewedByUserId: row.reviewed_by_user_id ?? undefined,
    reviewNote: row.review_note ?? undefined,
    updatedAt: row.updated_at.toISOString()
  };
}

export async function getUserKycProfile(userId: string): Promise<UserKycProfile | null> {
  try {
    const pool = getPgPool();
    const result = await pool.query<UserKycRow>(
      `SELECT * FROM user_kyc_profiles WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch {
    return null;
  }
}

export async function getDeepKycStatus(userId: string): Promise<DeepKycStatus> {
  const profile = await getUserKycProfile(userId);
  return profile?.status ?? "not_submitted";
}

export async function submitDeepKyc(input: {
  userId: string;
  legalName: string;
  nationalIdLast4: string;
  documentRef?: string;
}): Promise<UserKycProfile> {
  const pool = getPgPool();
  const result = await pool.query<UserKycRow>(
    `INSERT INTO user_kyc_profiles (
       user_id, kyc_level, status, legal_name, national_id_last4, document_ref, submitted_at, updated_at
     )
     VALUES ($1, 'deep', 'submitted', $2, $3, $4, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       kyc_level = 'deep',
       status = 'submitted',
       legal_name = EXCLUDED.legal_name,
       national_id_last4 = EXCLUDED.national_id_last4,
       document_ref = EXCLUDED.document_ref,
       submitted_at = NOW(),
       reviewed_at = NULL,
       reviewed_by_user_id = NULL,
       review_note = NULL,
       updated_at = NOW()
     RETURNING *`,
    [input.userId, input.legalName, input.nationalIdLast4, input.documentRef ?? null]
  );
  return mapRow(result.rows[0]);
}

export async function reviewDeepKyc(input: {
  reviewerUserId: string;
  userId: string;
  decision: "approved" | "rejected";
  note?: string;
}): Promise<UserKycProfile | null> {
  const pool = getPgPool();
  const result = await pool.query<UserKycRow>(
    `UPDATE user_kyc_profiles
     SET status = $2,
         reviewed_at = NOW(),
         reviewed_by_user_id = $3,
         review_note = $4,
         updated_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [input.userId, input.decision, input.reviewerUserId, input.note ?? null]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}
