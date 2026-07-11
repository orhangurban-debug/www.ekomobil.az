import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";

export type ServiceInquiryStage = "new" | "contacted" | "visit_booked" | "closed";

export interface ServiceInquiryRecord {
  id: string;
  serviceListingId: string;
  serviceName: string;
  serviceSlug: string;
  ownerUserId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  preferredDate?: string;
  note?: string;
  stage: ServiceInquiryStage;
  responseTimeMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

interface InquiryRow {
  id: string;
  service_listing_id: string | null;
  owner_user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  preferred_date: Date | null;
  note: string | null;
  stage: string;
  response_time_minutes: number | null;
  created_at: Date;
  updated_at: Date;
  service_name?: string | null;
  service_slug?: string | null;
}

let inquirySchemaEnsured = false;

async function ensureInquirySchema(): Promise<void> {
  if (inquirySchemaEnsured) return;
  try {
    const pool = getPgPool();
    await pool.query(`
      ALTER TABLE inspection_requests
        ADD COLUMN IF NOT EXISTS service_listing_id TEXT NULL,
        ADD COLUMN IF NOT EXISTS owner_user_id TEXT NULL,
        ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'new',
        ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER NULL,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      CREATE INDEX IF NOT EXISTS idx_inspection_requests_owner
        ON inspection_requests (owner_user_id, created_at DESC);
    `);
    inquirySchemaEnsured = true;
  } catch {
    // migration 061 is source of truth
  }
}

function mapRow(row: InquiryRow): ServiceInquiryRecord {
  return {
    id: row.id,
    serviceListingId: row.service_listing_id ?? "",
    serviceName: row.service_name ?? "Servis",
    serviceSlug: row.service_slug ?? "",
    ownerUserId: row.owner_user_id ?? undefined,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email ?? undefined,
    preferredDate: row.preferred_date?.toISOString().slice(0, 10),
    note: row.note ?? undefined,
    stage: row.stage as ServiceInquiryStage,
    responseTimeMinutes: row.response_time_minutes ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function createServiceInquiry(input: {
  serviceListingId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  preferredDate?: string;
  note?: string;
}): Promise<void> {
  await ensureInquirySchema();
  const pool = getPgPool();
  const service = await pool.query<{ owner_user_id: string | null; status: string }>(
    `SELECT owner_user_id, status FROM service_listings WHERE id = $1 LIMIT 1`,
    [input.serviceListingId]
  );
  const row = service.rows[0];
  if (!row || row.status !== "approved") {
    throw new Error("Servis profili tapılmadı və ya aktiv deyil.");
  }

  await pool.query(
    `INSERT INTO inspection_requests (
       id, service_listing_id, owner_user_id, customer_name, customer_phone,
       customer_email, preferred_date, note, status, stage
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, 'pending', 'new')`,
    [
      randomUUID(),
      input.serviceListingId,
      row.owner_user_id,
      input.customerName.trim(),
      input.customerPhone.trim(),
      input.customerEmail?.trim() || null,
      input.preferredDate || null,
      input.note?.trim() || null
    ]
  );
}

export async function listServiceInquiriesForOwner(ownerUserId: string): Promise<ServiceInquiryRecord[]> {
  await ensureInquirySchema();
  const pool = getPgPool();
  const result = await pool.query<InquiryRow>(
    `SELECT ir.*, sl.name AS service_name, sl.slug AS service_slug
     FROM inspection_requests ir
     LEFT JOIN service_listings sl ON sl.id = ir.service_listing_id
     WHERE ir.owner_user_id = $1
     ORDER BY ir.created_at DESC`,
    [ownerUserId]
  );
  return result.rows.map(mapRow);
}

export async function updateServiceInquiryStage(input: {
  inquiryId: string;
  ownerUserId: string;
  stage: ServiceInquiryStage;
  note?: string;
}): Promise<boolean> {
  await ensureInquirySchema();
  const pool = getPgPool();
  const result = await pool.query(
    `UPDATE inspection_requests
     SET
       stage = $2,
       note = COALESCE($3, note),
       updated_at = NOW(),
       status = CASE WHEN $2 = 'closed' THEN 'closed' ELSE status END,
       response_time_minutes = CASE
         WHEN stage = 'new' AND $2 <> 'new' AND response_time_minutes IS NULL
         THEN ROUND(EXTRACT(EPOCH FROM (NOW() - created_at)) / 60)::integer
         ELSE response_time_minutes
       END
     WHERE id = $1 AND owner_user_id = $4`,
    [input.inquiryId, input.stage, input.note ?? null, input.ownerUserId]
  );
  return (result.rowCount ?? 0) > 0;
}
