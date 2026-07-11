import { getPgPool } from "@/lib/postgres";

export type ServiceStatEvent = "view" | "contact_click";

let serviceStatsEnsured = false;

async function ensureServiceStatsTable(): Promise<void> {
  if (serviceStatsEnsured) return;
  try {
    const pool = getPgPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_listing_stats (
        service_listing_id TEXT PRIMARY KEY,
        view_count INTEGER NOT NULL DEFAULT 0,
        contact_click_count INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    serviceStatsEnsured = true;
  } catch {
    // migration 061 is source of truth
  }
}

export async function recordServiceListingStat(serviceListingId: string, event: ServiceStatEvent): Promise<void> {
  await ensureServiceStatsTable();
  const pool = getPgPool();
  const column = event === "view" ? "view_count" : "contact_click_count";
  await pool.query(
    `INSERT INTO service_listing_stats (service_listing_id, view_count, contact_click_count)
     VALUES ($1, $2, $3)
     ON CONFLICT (service_listing_id) DO UPDATE SET
       ${column} = service_listing_stats.${column} + 1,
       updated_at = NOW()`,
    [
      serviceListingId,
      event === "view" ? 1 : 0,
      event === "contact_click" ? 1 : 0
    ]
  );
}

export async function getServiceStatsForOwner(ownerUserId: string): Promise<{
  totalViews: number;
  totalContactClicks: number;
  byListing: Array<{ id: string; name: string; slug: string; views: number; contacts: number }>;
}> {
  await ensureServiceStatsTable();
  const pool = getPgPool();
  const result = await pool.query<{
    id: string;
    name: string;
    slug: string;
    view_count: number;
    contact_click_count: number;
  }>(
    `SELECT sl.id, sl.name, sl.slug,
            COALESCE(ss.view_count, 0) AS view_count,
            COALESCE(ss.contact_click_count, 0) AS contact_click_count
     FROM service_listings sl
     LEFT JOIN service_listing_stats ss ON ss.service_listing_id = sl.id
     WHERE sl.owner_user_id = $1
     ORDER BY COALESCE(ss.view_count, 0) DESC, sl.created_at DESC`,
    [ownerUserId]
  );
  const rows = result.rows;
  return {
    totalViews: rows.reduce((sum, row) => sum + row.view_count, 0),
    totalContactClicks: rows.reduce((sum, row) => sum + row.contact_click_count, 0),
    byListing: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      views: row.view_count,
      contacts: row.contact_click_count
    }))
  };
}
