import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import type { ServiceListingRecord, ServiceProviderType } from "@/lib/services-marketplace";

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

function mapRow(row: ServiceListingRow): AdminServiceListingRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    providerType: row.provider_type as ServiceProviderType,
    city: row.city,
    address: row.address ?? undefined,
    mapUrl: row.map_url ?? undefined,
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
 * Creates a new service listing with status 'approved'.
 * Service profiles are self-serve and go live immediately by design —
 * they are low-risk (no financial transaction, no vehicle data) and
 * benefit from fast onboarding. Admins can reject post-facto via the
 * /admin/service-listings panel if needed.
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

  await pool.query(
    `
      INSERT INTO service_listings (
        id, slug, support_request_id, owner_user_id, name, provider_type, city, address, map_url,
        about, services, certifications, image_urls, phone, whatsapp, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'approved')
    `,
    [
      id,
      slug,
      input.supportRequestId ?? null,
      input.ownerUserId ?? null,
      input.name,
      input.providerType,
      input.city,
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

export async function listServiceListingsForAdmin(filter?: {
  status?: ServiceListingStatus;
}): Promise<AdminServiceListingRecord[]> {
  try {
    await ensureServiceListingsTable();
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
  } catch {
    return [];
  }
}

export async function updateServiceListingStatus(
  id: string,
  status: ServiceListingStatus
): Promise<{ ok: boolean; error?: string }> {
  try {
    await ensureServiceListingsTable();
    const pool = getPgPool();
    await pool.query(`UPDATE service_listings SET status = $2, updated_at = NOW() WHERE id = $1`, [id, status]);
    return { ok: true };
  } catch {
    return { ok: false, error: "Status yenilənərkən xəta baş verdi." };
  }
}
