import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { getPgPool } from "@/lib/postgres";
import { getListingDetail } from "@/server/listing-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: RouteContext) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const pool = getPgPool();

  const userResult = await pool.query(
    `SELECT id, email, full_name, phone, city, role, user_account_status, penalty_balance_azn,
            is_identity_verified, legal_hold, legal_hold_reason, created_at, updated_at
     FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  const user = userResult.rows[0];
  if (!user) {
    return NextResponse.json({ ok: false, error: "İstifadəçi tapılmadı." }, { status: 404 });
  }

  const [listings, activity, reportsAgainst, reportsBy, consents, kyc, legalRequests] = await Promise.all([
    pool.query(
      `SELECT id, title, status, price_azn, city, created_at, updated_at
       FROM listings
       WHERE owner_user_id = $1
          OR dealer_profile_id IN (SELECT id FROM dealer_profiles WHERE owner_user_id = $1)
       ORDER BY created_at DESC LIMIT 100`,
      [id]
    ),
    pool.query(
      `SELECT action_type, entity_type, entity_id, ip_hash, user_agent, metadata, created_at
       FROM user_activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [id]
    ),
    pool.query(
      `SELECT id, reason_code, description, status, listing_id, created_at
       FROM user_reports WHERE reported_user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [id]
    ),
    pool.query(
      `SELECT id, reason_code, description, status, listing_id, created_at
       FROM user_reports WHERE reporter_user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [id]
    ),
    pool.query(
      `SELECT consent_type, document_version, accepted_at, source, ip_address
       FROM user_consent_acceptances WHERE user_id = $1 ORDER BY accepted_at DESC`,
      [id]
    ),
    pool.query(
      `SELECT status, legal_name, national_id_last4, reviewed_at, created_at
       FROM user_kyc_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [id]
    ),
    pool.query(
      `SELECT reference_number, authority_name, request_type, status, received_at, legal_hold_until
       FROM legal_data_requests WHERE subject_user_id = $1 ORDER BY received_at DESC LIMIT 20`,
      [id]
    )
  ]);

  const listingDetails = await Promise.all(
    listings.rows.slice(0, 20).map(async (row: { id: string }) => {
      const detail = await getListingDetail(row.id);
      return detail
        ? {
            id: detail.id,
            title: detail.title,
            status: detail.status,
            priceAzn: detail.priceAzn,
            vinProvided: detail.vinProvided,
            trustScore: detail.trustScore
          }
        : row;
    })
  );

  return NextResponse.json({
    ok: true,
    exportedAt: new Date().toISOString(),
    user,
    listings: listingDetails,
    activityLogs: activity.rows,
    reportsAgainst: reportsAgainst.rows,
    reportsBy: reportsBy.rows,
    consents: consents.rows,
    kycProfiles: kyc.rows,
    legalRequests: legalRequests.rows
  });
}
