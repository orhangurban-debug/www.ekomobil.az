import { getPgPool } from "@/lib/postgres";

export type AdRequestStatus = "pending" | "contacted" | "approved" | "declined" | "cancelled";

export interface AdRequestRecord {
  id: string;
  slotId: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  websiteUrl: string | null;
  message: string | null;
  budgetAzn: number | null;
  durationDays: number | null;
  isWaitlist: boolean;
  status: AdRequestStatus;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdRequestInput {
  slotId: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  message?: string;
  budgetAzn?: number;
  durationDays?: number;
  isWaitlist?: boolean;
}

interface AdRequestRow {
  id: string;
  slot_id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  website_url: string | null;
  message: string | null;
  budget_azn: string | null;
  duration_days: number | null;
  is_waitlist: boolean;
  status: string;
  admin_note: string | null;
  created_at: Date;
  updated_at: Date;
}

async function ensureTable(): Promise<void> {
  const pool = getPgPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ad_requests (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slot_id          TEXT NOT NULL,
      company_name     TEXT NOT NULL,
      contact_name     TEXT NOT NULL,
      contact_email    TEXT NOT NULL,
      contact_phone    TEXT,
      website_url      TEXT,
      message          TEXT,
      budget_azn       NUMERIC(10,2),
      duration_days    INT,
      is_waitlist      BOOLEAN NOT NULL DEFAULT FALSE,
      status           TEXT NOT NULL DEFAULT 'pending',
      admin_note       TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS ad_requests_status_idx ON ad_requests (status, created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS ad_requests_slot_idx ON ad_requests (slot_id, created_at DESC)`);
}

function mapRow(row: AdRequestRow): AdRequestRecord {
  return {
    id: row.id,
    slotId: row.slot_id,
    companyName: row.company_name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone ?? null,
    websiteUrl: row.website_url ?? null,
    message: row.message ?? null,
    budgetAzn: row.budget_azn != null ? Number(row.budget_azn) : null,
    durationDays: row.duration_days ?? null,
    isWaitlist: row.is_waitlist,
    status: row.status as AdRequestStatus,
    adminNote: row.admin_note ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function createAdRequest(input: CreateAdRequestInput): Promise<AdRequestRecord> {
  await ensureTable();
  const pool = getPgPool();
  const result = await pool.query<AdRequestRow>(
    `INSERT INTO ad_requests (
      slot_id, company_name, contact_name, contact_email,
      contact_phone, website_url, message, budget_azn,
      duration_days, is_waitlist
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *`,
    [
      input.slotId,
      input.companyName.trim().slice(0, 200),
      input.contactName.trim().slice(0, 200),
      input.contactEmail.trim().toLowerCase().slice(0, 200),
      input.contactPhone?.trim().slice(0, 50) ?? null,
      input.websiteUrl?.trim().slice(0, 500) ?? null,
      input.message?.trim().slice(0, 2000) ?? null,
      input.budgetAzn ?? null,
      input.durationDays ?? null,
      input.isWaitlist ?? false
    ]
  );
  return mapRow(result.rows[0]);
}

export async function listAdRequests(opts: {
  status?: AdRequestStatus;
  limit?: number;
  offset?: number;
}): Promise<{ items: AdRequestRecord[]; total: number }> {
  await ensureTable();
  const pool = getPgPool();
  const limit = Math.min(opts.limit ?? 50, 200);
  const offset = opts.offset ?? 0;

  if (opts.status) {
    const [rows, countRow] = await Promise.all([
      pool.query<AdRequestRow>(
        `SELECT * FROM ad_requests WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [opts.status, limit, offset]
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ad_requests WHERE status = $1`,
        [opts.status]
      )
    ]);
    return {
      items: rows.rows.map(mapRow),
      total: Number(countRow.rows[0].count)
    };
  }

  const [rows, countRow] = await Promise.all([
    pool.query<AdRequestRow>(
      `SELECT * FROM ad_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ad_requests`)
  ]);
  return {
    items: rows.rows.map(mapRow),
    total: Number(countRow.rows[0].count)
  };
}

export async function updateAdRequestStatus(
  id: string,
  status: AdRequestStatus,
  adminNote?: string
): Promise<AdRequestRecord | null> {
  await ensureTable();
  const pool = getPgPool();
  const result = await pool.query<AdRequestRow>(
    `UPDATE ad_requests
     SET status = $1, admin_note = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, adminNote ?? null, id]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function countPendingAdRequests(): Promise<number> {
  await ensureTable();
  const pool = getPgPool();
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ad_requests WHERE status = 'pending'`
  );
  return Number(result.rows[0].count);
}
