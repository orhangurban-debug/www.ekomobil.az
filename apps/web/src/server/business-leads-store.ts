import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import type { LeadRecord } from "@/lib/marketplace-types";
import { ensureSeedData } from "@/server/bootstrap-seed";
import { getEffectiveDealerPlan } from "@/server/business-plan-store";

export type BusinessLeadType = "dealer" | "parts_store";

export class LeadInboxLimitError extends Error {
  constructor(limit: number) {
    super(`Lead qutusu limitinə çatdınız (maksimum ${limit}).`);
    this.name = "LeadInboxLimitError";
  }
}

interface LeadRow {
  id: string;
  listing_id: string;
  dealer_profile_id: string | null;
  owner_user_id: string | null;
  business_type: string | null;
  buyer_user_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  note: string | null;
  stage: string;
  source: string;
  response_time_minutes: number | null;
  created_at: Date;
  updated_at: Date;
  listing_title?: string | null;
}

let leadsSchemaEnsured = false;

async function ensureLeadsSchema(): Promise<void> {
  if (leadsSchemaEnsured) return;
  try {
    const pool = getPgPool();
    await pool.query(`
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS owner_user_id TEXT NULL,
        ADD COLUMN IF NOT EXISTS business_type TEXT NULL;
      CREATE INDEX IF NOT EXISTS idx_leads_owner_business
        ON leads (owner_user_id, business_type, created_at DESC);
    `);
    leadsSchemaEnsured = true;
  } catch {
    // migration 061 is source of truth
  }
}

function mapLead(row: LeadRow): LeadRecord & { listingTitle?: string; businessType?: BusinessLeadType } {
  return {
    id: row.id,
    listingId: row.listing_id,
    dealerProfileId: row.dealer_profile_id ?? undefined,
    buyerUserId: row.buyer_user_id ?? undefined,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? undefined,
    customerEmail: row.customer_email ?? undefined,
    note: row.note ?? undefined,
    stage: row.stage as LeadRecord["stage"],
    source: row.source,
    responseTimeMinutes: row.response_time_minutes ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    listingTitle: row.listing_title ?? undefined,
    businessType: (row.business_type as BusinessLeadType | null) ?? undefined
  };
}

export async function countOpenLeadsForDealer(dealerProfileId: string): Promise<number> {
  await ensureLeadsSchema();
  const pool = getPgPool();
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM leads
     WHERE dealer_profile_id = $1
       AND stage <> 'closed'`,
    [dealerProfileId]
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function createLeadForListing(input: {
  listingId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  note?: string;
  source?: string;
}): Promise<void> {
  await ensureSeedData();
  await ensureLeadsSchema();
  const pool = getPgPool();

  const listingResult = await pool.query<{
    owner_user_id: string | null;
    dealer_profile_id: string | null;
    listing_kind: string | null;
    title: string;
    dealer_owner_user_id: string | null;
  }>(
    `SELECT l.owner_user_id, l.dealer_profile_id, l.listing_kind, l.title,
            dp.owner_user_id AS dealer_owner_user_id
     FROM listings l
     LEFT JOIN dealer_profiles dp ON dp.id = l.dealer_profile_id
     WHERE l.id = $1
     LIMIT 1`,
    [input.listingId]
  );
  const listing = listingResult.rows[0];
  if (!listing) {
    throw new Error("Elan tapılmadı.");
  }

  const isPart = listing.listing_kind === "part";
  const businessType: BusinessLeadType = isPart ? "parts_store" : "dealer";
  const ownerUserId = listing.owner_user_id ?? listing.dealer_owner_user_id;

  if (businessType === "dealer" && listing.dealer_profile_id && ownerUserId) {
    const plan = await getEffectiveDealerPlan(ownerUserId);
    if (plan.leadInboxLimit !== null) {
      const openCount = await countOpenLeadsForDealer(listing.dealer_profile_id);
      if (openCount >= plan.leadInboxLimit) {
        throw new LeadInboxLimitError(plan.leadInboxLimit);
      }
    }
  }

  await pool.query(
    `INSERT INTO leads (
       id, listing_id, dealer_profile_id, owner_user_id, business_type,
       customer_name, customer_phone, customer_email, note, stage, source
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new', $10)`,
    [
      randomUUID(),
      input.listingId,
      listing.dealer_profile_id,
      ownerUserId,
      businessType,
      input.customerName,
      input.customerPhone ?? null,
      input.customerEmail ?? null,
      input.note ?? null,
      input.source ?? "listing_detail"
    ]
  );
}

export async function listLeadsForDealerProfile(dealerProfileId: string): Promise<LeadRecord[]> {
  await ensureLeadsSchema();
  const pool = getPgPool();
  const result = await pool.query<LeadRow>(
    `SELECT l.*, lis.title AS listing_title
     FROM leads l
     LEFT JOIN listings lis ON lis.id = l.listing_id
     WHERE l.dealer_profile_id = $1
        OR (l.owner_user_id = (SELECT owner_user_id FROM dealer_profiles WHERE id = $1 LIMIT 1)
            AND COALESCE(l.business_type, 'dealer') = 'dealer')
     ORDER BY l.created_at DESC`,
    [dealerProfileId]
  );
  return result.rows.map(mapLead);
}

export async function listLeadsForPartsStore(ownerUserId: string): Promise<LeadRecord[]> {
  await ensureLeadsSchema();
  const pool = getPgPool();
  const result = await pool.query<LeadRow>(
    `SELECT l.*, lis.title AS listing_title
     FROM leads l
     LEFT JOIN listings lis ON lis.id = l.listing_id
     WHERE l.owner_user_id = $1
       AND COALESCE(l.business_type, 'parts_store') = 'parts_store'
     ORDER BY l.created_at DESC`,
    [ownerUserId]
  );
  return result.rows.map(mapLead);
}

export async function updateLeadStage(input: {
  leadId: string;
  stage: LeadRecord["stage"];
  note?: string;
  dealerProfileId?: string;
  ownerUserId?: string;
  businessType?: BusinessLeadType;
}): Promise<boolean> {
  await ensureSeedData();
  await ensureLeadsSchema();
  const pool = getPgPool();

  const scopeClauses: string[] = ["id = $1"];
  const values: unknown[] = [input.leadId, input.stage, input.note ?? null];

  if (input.dealerProfileId) {
    scopeClauses.push(`(dealer_profile_id = $4 OR (owner_user_id = (SELECT owner_user_id FROM dealer_profiles WHERE id = $4 LIMIT 1) AND COALESCE(business_type, 'dealer') = 'dealer'))`);
    values.push(input.dealerProfileId);
  } else if (input.ownerUserId && input.businessType) {
    scopeClauses.push(`owner_user_id = $4 AND COALESCE(business_type, $5) = $5`);
    values.push(input.ownerUserId, input.businessType);
  }

  const result = await pool.query(
    `UPDATE leads
     SET
       stage = $2,
       note = COALESCE($3, note),
       updated_at = NOW(),
       response_time_minutes = CASE
         WHEN stage = 'new' AND $2 <> 'new' AND response_time_minutes IS NULL
         THEN ROUND(EXTRACT(EPOCH FROM (NOW() - created_at)) / 60)::integer
         ELSE response_time_minutes
       END
     WHERE ${scopeClauses.join(" AND ")}`,
    values
  );
  return (result.rowCount ?? 0) > 0;
}
