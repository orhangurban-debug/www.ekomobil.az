import { getPgPool } from "@/lib/postgres";

type StatField = "view_count" | "contact_click_count" | "test_drive_click_count";

const inMemory = globalThis as unknown as {
  ekomobilListingStats?: Map<string, { viewCount: number; contactClickCount: number; testDriveClickCount: number }>;
};

function getMap() {
  if (!inMemory.ekomobilListingStats) {
    inMemory.ekomobilListingStats = new Map();
  }
  return inMemory.ekomobilListingStats;
}

export interface ListingStats {
  viewCount: number;
  contactClickCount: number;
  testDriveClickCount: number;
}

export async function getListingStats(listingId: string): Promise<ListingStats> {
  try {
    const pool = getPgPool();
    const r = await pool.query<{
      view_count: number;
      contact_click_count: number;
      test_drive_click_count: number;
    }>(
      `SELECT view_count, contact_click_count, test_drive_click_count
       FROM listing_stats
       WHERE listing_id = $1`,
      [listingId]
    );
    const row = r.rows[0];
    if (!row) {
      return { viewCount: 0, contactClickCount: 0, testDriveClickCount: 0 };
    }
    return {
      viewCount: row.view_count,
      contactClickCount: row.contact_click_count,
      testDriveClickCount: row.test_drive_click_count
    };
  } catch {
    return getMap().get(listingId) ?? { viewCount: 0, contactClickCount: 0, testDriveClickCount: 0 };
  }
}

export async function bumpListingStat(listingId: string, action: "view" | "contact_click" | "test_drive_click"): Promise<void> {
  const field: StatField =
    action === "view" ? "view_count" : action === "contact_click" ? "contact_click_count" : "test_drive_click_count";

  try {
    const pool = getPgPool();
    await pool.query(
      `
      INSERT INTO listing_stats (listing_id, ${field}, updated_at)
      VALUES ($1, 1, NOW())
      ON CONFLICT (listing_id)
      DO UPDATE SET
        ${field} = listing_stats.${field} + 1,
        updated_at = NOW()
      `,
      [listingId]
    );
  } catch {
    const map = getMap();
    const current = map.get(listingId) ?? { viewCount: 0, contactClickCount: 0, testDriveClickCount: 0 };
    if (action === "view") current.viewCount += 1;
    if (action === "contact_click") current.contactClickCount += 1;
    if (action === "test_drive_click") current.testDriveClickCount += 1;
    map.set(listingId, current);
  }
}
