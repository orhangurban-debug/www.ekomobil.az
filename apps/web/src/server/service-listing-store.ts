import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { extractServicePartnerDraft } from "@/lib/service-partner-draft";
import type { ServiceListingRecord, ServiceProviderType } from "@/lib/services-marketplace";
import { branchesFromLegacyCities, parseBranchesFromDb, sanitizeBusinessBranches } from "@/lib/business-branches";
import type { BusinessProfileBranch } from "@/lib/business-branches";

export type ServiceListingStatus = "pending" | "approved" | "rejected";

export interface AdminServiceListingRecord extends ServiceListingRecord {
  id: string;
  status: ServiceListingStatus;
  supportRequestId?: string;
  createdAt: string;
}

interface ServiceListingRow {
  id: string;
  slug: string;
  support_request_id: string | null;
  name: string;
  provider_type: string;
  city: string;
  address: string | null;
  map_url: string | null;
  branches: unknown;
  about: string;
  services: string[] | null;
  certifications: string[] | null;
  image_urls: string[] | null;
  phone: string;
  whatsapp: string | null;
  rating: string;
  review_count: number;
  response_minutes: number;
  status: string;
  created_at: Date;
}

let serviceListingsTableEnsured = false;

/**
 * DİQQƏT: bu funksiya əvvəllər HƏR çağırışda `CREATE TABLE/INDEX IF NOT EXISTS` DDL-ini
 * yenidən işə salırdı. Next.js-in eyni marşrutu üçün paralel sorğular olanda (məsələn,
 * `<Link>` prefetch + real naviqasiya demək olar ki, eyni anda) bu, Postgres-də konkurrent
 * "CREATE INDEX IF NOT EXISTS" DDL-lərinin toqquşmasına səbəb ola bilirdi (well-known Postgres
 * race — paralel DDL bəzən "tuple concurrently updated" xətası atır), nəticədə sorğulardan
 * biri səssizcə uğursuz olub 404 kimi görünürdü. Digər `ensureXTable()` funksiyaları kimi
 * (bax: `bootstrap-seed.ts`), DDL-i prosesin ömrü boyunca YALNIZ BİR DƏFƏ icra edirik.
 */
async function ensureServiceListingsTable(): Promise<void> {
  if (serviceListingsTableEnsured) return;
  try {
    const pool = getPgPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_listings (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        support_request_id TEXT REFERENCES support_requests(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        provider_type TEXT NOT NULL,
        city TEXT NOT NULL,
        address TEXT NULL,
        map_url TEXT NULL,
        about TEXT NOT NULL DEFAULT '',
        services TEXT[] NOT NULL DEFAULT '{}',
        certifications TEXT[] NOT NULL DEFAULT '{}',
        image_urls TEXT[] NOT NULL DEFAULT '{}',
        phone TEXT NOT NULL,
        whatsapp TEXT NULL,
        rating NUMERIC(3, 1) NOT NULL DEFAULT 5.0,
        review_count INTEGER NOT NULL DEFAULT 0,
        response_minutes INTEGER NOT NULL DEFAULT 60,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT service_listings_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
      );
      CREATE INDEX IF NOT EXISTS idx_service_listings_status ON service_listings (status);
      CREATE INDEX IF NOT EXISTS idx_service_listings_provider_type ON service_listings (provider_type);
      CREATE INDEX IF NOT EXISTS idx_service_listings_city ON service_listings (city);
      CREATE INDEX IF NOT EXISTS idx_service_listings_created_at ON service_listings (created_at DESC);
    `);
    // Incremental: add owner_user_id if not yet present (migration 058)
    await pool.query(`
      ALTER TABLE service_listings ADD COLUMN IF NOT EXISTS owner_user_id TEXT;
      ALTER TABLE service_listings ADD COLUMN IF NOT EXISTS branch_cities TEXT[] NOT NULL DEFAULT '{}';
      ALTER TABLE service_listings ADD COLUMN IF NOT EXISTS branches JSONB NOT NULL DEFAULT '[]'::jsonb;
      CREATE INDEX IF NOT EXISTS idx_service_listings_owner ON service_listings (owner_user_id);
    `).catch(() => {});
    serviceListingsTableEnsured = true;
  } catch {
    // Non-blocking safety net — migration 048_service_listings.sql is the source of truth.
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9əğıöşüçâ]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "servis";
}

function parseServiceBranches(row: ServiceListingRow & { branch_cities?: string[] }): BusinessProfileBranch[] {
  const fromJson = parseBranchesFromDb(row.branches, undefined, row.city);
  if (fromJson.length > 0) return fromJson;
  return branchesFromLegacyCities(row.branch_cities ?? [], row.city);
}

function mapRow(row: ServiceListingRow): AdminServiceListingRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    providerType: row.provider_type as ServiceProviderType,
    city: row.city,
    address: row.address ?? undefined,
    mapUrl: row.map_url ?? undefined,
    branches: parseServiceBranches(row as ServiceListingRow & { branch_cities?: string[] }),
    rating: Number(row.rating),
    reviewCount: row.review_count,
    responseMinutes: row.response_minutes,
    about: row.about,
    services: row.services ?? [],
    certifications: row.certifications && row.certifications.length > 0 ? row.certifications : undefined,
    phone: row.phone,
    whatsapp: row.whatsapp ?? row.phone,
    imageUrls: row.image_urls && row.image_urls.length > 0 ? row.image_urls : undefined,
    status: row.status as ServiceListingStatus,
    ownerUserId: (row as ServiceListingRow & { owner_user_id?: string }).owner_user_id ?? null,
    supportRequestId: row.support_request_id ?? undefined,
    createdAt: row.created_at.toISOString()
  };
}

/**
 * Creates a new service listing with status 'pending'.
 * Admin approves via support request resolve or /admin/service-listings.
 *
 * @deprecated alias: previously called createPendingServiceListing (misleading name)
 */
export const createPendingServiceListing = createServiceListing;

export async function createServiceListing(input: {
  supportRequestId?: string;
  ownerUserId?: string;
  name: string;
  providerType: string;
  city: string;
  branchCities?: string[];
  branches?: BusinessProfileBranch[];
  address?: string;
  mapUrl?: string;
  about: string;
  services: string[];
  certifications?: string[];
  imageUrls?: string[];
  phone: string;
  whatsapp?: string;
}): Promise<{ id: string; slug: string }> {
  await ensureServiceListingsTable();
  const pool = getPgPool();
  const id = randomUUID();
  const baseSlug = slugify(`${input.name}-${input.city}`);
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await pool.query(`SELECT 1 FROM service_listings WHERE slug = $1`, [slug]);
    if (existing.rowCount === 0) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const branchCities = (input.branchCities ?? []).filter(
    (city) => typeof city === "string" && city.trim() && city.trim() !== input.city
  );
  const branches = JSON.stringify(
    sanitizeBusinessBranches(
      input.branches ?? branchesFromLegacyCities(branchCities, input.city),
      input.city
    )
  );

  await pool.query(
    `
      INSERT INTO service_listings (
        id, slug, support_request_id, owner_user_id, name, provider_type, city, branch_cities, branches, address, map_url,
        about, services, certifications, image_urls, phone, whatsapp, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15,$16,$17,'pending')
    `,
    [
      id,
      slug,
      input.supportRequestId ?? null,
      input.ownerUserId ?? null,
      input.name,
      input.providerType,
      input.city,
      branchCities,
      branches,
      input.address ?? null,
      input.mapUrl ?? null,
      input.about,
      input.services,
      input.certifications ?? [],
      input.imageUrls ?? [],
      input.phone,
      input.whatsapp ?? input.phone
    ]
  );

  return { id, slug };
}

export async function listServiceListingsForUser(userId: string): Promise<ServiceListingRecord[]> {
  try {
    await ensureServiceListingsTable();
    const pool = getPgPool();
    const result = await pool.query(
      `SELECT * FROM service_listings WHERE owner_user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows.map(mapRow);
  } catch {
    return [];
  }
}

export async function listApprovedServiceListings(filter?: {
  providerType?: string;
  city?: string;
}): Promise<ServiceListingRecord[]> {
  try {
    await ensureServiceListingsTable();
    const pool = getPgPool();
    const values: unknown[] = [];
    const where = ["status = 'approved'"];
    if (filter?.providerType) {
      values.push(filter.providerType);
      where.push(`provider_type = $${values.length}`);
    }
    if (filter?.city) {
      values.push(filter.city);
      where.push(`city = $${values.length}`);
    }
    const result = await pool.query<ServiceListingRow>(
      `SELECT * FROM service_listings WHERE ${where.join(" AND ")} ORDER BY created_at DESC`,
      values
    );
    return result.rows.map(mapRow);
  } catch (error) {
    console.error("listApprovedServiceListings failed:", error);
    return [];
  }
}

/**
 * Next.js 16 (Turbopack, dev) bəzən dinamik seqment parametrini (`params.slug`) eyni sorğu
 * daxilində `generateMetadata` və səhifə komponentinə FƏRQLİ formada ötürür — biri artıq
 * decode olunmuş (məs. "bakı"), digəri isə hələ percent-encoded («bak%C4%B1») qalır. Bu,
 * qeyri-müəyyən şəkildə hansı çağırışın uğursuz olacağına səbəb olur (bax: uzun müddət
 * debug edilmiş flaky 404 bug-ı — slug DB-də mövcud idi, amma təsadüfi "tapılmadı" alınırdı).
 * Bunun qarşısını almaq üçün slug-u burada, sorğu göndərilməzdən əvvəl, DƏYİŞMƏZ şəkildə
 * decode edirik — artıq decode olunmuşsa bu əməliyyat no-op olur.
 */
function normalizeSlugParam(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export async function getApprovedServiceListingBySlug(rawSlug: string): Promise<ServiceListingRecord | null> {
  const slug = normalizeSlugParam(rawSlug);
  try {
    await ensureServiceListingsTable();
    const pool = getPgPool();
    const result = await pool.query<ServiceListingRow>(
      `SELECT * FROM service_listings WHERE slug = $1 AND status = 'approved' LIMIT 1`,
      [slug]
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  } catch (error) {
    console.error(`getApprovedServiceListingBySlug failed for slug ${slug}:`, error);
    return null;
  }
}

export async function ensureServiceListingForSupportRequest(
  supportRequestId: string
): Promise<{ created: boolean; listingId?: string }> {
  await ensureServiceListingsTable();
  const pool = getPgPool();

  const existing = await pool.query<{ id: string }>(
    `SELECT id FROM service_listings WHERE support_request_id = $1 LIMIT 1`,
    [supportRequestId]
  );
  if (existing.rows[0]) {
    return { created: false, listingId: existing.rows[0].id };
  }

  const request = await pool.query<{
    message: string;
    subject: string;
    metadata: Record<string, unknown> | null;
    status: string;
    reporter_user_id: string | null;
  }>(
    `SELECT message, subject, metadata, status, reporter_user_id
     FROM support_requests
     WHERE id = $1 AND request_type = 'inspection_partner'
     LIMIT 1`,
    [supportRequestId]
  );
  const row = request.rows[0];
  if (!row) return { created: false };

  const draft = extractServicePartnerDraft({
    message: row.message,
    subject: row.subject,
    metadata: row.metadata
  });
  if (!draft) return { created: false };

  const created = await createServiceListing({
    supportRequestId,
    ownerUserId: row.reporter_user_id ?? undefined,
    name: draft.name,
    providerType: draft.providerType,
    city: draft.city,
    branchCities: draft.branchCities,
    address: draft.address,
    mapUrl: draft.mapUrl,
    about: draft.about ?? "",
    services: draft.services ?? [],
    certifications: draft.certifications,
    imageUrls: draft.imageUrls,
    phone: draft.phone,
    whatsapp: draft.whatsapp
  });

  if (row.status === "resolved" || row.status === "closed") {
    await pool.query(
      `UPDATE service_listings SET status = 'approved', updated_at = NOW() WHERE id = $1`,
      [created.id]
    );
  }

  return { created: true, listingId: created.id };
}

export async function syncMissingServiceListingsFromSupportRequests(): Promise<number> {
  await ensureServiceListingsTable();
  const pool = getPgPool();
  const missing = await pool.query<{ id: string }>(
    `
      SELECT sr.id
      FROM support_requests sr
      WHERE sr.request_type = 'inspection_partner'
        AND NOT EXISTS (
          SELECT 1 FROM service_listings sl WHERE sl.support_request_id = sr.id
        )
    `
  );

  let created = 0;
  for (const row of missing.rows) {
    const result = await ensureServiceListingForSupportRequest(row.id);
    if (result.created) created += 1;
  }
  return created;
}

export async function listServiceListingsForAdmin(filter?: {
  status?: ServiceListingStatus;
}): Promise<AdminServiceListingRecord[]> {
  try {
    await ensureServiceListingsTable();
    await syncMissingServiceListingsFromSupportRequests();
    const pool = getPgPool();
    const values: unknown[] = [];
    const where: string[] = [];
    if (filter?.status) {
      values.push(filter.status);
      where.push(`status = $${values.length}`);
    }
    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const result = await pool.query<ServiceListingRow>(
      `SELECT * FROM service_listings ${whereSql} ORDER BY created_at DESC`,
      values
    );
    return result.rows.map(mapRow);
  } catch (error) {
    console.error("listServiceListingsForAdmin failed:", error);
    return [];
  }
}

export interface ServiceListingStatusCounts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export async function getServiceListingStatusCounts(): Promise<ServiceListingStatusCounts> {
  try {
    await ensureServiceListingsTable();
    const pool = getPgPool();
    const result = await pool.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*)::text AS count FROM service_listings GROUP BY status`
    );
    const counts: ServiceListingStatusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };
    for (const row of result.rows) {
      const count = Number(row.count) || 0;
      counts.total += count;
      if (row.status === "pending") counts.pending = count;
      if (row.status === "approved") counts.approved = count;
      if (row.status === "rejected") counts.rejected = count;
    }
    return counts;
  } catch (error) {
    console.error("getServiceListingStatusCounts failed:", error);
    return { pending: 0, approved: 0, rejected: 0, total: 0 };
  }
}

export async function updateServiceListingStatus(
  id: string,
  status: ServiceListingStatus
): Promise<{ ok: boolean; error?: string; supportRequestResolved?: boolean }> {
  try {
    await ensureServiceListingsTable();
    const pool = getPgPool();
    await pool.query(`UPDATE service_listings SET status = $2, updated_at = NOW() WHERE id = $1`, [id, status]);
    let supportRequestResolved = false;
    if (status === "approved") {
      const resolved = await resolveLinkedSupportRequestAfterServiceApproval(id);
      supportRequestResolved = resolved.resolved;
    }
    return { ok: true, supportRequestResolved };
  } catch {
    return { ok: false, error: "Status yenilənərkən xəta baş verdi." };
  }
}

export async function resolveLinkedSupportRequestAfterServiceApproval(
  listingId: string,
  adminResponse = "Müraciətiniz təsdiqləndi. Servis profiliniz aktivləşdirildi."
): Promise<{ resolved: boolean }> {
  await ensureServiceListingsTable();
  const pool = getPgPool();
  const listing = await pool.query<{ support_request_id: string | null }>(
    `SELECT support_request_id FROM service_listings WHERE id = $1 LIMIT 1`,
    [listingId]
  );
  const requestId = listing.rows[0]?.support_request_id;
  if (!requestId) return { resolved: false };

  const result = await pool.query(
    `UPDATE support_requests
     SET
       status = 'resolved',
       admin_response = COALESCE(NULLIF(admin_response, ''), $2),
       resolved_at = COALESCE(resolved_at, NOW()),
       last_activity_at = NOW()
     WHERE id = $1
       AND status NOT IN ('resolved', 'closed', 'archived')`,
    [requestId, adminResponse]
  );
  return { resolved: (result.rowCount ?? 0) > 0 };
}

export async function rejectServiceListingsBySupportRequestId(
  supportRequestId: string
): Promise<{ ok: boolean; rejectedCount: number }> {
  try {
    await ensureServiceListingsTable();
    const pool = getPgPool();
    const result = await pool.query(
      `UPDATE service_listings
       SET status = 'rejected', updated_at = NOW()
       WHERE support_request_id = $1 AND status IN ('pending', 'approved')`,
      [supportRequestId]
    );
    return { ok: true, rejectedCount: result.rowCount ?? 0 };
  } catch {
    return { ok: false, rejectedCount: 0 };
  }
}

export async function approveServiceListingsBySupportRequestId(
  supportRequestId: string
): Promise<{ ok: boolean; approvedCount: number }> {
  try {
    await ensureServiceListingsTable();
    const pool = getPgPool();
    const result = await pool.query(
      `UPDATE service_listings
       SET status = 'approved', updated_at = NOW()
       WHERE support_request_id = $1 AND status = 'pending'`,
      [supportRequestId]
    );
    return { ok: true, approvedCount: result.rowCount ?? 0 };
  } catch {
    return { ok: false, approvedCount: 0 };
  }
}
