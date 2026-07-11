import { getPgPool } from "@/lib/postgres";

export interface AdminPendingCounts {
  /** Listings awaiting admin review */
  pendingListings: number;
  /** Support requests in "new" state (unread) */
  newSupportRequests: number;
  /** Business applications (dealer_apply, parts_apply, inspection_partner) in "new" state */
  newBusinessApplications: number;
  /** Service partner listings awaiting approval */
  pendingServiceListings: number;
  /** Open incident cases */
  openIncidents: number;
  /** Ad requests awaiting action */
  pendingAdRequests: number;
}

/**
 * Fetches all admin moderation counts in a single round-trip.
 * Used by the admin sidebar to show live badge numbers.
 * Returns zeros on any DB error so the sidebar never breaks.
 */
export async function getAdminPendingCounts(): Promise<AdminPendingCounts> {
  const pool = getPgPool();
  try {
    const [listingsRes, supportRes, serviceRes, incidentRes, adReqRes] = await Promise.all([
      // Listings pending review
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM listings WHERE status = 'pending_review'`
      ),
      // Support requests: split general "new" vs business applications
      pool.query<{ total: string; business: string }>(
        `SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE request_type IN (
            'dealer_apply','parts_apply','inspection_partner','partnership'
          ))::text AS business
         FROM support_requests
         WHERE status = 'new'`
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM service_listings WHERE status = 'pending'`
      ),
      // Open incident cases
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM incident_cases WHERE status = 'open'`
      ),
      // Ad requests pending
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ad_requests WHERE status = 'pending'`
      )
    ]);

    const total = parseInt(supportRes.rows[0]?.total ?? "0", 10);
    const business = parseInt(supportRes.rows[0]?.business ?? "0", 10);

    return {
      pendingListings: parseInt(listingsRes.rows[0]?.count ?? "0", 10),
      newSupportRequests: total - business,
      newBusinessApplications: business,
      pendingServiceListings: parseInt(serviceRes.rows[0]?.count ?? "0", 10),
      openIncidents: parseInt(incidentRes.rows[0]?.count ?? "0", 10),
      pendingAdRequests: parseInt(adReqRes.rows[0]?.count ?? "0", 10)
    };
  } catch (err) {
    console.error("[admin-counts-store] getAdminPendingCounts failed:", err);
    return {
      pendingListings: 0,
      newSupportRequests: 0,
      newBusinessApplications: 0,
      pendingServiceListings: 0,
      openIncidents: 0,
      pendingAdRequests: 0
    };
  }
}
