import { getPgPool } from "@/lib/postgres";
import type { ListingKind } from "@/lib/marketplace-types";

interface TotalsRow {
  active_count: string;
  view_count: string;
  contact_click_count: string;
  test_drive_click_count: string;
}

interface TopRow {
  listing_id: string;
  title: string;
  city: string;
  status: string;
  view_count: number;
  contact_click_count: number;
  test_drive_click_count: number;
}

export interface BusinessAnalyticsSummary {
  listingKind: ListingKind;
  activeCount: number;
  totalViews: number;
  totalContactClicks: number;
  totalTestDriveClicks: number;
  topListings: Array<{
    listingId: string;
    title: string;
    city: string;
    status: string;
    viewCount: number;
    contactClickCount: number;
    testDriveClickCount: number;
  }>;
}

export async function getBusinessAnalyticsSummary(ownerUserId: string, listingKind: ListingKind): Promise<BusinessAnalyticsSummary> {
  try {
    const pool = getPgPool();
    const totals = await pool.query<TotalsRow>(
      `
        SELECT
          COUNT(*) FILTER (WHERE l.status = 'active')::text AS active_count,
          COALESCE(SUM(COALESCE(ls.view_count, 0)), 0)::text AS view_count,
          COALESCE(SUM(COALESCE(ls.contact_click_count, 0)), 0)::text AS contact_click_count,
          COALESCE(SUM(COALESCE(ls.test_drive_click_count, 0)), 0)::text AS test_drive_click_count
        FROM listings l
        LEFT JOIN listing_stats ls ON ls.listing_id = l.id
        LEFT JOIN dealer_profiles dp ON dp.id = l.dealer_profile_id
        WHERE
          COALESCE(l.listing_kind, 'vehicle') = $2
          AND (l.owner_user_id = $1 OR dp.owner_user_id = $1)
      `,
      [ownerUserId, listingKind]
    );

    const top = await pool.query<TopRow>(
      `
        SELECT
          l.id AS listing_id,
          l.title,
          l.city,
          l.status,
          COALESCE(ls.view_count, 0) AS view_count,
          COALESCE(ls.contact_click_count, 0) AS contact_click_count,
          COALESCE(ls.test_drive_click_count, 0) AS test_drive_click_count
        FROM listings l
        LEFT JOIN listing_stats ls ON ls.listing_id = l.id
        LEFT JOIN dealer_profiles dp ON dp.id = l.dealer_profile_id
        WHERE
          COALESCE(l.listing_kind, 'vehicle') = $2
          AND (l.owner_user_id = $1 OR dp.owner_user_id = $1)
        ORDER BY COALESCE(ls.view_count, 0) DESC, l.created_at DESC
        LIMIT 20
      `,
      [ownerUserId, listingKind]
    );

    const totalRow = totals.rows[0];
    return {
      listingKind,
      activeCount: Number(totalRow?.active_count ?? "0"),
      totalViews: Number(totalRow?.view_count ?? "0"),
      totalContactClicks: Number(totalRow?.contact_click_count ?? "0"),
      totalTestDriveClicks: Number(totalRow?.test_drive_click_count ?? "0"),
      topListings: top.rows.map((row) => ({
        listingId: row.listing_id,
        title: row.title,
        city: row.city,
        status: row.status,
        viewCount: row.view_count,
        contactClickCount: row.contact_click_count,
        testDriveClickCount: row.test_drive_click_count
      }))
    };
  } catch {
    return {
      listingKind,
      activeCount: 0,
      totalViews: 0,
      totalContactClicks: 0,
      totalTestDriveClicks: 0,
      topListings: []
    };
  }
}
