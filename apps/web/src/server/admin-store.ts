import { getPgPool } from "@/lib/postgres";
import { REQUEST_TYPE_GROUPS } from "@/lib/support-admin";
import { SUPPORT_ARCHIVE_AFTER_DAYS } from "@/lib/support-retention";
import type { UserRole } from "@/lib/auth";
import { DEALER_PLANS } from "@/lib/dealer-plans";
import { PARTS_STORE_PLANS } from "@/lib/parts-store-plans";

let supportEnrichColumnsReadyCache: boolean | null = null;
let supportArchiveColumnsReadyCache: boolean | null = null;

async function supportArchiveColumnsReady(): Promise<boolean> {
  if (supportArchiveColumnsReadyCache !== null) return supportArchiveColumnsReadyCache;
  try {
    const pool = getPgPool();
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'support_requests'
         AND column_name = 'archived_at'`
    );
    supportArchiveColumnsReadyCache = n(result.rows[0]?.count) >= 1;
  } catch {
    supportArchiveColumnsReadyCache = false;
  }
  return supportArchiveColumnsReadyCache;
}

async function supportEnrichColumnsReady(): Promise<boolean> {
  if (supportEnrichColumnsReadyCache !== null) return supportEnrichColumnsReadyCache;
  try {
    const pool = getPgPool();
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'support_requests'
         AND column_name IN ('risk_flag', 'reporter_ip', 'internal_notes')`
    );
    supportEnrichColumnsReadyCache = n(result.rows[0]?.count) >= 3;
  } catch {
    supportEnrichColumnsReadyCache = false;
  }
  return supportEnrichColumnsReadyCache;
}

async function supportEnrichSelectSql(alias = "sr"): Promise<string> {
  const enrich = await supportEnrichColumnsReady();
  if (enrich) {
    return `${alias}.reporter_ip, ${alias}.reporter_user_agent, ${alias}.internal_notes, ${alias}.risk_flag`;
  }
  return `NULL::text AS reporter_ip, NULL::text AS reporter_user_agent, NULL::text AS internal_notes, 'none'::text AS risk_flag`;
}

export interface AdminOverview {
  usersTotal: number;
  activeUsers: number;
  activeListings: number;
  liveAuctions: number;
  unresolvedCases: number;
  newSupportRequests: number;
  openIncidents: number;
  monthlyRevenueAzn: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  role: UserRole;
  userAccountStatus: string;
  penaltyBalanceAzn: number;
  emailVerified: boolean;
  createdAt: string;
  fullName?: string;
  city?: string;
}

export interface FinanceSnapshot {
  listingPlanRevenueAzn: number;
  auctionRevenueAzn: number;
  obligationRevenueAzn: number;
  sellerBondRevenueAzn: number;
  businessSubscriptionsRevenueAzn: number;
  activeDealerSubscriptions: number;
  activePartsSubscriptions: number;
  expiringSubscriptions7d: number;
  totalRevenueAzn: number;
}

export interface AdminUserLookup {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
}

export interface AdminBusinessProfileRow {
  dealerId: string;
  ownerUserId?: string;
  ownerEmail?: string;
  name: string;
  city: string;
  verified: boolean;
  logoUrl?: string;
  coverUrl?: string;
  whatsappPhone?: string;
  websiteUrl?: string;
  showWhatsapp: boolean;
  showWebsite: boolean;
  dealerPlanId?: string;
  partsPlanId?: string;
  updatedAt: string;
}

export interface CrmSnapshot {
  totalLeads: number;
  newLeads: number;
  inProgressLeads: number;
  closedLeads: number;
  avgResponseMinutes: number;
}

export interface AdminLeadRow {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  stage: string;
  source: string;
  responseTimeMinutes?: number;
  createdAt: string;
  listingTitle?: string;
}

export interface AdminSupportRequestRow {
  id: string;
  requestType: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  source: string;
  reporterUserId?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  reporterIp?: string;
  reporterUserAgent?: string;
  listingId?: string;
  assignedToUserId?: string;
  assignedToEmail?: string;
  adminResponse?: string;
  internalNotes?: string;
  riskFlag: string;
  responseAt?: string;
  resolvedAt?: string;
  archivedAt?: string;
  lastActivityAt: string;
  createdAt: string;
  reporterContext?: SupportReporterContext;
}

export interface SupportReporterContext {
  matchedUserId?: string;
  accountEmail?: string;
  accountRole?: string;
  accountStatus?: string;
  accountCreatedAt?: string;
  penaltyBalanceAzn?: number;
  otherRequestCount: number;
  openIncidentCount: number;
}

export interface AdminUserMembershipListing {
  id: string;
  title: string;
  status: string;
  listingKind: string;
  sellerType: string;
  planType?: string;
  planExpiresAt?: string;
  priceAzn: number;
  city: string;
  createdAt: string;
}

export interface AdminUserMembershipProfile {
  user: AdminUserRow & {
    phone?: string;
    isIdentityVerified?: boolean;
    penaltyBalanceAzn: number;
  };
  dealerProfile?: {
    id: string;
    name: string;
    city: string;
    verified: boolean;
  };
  subscriptions: Array<{
    id: string;
    businessType: string;
    planId: string;
    status: string;
    startsAt?: string;
    expiresAt?: string;
  }>;
  listings: AdminUserMembershipListing[];
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    paymentType: string;
    amountAzn: number;
    description: string;
    issuedAt: string;
  }>;
  supportRequests: Array<{
    id: string;
    subject: string;
    requestType: string;
    status: string;
    listingId?: string;
    createdAt: string;
  }>;
  stats: {
    totalListings: number;
    activeListings: number;
    vehicleListings: number;
    partListings: number;
    supportRequestCount: number;
  };
}

export interface AdminSupportSnapshot {
  total: number;
  newCount: number;
  inProgressCount: number;
  waitingUserCount: number;
  resolvedCount: number;
  archivedCount: number;
  urgentCount: number;
  riskCount: number;
  complaintCount: number;
  avgResponseHours: number;
  byType: Array<{ requestType: string; count: number }>;
}

export interface AdminListingRow {
  id: string;
  title: string;
  status: string;
  sellerType: string;
  listingKind: string;
  priceAzn: number;
  city: string;
  year: number;
  planType?: string;
  createdAt: string;
}

export interface AdminAuctionRow {
  id: string;
  titleSnapshot: string;
  status: string;
  mode: string;
  currentBidAzn?: number;
  startingBidAzn: number;
  sellerUserId: string;
  winnerUserId?: string;
  endsAt: string;
  updatedAt: string;
  freezeBidding: boolean;
  forceManualReview: boolean;
  controlNote?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function n(v: string | number | null | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  try {
    const pool = getPgPool();
    const [users, listings, auctions, cases, supportNew, openIncidents, revenue] = await Promise.all([
      pool.query<{ total: string; active: string }>(
        `SELECT COUNT(*)::text AS total,
                SUM(CASE WHEN user_account_status = 'active' THEN 1 ELSE 0 END)::text AS active
         FROM users`
      ),
      pool.query<{ active_listings: string }>(
        `SELECT COUNT(*)::text AS active_listings
         FROM listings
         WHERE status = 'active'`
      ),
      pool.query<{ live_auctions: string }>(
        `SELECT COUNT(*)::text AS live_auctions
         FROM auction_listings
         WHERE status IN ('live', 'extended')`
      ),
      pool.query<{ unresolved_cases: string }>(
        `SELECT COUNT(*)::text AS unresolved_cases
         FROM auction_listings
         WHERE status IN ('ended_pending_confirmation', 'buyer_confirmed', 'seller_confirmed', 'no_show', 'seller_breach', 'disputed')`
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM support_requests
         WHERE status = 'new'`
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM incident_cases
         WHERE status NOT IN ('resolved', 'dismissed')`
      ),
      pool.query<{ monthly_revenue: string }>(
        `SELECT
           COALESCE((
             SELECT SUM(amount_azn) FROM listing_plan_payments
             WHERE status = 'succeeded'
               AND created_at >= date_trunc('month', NOW())
           ), 0)
           +
           COALESCE((
             SELECT SUM(amount_azn) FROM auction_financial_events
             WHERE status = 'succeeded'
               AND created_at >= date_trunc('month', NOW())
           ), 0)
           AS monthly_revenue`
      )
    ]);
    return {
      usersTotal: n(users.rows[0]?.total),
      activeUsers: n(users.rows[0]?.active),
      activeListings: n(listings.rows[0]?.active_listings),
      liveAuctions: n(auctions.rows[0]?.live_auctions),
      unresolvedCases: n(cases.rows[0]?.unresolved_cases),
      newSupportRequests: n(supportNew.rows[0]?.count),
      openIncidents: n(openIncidents.rows[0]?.count),
      monthlyRevenueAzn: n(revenue.rows[0]?.monthly_revenue)
    };
  } catch {
    return {
      usersTotal: 0,
      activeUsers: 0,
      activeListings: 0,
      liveAuctions: 0,
      unresolvedCases: 0,
      newSupportRequests: 0,
      openIncidents: 0,
      monthlyRevenueAzn: 0
    };
  }
}

export async function listAdminUsers(limit = 100): Promise<AdminUserRow[]> {
  try {
    const pool = getPgPool();
    const result = await pool.query<{
      id: string;
      email: string;
      role: string;
      user_account_status: string;
      penalty_balance_azn: number;
      email_verified: boolean;
      created_at: Date;
      full_name: string | null;
      city: string | null;
    }>(
      `SELECT
         u.id, u.email, u.role, u.user_account_status, u.penalty_balance_azn, u.email_verified, u.created_at,
         up.full_name, up.city
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       ORDER BY u.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role as UserRole,
      userAccountStatus: row.user_account_status,
      penaltyBalanceAzn: row.penalty_balance_azn,
      emailVerified: row.email_verified,
      createdAt: row.created_at.toISOString(),
      fullName: row.full_name ?? undefined,
      city: row.city ?? undefined
    }));
  } catch {
    return [];
  }
}

export async function updateAdminUserRole(userId: string, role: UserRole): Promise<void> {
  const pool = getPgPool();
  await pool.query(`UPDATE users SET role = $2 WHERE id = $1`, [userId, role]);
}

export async function updateAdminUserStatus(userId: string, status: string): Promise<void> {
  const pool = getPgPool();
  await pool.query(`UPDATE users SET user_account_status = $2 WHERE id = $1`, [userId, status]);
}

export async function getFinanceSnapshot(): Promise<FinanceSnapshot> {
  try {
    const pool = getPgPool();
    const [listing, auction, subs] = await Promise.all([
      pool.query<{ total: string }>(
        `SELECT COALESCE(SUM(amount_azn),0)::text AS total
         FROM listing_plan_payments
         WHERE status = 'succeeded'`
      ),
      pool.query<{
        auction_revenue: string;
        obligation_revenue: string;
        bond_revenue: string;
      }>(
        `SELECT
           COALESCE(SUM(amount_azn),0)::text AS auction_revenue,
           COALESCE(SUM(CASE WHEN event_type IN ('no_show_penalty', 'seller_breach_penalty') THEN amount_azn ELSE 0 END),0)::text AS obligation_revenue,
           COALESCE(SUM(CASE WHEN event_type = 'seller_performance_bond' THEN amount_azn ELSE 0 END),0)::text AS bond_revenue
         FROM auction_financial_events
         WHERE status = 'succeeded'`
      )
      ,
      pool.query<{
        active_dealer: string;
        active_parts: string;
        expiring_7d: string;
      }>(
        `SELECT
           SUM(CASE WHEN business_type = 'dealer' AND status = 'active' AND (expires_at IS NULL OR expires_at >= NOW()) THEN 1 ELSE 0 END)::text AS active_dealer,
           SUM(CASE WHEN business_type = 'parts_store' AND status = 'active' AND (expires_at IS NULL OR expires_at >= NOW()) THEN 1 ELSE 0 END)::text AS active_parts,
           SUM(CASE WHEN status = 'active' AND expires_at IS NOT NULL AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days' THEN 1 ELSE 0 END)::text AS expiring_7d
         FROM business_plan_subscriptions`
      )
    ]);
    const listingPlanRevenueAzn = n(listing.rows[0]?.total);
    const auctionRevenueAzn = n(auction.rows[0]?.auction_revenue);
    const obligationRevenueAzn = n(auction.rows[0]?.obligation_revenue);
    const sellerBondRevenueAzn = n(auction.rows[0]?.bond_revenue);
    const activeDealerSubscriptions = n(subs.rows[0]?.active_dealer);
    const activePartsSubscriptions = n(subs.rows[0]?.active_parts);
    const expiringSubscriptions7d = n(subs.rows[0]?.expiring_7d);
    const dealerMrr = activeDealerSubscriptions * (DEALER_PLANS.find((p) => p.id === "baza")?.priceAzn ?? 0);
    const partsMrr = activePartsSubscriptions * (PARTS_STORE_PLANS.find((p) => p.id === "baza")?.priceAzn ?? 0);
    const businessSubscriptionsRevenueAzn = dealerMrr + partsMrr;
    return {
      listingPlanRevenueAzn,
      auctionRevenueAzn,
      obligationRevenueAzn,
      sellerBondRevenueAzn,
      businessSubscriptionsRevenueAzn,
      activeDealerSubscriptions,
      activePartsSubscriptions,
      expiringSubscriptions7d,
      totalRevenueAzn: listingPlanRevenueAzn + auctionRevenueAzn + businessSubscriptionsRevenueAzn
    };
  } catch {
    return {
      listingPlanRevenueAzn: 0,
      auctionRevenueAzn: 0,
      obligationRevenueAzn: 0,
      sellerBondRevenueAzn: 0,
      businessSubscriptionsRevenueAzn: 0,
      activeDealerSubscriptions: 0,
      activePartsSubscriptions: 0,
      expiringSubscriptions7d: 0,
      totalRevenueAzn: 0
    };
  }
}

export async function listSupportAssignableStaff(): Promise<AdminUserLookup[]> {
  try {
    const pool = getPgPool();
    const result = await pool.query<{ id: string; email: string; role: string; full_name: string | null }>(
      `SELECT u.id, u.email, u.role, up.full_name
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE u.role IN ('admin', 'support')
       ORDER BY u.role ASC, u.email ASC`
    );
    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role as UserRole,
      fullName: row.full_name ?? undefined
    }));
  } catch {
    return [];
  }
}

export async function listAdminUsersLookup(query: string, limit = 20): Promise<AdminUserLookup[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  try {
    const pool = getPgPool();
    const result = await pool.query<{ id: string; email: string; role: string }>(
      `
        SELECT id, email, role
        FROM users
        WHERE LOWER(email) LIKE $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      [`%${q}%`, Math.max(1, Math.min(limit, 50))]
    );
    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role as UserRole
    }));
  } catch {
    return [];
  }
}

export async function listAdminBusinessProfilesPaged(input: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<PaginatedResult<AdminBusinessProfileRow>> {
  const page = clampPage(input.page);
  const pageSize = clampPageSize(input.pageSize);
  const offset = (page - 1) * pageSize;
  const where: string[] = [];
  const values: Array<string | number> = [];
  if (input.q?.trim()) {
    values.push(`%${input.q.trim().toLowerCase()}%`);
    where.push(`(
      LOWER(dp.name) LIKE $${values.length}
      OR LOWER(dp.city) LIKE $${values.length}
      OR LOWER(COALESCE(u.email, '')) LIKE $${values.length}
      OR LOWER(COALESCE(dp.website_url, '')) LIKE $${values.length}
    )`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const pool = getPgPool();
  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total
     FROM dealer_profiles dp
     LEFT JOIN users u ON u.id = dp.owner_user_id
     ${whereSql}`,
    values
  );
  values.push(pageSize, offset);
  const result = await pool.query<{
    dealer_id: string;
    owner_user_id: string | null;
    owner_email: string | null;
    name: string;
    city: string;
    verified: boolean;
    logo_url: string | null;
    cover_url: string | null;
    whatsapp_phone: string | null;
    website_url: string | null;
    show_whatsapp: boolean | null;
    show_website: boolean | null;
    dealer_plan_id: string | null;
    parts_plan_id: string | null;
    updated_at: Date;
  }>(
    `
      SELECT
        dp.id AS dealer_id,
        dp.owner_user_id,
        u.email AS owner_email,
        dp.name, dp.city, dp.verified, dp.logo_url, dp.cover_url, dp.whatsapp_phone, dp.website_url,
        dp.show_whatsapp, dp.show_website,
        (
          SELECT s.plan_id
          FROM business_plan_subscriptions s
          WHERE s.owner_user_id = dp.owner_user_id
            AND s.business_type = 'dealer'
            AND s.status = 'active'
            AND (s.expires_at IS NULL OR s.expires_at >= NOW())
          ORDER BY s.updated_at DESC
          LIMIT 1
        ) AS dealer_plan_id,
        (
          SELECT s.plan_id
          FROM business_plan_subscriptions s
          WHERE s.owner_user_id = dp.owner_user_id
            AND s.business_type = 'parts_store'
            AND s.status = 'active'
            AND (s.expires_at IS NULL OR s.expires_at >= NOW())
          ORDER BY s.updated_at DESC
          LIMIT 1
        ) AS parts_plan_id,
        NOW() AS updated_at
      FROM dealer_profiles dp
      LEFT JOIN users u ON u.id = dp.owner_user_id
      ${whereSql}
      ORDER BY dp.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `,
    values
  );
  const total = n(countResult.rows[0]?.total);
  return {
    items: result.rows.map((row) => ({
      dealerId: row.dealer_id,
      ownerUserId: row.owner_user_id ?? undefined,
      ownerEmail: row.owner_email ?? undefined,
      name: row.name,
      city: row.city,
      verified: row.verified,
      logoUrl: row.logo_url ?? undefined,
      coverUrl: row.cover_url ?? undefined,
      whatsappPhone: row.whatsapp_phone ?? undefined,
      websiteUrl: row.website_url ?? undefined,
      showWhatsapp: row.show_whatsapp ?? false,
      showWebsite: row.show_website ?? false,
      dealerPlanId: row.dealer_plan_id ?? undefined,
      partsPlanId: row.parts_plan_id ?? undefined,
      updatedAt: row.updated_at.toISOString()
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function updateAdminBusinessProfile(input: {
  dealerId: string;
  verified?: boolean;
  showWhatsapp?: boolean;
  showWebsite?: boolean;
}): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `
      UPDATE dealer_profiles
      SET
        verified = COALESCE($2, verified),
        show_whatsapp = COALESCE($3, show_whatsapp),
        show_website = COALESCE($4, show_website)
      WHERE id = $1
    `,
    [input.dealerId, input.verified ?? null, input.showWhatsapp ?? null, input.showWebsite ?? null]
  );
}

export async function bulkUpdateAdminBusinessProfiles(input: {
  dealerIds: string[];
  verified?: boolean;
  showWhatsapp?: boolean;
  showWebsite?: boolean;
}): Promise<number> {
  if (input.dealerIds.length === 0) return 0;
  const pool = getPgPool();
  const result = await pool.query(
    `
      UPDATE dealer_profiles
      SET
        verified = COALESCE($2, verified),
        show_whatsapp = COALESCE($3, show_whatsapp),
        show_website = COALESCE($4, show_website)
      WHERE id = ANY($1::text[])
    `,
    [input.dealerIds, input.verified ?? null, input.showWhatsapp ?? null, input.showWebsite ?? null]
  );
  return result.rowCount ?? 0;
}

export async function getCrmSnapshot(): Promise<CrmSnapshot> {
  try {
    const pool = getPgPool();
    const result = await pool.query<{
      total: string;
      lead_new: string;
      lead_progress: string;
      lead_closed: string;
      avg_response: string | null;
    }>(
      `SELECT
         COUNT(*)::text AS total,
         SUM(CASE WHEN stage = 'new' THEN 1 ELSE 0 END)::text AS lead_new,
         SUM(CASE WHEN stage = 'in_progress' THEN 1 ELSE 0 END)::text AS lead_progress,
         SUM(CASE WHEN stage = 'closed' THEN 1 ELSE 0 END)::text AS lead_closed,
         AVG(NULLIF(response_time_minutes, 0))::text AS avg_response
       FROM leads`
    );
    const row = result.rows[0];
    return {
      totalLeads: n(row?.total),
      newLeads: n(row?.lead_new),
      inProgressLeads: n(row?.lead_progress),
      closedLeads: n(row?.lead_closed),
      avgResponseMinutes: Math.round(n(row?.avg_response))
    };
  } catch {
    return {
      totalLeads: 0,
      newLeads: 0,
      inProgressLeads: 0,
      closedLeads: 0,
      avgResponseMinutes: 0
    };
  }
}

export async function getAdminSupportSnapshot(): Promise<AdminSupportSnapshot> {
  try {
    const pool = getPgPool();
    const enrich = await supportEnrichColumnsReady();
    const riskCountSql = enrich
      ? "SUM(CASE WHEN risk_flag <> 'none' THEN 1 ELSE 0 END)::text AS c_risk"
      : "'0'::text AS c_risk";
    const [summary, avgRes, byType, totals] = await Promise.all([
      pool.query<{
        c_new: string;
        c_progress: string;
        c_waiting: string;
        c_resolved: string;
        c_archived: string;
        c_urgent: string;
        c_risk: string;
        c_complaint: string;
      }>(
        `SELECT
           SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)::text AS c_new,
           SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)::text AS c_progress,
           SUM(CASE WHEN status = 'waiting_user' THEN 1 ELSE 0 END)::text AS c_waiting,
           SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END)::text AS c_resolved,
           SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END)::text AS c_archived,
           SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END)::text AS c_urgent,
           ${riskCountSql},
           SUM(CASE WHEN request_type = 'complaint' THEN 1 ELSE 0 END)::text AS c_complaint
         FROM support_requests`
      ),
      pool.query<{ avg_response_hours: string | null }>(
        `SELECT AVG(EXTRACT(EPOCH FROM (response_at - created_at)) / 3600.0)::text AS avg_response_hours
         FROM support_requests
         WHERE response_at IS NOT NULL`
      ),
      pool.query<{ request_type: string; count: string }>(
        `SELECT request_type, COUNT(*)::text AS count
         FROM support_requests
         GROUP BY request_type
         ORDER BY COUNT(*) DESC`
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*)::text AS total FROM support_requests WHERE status <> 'archived'`
      )
    ]);
    const row = summary.rows[0];
    return {
      total: n(totals.rows[0]?.total),
      newCount: n(row?.c_new),
      inProgressCount: n(row?.c_progress),
      waitingUserCount: n(row?.c_waiting),
      resolvedCount: n(row?.c_resolved),
      archivedCount: n(row?.c_archived),
      urgentCount: n(row?.c_urgent),
      riskCount: n(row?.c_risk),
      complaintCount: n(row?.c_complaint),
      avgResponseHours: Math.round(n(avgRes.rows[0]?.avg_response_hours) * 10) / 10,
      byType: byType.rows.map((item) => ({
        requestType: item.request_type,
        count: n(item.count)
      }))
    };
  } catch {
    return {
      total: 0,
      newCount: 0,
      inProgressCount: 0,
      waitingUserCount: 0,
      resolvedCount: 0,
      archivedCount: 0,
      urgentCount: 0,
      riskCount: 0,
      complaintCount: 0,
      avgResponseHours: 0,
      byType: []
    };
  }
}

async function getSupportReporterContext(input: {
  requestId: string;
  reporterUserId?: string | null;
  reporterEmail?: string | null;
  reporterPhone?: string | null;
}): Promise<SupportReporterContext> {
  const pool = getPgPool();
  const context: SupportReporterContext = {
    otherRequestCount: 0,
    openIncidentCount: 0
  };

  if (input.reporterUserId) {
    const userRes = await pool.query<{
      email: string;
      role: string;
      user_account_status: string;
      penalty_balance_azn: number;
      created_at: Date;
    }>(
      `SELECT email, role, user_account_status, penalty_balance_azn, created_at
       FROM users WHERE id = $1 LIMIT 1`,
      [input.reporterUserId]
    );
    const user = userRes.rows[0];
    if (user) {
      context.matchedUserId = input.reporterUserId!;
      context.accountEmail = user.email;
      context.accountRole = user.role;
      context.accountStatus = user.user_account_status;
      context.penaltyBalanceAzn = user.penalty_balance_azn;
      context.accountCreatedAt = user.created_at.toISOString();
    }

    const [otherReqRes, incidentRes] = await Promise.all([
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM support_requests
         WHERE id <> $1 AND reporter_user_id = $2`,
        [input.requestId, input.reporterUserId]
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM incident_cases
         WHERE reporter_user_id = $1 AND status NOT IN ('resolved', 'dismissed')`,
        [input.reporterUserId]
      ).catch(() => ({ rows: [{ count: "0" }] }))
    ]);
    context.otherRequestCount = n(otherReqRes.rows[0]?.count);
    context.openIncidentCount = n(incidentRes.rows[0]?.count);
    return context;
  }

  await applyEmailUserMatch(input.reporterEmail, context);

  const identityFilters: string[] = [];
  const values: string[] = [input.requestId];
  if (input.reporterEmail?.trim()) {
    values.push(input.reporterEmail.trim().toLowerCase());
    identityFilters.push(`LOWER(COALESCE(reporter_email, '')) = $${values.length}`);
  }
  if (input.reporterPhone?.trim()) {
    values.push(input.reporterPhone.trim());
    identityFilters.push(`COALESCE(reporter_phone, '') = $${values.length}`);
  }
  if (identityFilters.length === 0) {
    return context;
  }

  const otherReqRes = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM support_requests
     WHERE id <> $1 AND (${identityFilters.join(" OR ")})`,
    values
  );
  context.otherRequestCount = n(otherReqRes.rows[0]?.count);
  return context;
}

async function applyEmailUserMatch(
  reporterEmail: string | null | undefined,
  context: SupportReporterContext
): Promise<void> {
  if (context.matchedUserId || !reporterEmail?.trim()) return;
  const pool = getPgPool();
  const match = await pool.query<{ id: string; email: string; role: string; user_account_status: string; penalty_balance_azn: number; created_at: Date }>(
    `SELECT id, email, role, user_account_status, penalty_balance_azn, created_at
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [reporterEmail.trim()]
  );
  const user = match.rows[0];
  if (!user) return;
  context.matchedUserId = user.id;
  context.accountEmail = user.email;
  context.accountRole = user.role;
  context.accountStatus = user.user_account_status;
  context.penaltyBalanceAzn = user.penalty_balance_azn;
  context.accountCreatedAt = user.created_at.toISOString();
}

function requestGroupTypes(groupId: string): string[] {
  return REQUEST_TYPE_GROUPS.find((group) => group.id === groupId)?.types ?? [];
}

function mapSupportRow(row: {
  id: string;
  request_type: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  source: string;
  reporter_user_id: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  reporter_phone: string | null;
  reporter_ip?: string | null;
  reporter_user_agent?: string | null;
  listing_id: string | null;
  assigned_to_user_id: string | null;
  assigned_to_email: string | null;
  admin_response: string | null;
  internal_notes?: string | null;
  risk_flag?: string | null;
  response_at: Date | null;
  resolved_at: Date | null;
  archived_at?: Date | null;
  last_activity_at: Date;
  created_at: Date;
}): AdminSupportRequestRow {
  return {
    id: row.id,
    requestType: row.request_type,
    subject: row.subject,
    message: row.message,
    status: row.status,
    priority: row.priority,
    source: row.source,
    reporterUserId: row.reporter_user_id ?? undefined,
    reporterName: row.reporter_name ?? undefined,
    reporterEmail: row.reporter_email ?? undefined,
    reporterPhone: row.reporter_phone ?? undefined,
    reporterIp: row.reporter_ip ?? undefined,
    reporterUserAgent: row.reporter_user_agent ?? undefined,
    listingId: row.listing_id ?? undefined,
    assignedToUserId: row.assigned_to_user_id ?? undefined,
    assignedToEmail: row.assigned_to_email ?? undefined,
    adminResponse: row.admin_response ?? undefined,
    internalNotes: row.internal_notes ?? undefined,
    riskFlag: row.risk_flag ?? "none",
    responseAt: row.response_at ? row.response_at.toISOString() : undefined,
    resolvedAt: row.resolved_at ? row.resolved_at.toISOString() : undefined,
    archivedAt: row.archived_at ? row.archived_at.toISOString() : undefined,
    lastActivityAt: row.last_activity_at.toISOString(),
    createdAt: row.created_at.toISOString()
  };
}

export async function getAdminSupportRequestById(id: string): Promise<AdminSupportRequestRow | null> {
  const pool = getPgPool();
  const enrichSelect = await supportEnrichSelectSql("sr");
  const archiveSelect = (await supportArchiveColumnsReady()) ? "sr.archived_at" : "NULL::timestamptz AS archived_at";
  const result = await pool.query<{
    id: string;
    request_type: string;
    subject: string;
    message: string;
    status: string;
    priority: string;
    source: string;
    reporter_user_id: string | null;
    reporter_name: string | null;
    reporter_email: string | null;
    reporter_phone: string | null;
    reporter_ip: string | null;
    reporter_user_agent: string | null;
    listing_id: string | null;
    assigned_to_user_id: string | null;
    assigned_to_email: string | null;
    admin_response: string | null;
    internal_notes: string | null;
    risk_flag: string | null;
    response_at: Date | null;
    resolved_at: Date | null;
    last_activity_at: Date;
    created_at: Date;
  }>(
    `SELECT
       sr.id, sr.request_type, sr.subject, sr.message, sr.status, sr.priority, sr.source,
       sr.reporter_user_id, sr.reporter_name, sr.reporter_email, sr.reporter_phone,
       ${enrichSelect}, sr.listing_id,
       sr.assigned_to_user_id, au.email AS assigned_to_email,
       sr.admin_response,
       sr.response_at, sr.resolved_at, ${archiveSelect}, sr.last_activity_at, sr.created_at
     FROM support_requests sr
     LEFT JOIN users au ON au.id = sr.assigned_to_user_id
     WHERE sr.id = $1
     LIMIT 1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  const mapped = mapSupportRow(row);
  mapped.reporterContext = await getSupportReporterContext({
    requestId: row.id,
    reporterUserId: row.reporter_user_id,
    reporterEmail: row.reporter_email,
    reporterPhone: row.reporter_phone
  });
  return mapped;
}

export async function listAdminSupportRequestsPaged(input: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  priority?: string;
  requestType?: string;
  requestGroup?: string;
  riskFlag?: string;
  assigned?: "yes" | "no";
  sortDir?: "asc" | "desc";
}): Promise<PaginatedResult<AdminSupportRequestRow>> {
  const page = clampPage(input.page);
  const pageSize = clampPageSize(input.pageSize);
  try {
  return await listAdminSupportRequestsPagedInternal({ ...input, page, pageSize });
  } catch (error) {
    console.error("listAdminSupportRequestsPaged failed:", error);
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }
}

async function listAdminSupportRequestsPagedInternal(input: {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
  priority?: string;
  requestType?: string;
  requestGroup?: string;
  riskFlag?: string;
  assigned?: "yes" | "no";
  sortDir?: "asc" | "desc";
}): Promise<PaginatedResult<AdminSupportRequestRow>> {
  const page = input.page;
  const pageSize = input.pageSize;
  const offset = (page - 1) * pageSize;
  const where: string[] = [];
  const values: Array<string | number> = [];
  if (input.q?.trim()) {
    values.push(`%${input.q.trim().toLowerCase()}%`);
    where.push(`(
      LOWER(sr.subject) LIKE $${values.length}
      OR LOWER(sr.message) LIKE $${values.length}
      OR LOWER(COALESCE(sr.reporter_name, '')) LIKE $${values.length}
      OR LOWER(COALESCE(sr.reporter_email, '')) LIKE $${values.length}
      OR LOWER(COALESCE(sr.reporter_phone, '')) LIKE $${values.length}
      OR LOWER(COALESCE(au.email, '')) LIKE $${values.length}
    )`);
  }
  if (input.status?.trim()) {
    values.push(input.status.trim());
    where.push(`sr.status = $${values.length}`);
  } else {
    where.push(`sr.status <> 'archived'`);
  }
  if (input.priority?.trim()) {
    values.push(input.priority.trim());
    where.push(`sr.priority = $${values.length}`);
  }
  if (input.requestType?.trim()) {
    values.push(input.requestType.trim());
    where.push(`sr.request_type = $${values.length}`);
  }
  if (input.requestGroup?.trim()) {
    const groupTypes = requestGroupTypes(input.requestGroup.trim());
    if (groupTypes.length > 0) {
      const placeholders = groupTypes.map((type) => {
        values.push(type);
        return `$${values.length}`;
      });
      where.push(`sr.request_type IN (${placeholders.join(", ")})`);
    }
  }
  if (input.riskFlag?.trim() && (await supportEnrichColumnsReady())) {
    values.push(input.riskFlag.trim());
    where.push(`sr.risk_flag = $${values.length}`);
  }
  if (input.assigned === "yes") where.push(`sr.assigned_to_user_id IS NOT NULL`);
  if (input.assigned === "no") where.push(`sr.assigned_to_user_id IS NULL`);
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sortDir = input.sortDir === "asc" ? "ASC" : "DESC";
  const pool = getPgPool();
  const enrichSelect = await supportEnrichSelectSql("sr");
  const archiveSelect = (await supportArchiveColumnsReady()) ? "sr.archived_at" : "NULL::timestamptz AS archived_at";
  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total
     FROM support_requests sr
     LEFT JOIN users au ON au.id = sr.assigned_to_user_id
     ${whereSql}`,
    values
  );
  values.push(pageSize, offset);
  const result = await pool.query<{
    id: string;
    request_type: string;
    subject: string;
    message: string;
    status: string;
    priority: string;
    source: string;
    reporter_user_id: string | null;
    reporter_name: string | null;
    reporter_email: string | null;
    reporter_phone: string | null;
    reporter_ip: string | null;
    reporter_user_agent: string | null;
    listing_id: string | null;
    assigned_to_user_id: string | null;
    assigned_to_email: string | null;
    admin_response: string | null;
    internal_notes: string | null;
    risk_flag: string | null;
    response_at: Date | null;
    resolved_at: Date | null;
    archived_at: Date | null;
    last_activity_at: Date;
    created_at: Date;
  }>(
    `SELECT
       sr.id, sr.request_type, sr.subject, sr.message, sr.status, sr.priority, sr.source,
       sr.reporter_user_id, sr.reporter_name, sr.reporter_email, sr.reporter_phone,
       ${enrichSelect}, sr.listing_id,
       sr.assigned_to_user_id, au.email AS assigned_to_email,
       sr.admin_response,
       sr.response_at, sr.resolved_at, ${archiveSelect}, sr.last_activity_at, sr.created_at
     FROM support_requests sr
     LEFT JOIN users au ON au.id = sr.assigned_to_user_id
     ${whereSql}
     ORDER BY sr.last_activity_at ${sortDir}
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  const total = n(countResult.rows[0]?.total);
  const items = await Promise.all(
    result.rows.map(async (row) => {
      const mapped = mapSupportRow(row);
      mapped.reporterContext = await getSupportReporterContext({
        requestId: row.id,
        reporterUserId: row.reporter_user_id,
        reporterEmail: row.reporter_email,
        reporterPhone: row.reporter_phone
      });
      return mapped;
    })
  );
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function updateAdminSupportRequest(input: {
  id: string;
  status?: string;
  priority?: string;
  assignedToUserId?: string | null;
  assigneeProvided?: boolean;
  adminResponse?: string;
  internalNotes?: string;
  internalNotesProvided?: boolean;
  riskFlag?: string;
}): Promise<void> {
  const pool = getPgPool();
  const enrich = await supportEnrichColumnsReady();
  const archive = await supportArchiveColumnsReady();
  const archivedAtSql = archive
    ? "archived_at = CASE WHEN $2 = 'archived' THEN NOW() WHEN $2 IS NOT NULL AND $2 <> 'archived' THEN NULL ELSE archived_at END,"
    : "";
  if (enrich) {
    await pool.query(
      `UPDATE support_requests
       SET
         status = COALESCE($2, status),
         priority = COALESCE($3, priority),
         assigned_to_user_id = CASE WHEN $6 THEN $4 ELSE assigned_to_user_id END,
         admin_response = COALESCE($5, admin_response),
         internal_notes = CASE WHEN $8 THEN $7 ELSE internal_notes END,
         risk_flag = COALESCE($9, risk_flag),
         response_at = CASE WHEN $5 IS NULL THEN response_at ELSE NOW() END,
         resolved_at = CASE WHEN $2 IN ('resolved', 'closed') THEN NOW() WHEN $2 = 'archived' THEN resolved_at ELSE resolved_at END,
         ${archivedAtSql}
         last_activity_at = NOW(),
         updated_at = NOW()
       WHERE id = $1`,
      [
        input.id,
        input.status ?? null,
        input.priority ?? null,
        input.assignedToUserId ?? null,
        input.adminResponse ?? null,
        input.assigneeProvided ?? false,
        input.internalNotes ?? null,
        input.internalNotesProvided ?? false,
        input.riskFlag ?? null
      ]
    );
    return;
  }

  await pool.query(
    `UPDATE support_requests
     SET
       status = COALESCE($2, status),
       priority = COALESCE($3, priority),
       assigned_to_user_id = CASE WHEN $6 THEN $4 ELSE assigned_to_user_id END,
       admin_response = COALESCE($5, admin_response),
       response_at = CASE WHEN $5 IS NULL THEN response_at ELSE NOW() END,
       resolved_at = CASE WHEN $2 IN ('resolved', 'closed') THEN NOW() WHEN $2 = 'archived' THEN resolved_at ELSE resolved_at END,
       ${archivedAtSql}
       last_activity_at = NOW(),
       updated_at = NOW()
     WHERE id = $1`,
    [
      input.id,
      input.status ?? null,
      input.priority ?? null,
      input.assignedToUserId ?? null,
      input.adminResponse ?? null,
      input.assigneeProvided ?? false
    ]
  );
}

export async function autoArchiveStaleSupportRequests(): Promise<number> {
  if (!(await supportArchiveColumnsReady())) return 0;
  const pool = getPgPool();
  const result = await pool.query(
    `UPDATE support_requests
     SET status = 'archived', archived_at = NOW(), updated_at = NOW()
     WHERE status IN ('resolved', 'closed')
       AND archived_at IS NULL
       AND COALESCE(resolved_at, last_activity_at) < NOW() - ($1::text || ' days')::INTERVAL`,
    [SUPPORT_ARCHIVE_AFTER_DAYS]
  );
  return result.rowCount ?? 0;
}

export async function deleteArchivedSupportRequests(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const pool = getPgPool();
  const result = await pool.query(
    `DELETE FROM support_requests WHERE id = ANY($1::text[]) AND status = 'archived'`,
    [ids]
  );
  return result.rowCount ?? 0;
}

export async function listAdminLeads(limit = 100): Promise<AdminLeadRow[]> {
  try {
    const pool = getPgPool();
    const result = await pool.query<{
      id: string;
      customer_name: string;
      customer_phone: string | null;
      customer_email: string | null;
      stage: string;
      source: string;
      response_time_minutes: number | null;
      created_at: Date;
      title: string | null;
    }>(
      `SELECT
         l.id, l.customer_name, l.customer_phone, l.customer_email, l.stage, l.source, l.response_time_minutes, l.created_at,
         x.title
       FROM leads l
       LEFT JOIN listings x ON x.id = l.listing_id
       ORDER BY l.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => ({
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone ?? undefined,
      customerEmail: row.customer_email ?? undefined,
      stage: row.stage,
      source: row.source,
      responseTimeMinutes: row.response_time_minutes ?? undefined,
      createdAt: row.created_at.toISOString(),
      listingTitle: row.title ?? undefined
    }));
  } catch {
    return [];
  }
}

export async function listAdminListings(limit = 120): Promise<AdminListingRow[]> {
  try {
    const pool = getPgPool();
    const result = await pool.query<{
      id: string;
      title: string;
      status: string;
      seller_type: string;
      listing_kind: string | null;
      price_azn: number;
      city: string;
      year: number;
      plan_type: string | null;
      created_at: Date;
    }>(
      `SELECT id, title, status, seller_type, listing_kind, price_azn, city, year, plan_type, created_at
       FROM listings
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      sellerType: row.seller_type,
      listingKind: row.listing_kind === "part" ? "part" : "vehicle",
      priceAzn: row.price_azn,
      city: row.city,
      year: row.year,
      planType: row.plan_type ?? undefined,
      createdAt: row.created_at.toISOString()
    }));
  } catch {
    return [];
  }
}

function clampPage(page?: number): number {
  return Math.max(1, page ?? 1);
}

function clampPageSize(pageSize?: number): number {
  return Math.min(100, Math.max(10, pageSize ?? 25));
}

export async function listAdminUsersPaged(input: {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: string;
  status?: string;
  sortBy?: "created_at" | "email" | "penalty_balance_azn";
  sortDir?: "asc" | "desc";
}): Promise<PaginatedResult<AdminUserRow>> {
  const page = clampPage(input.page);
  const pageSize = clampPageSize(input.pageSize);
  const offset = (page - 1) * pageSize;
  const where: string[] = [];
  const values: Array<string | number> = [];
  if (input.q?.trim()) {
    values.push(`%${input.q.trim().toLowerCase()}%`);
    where.push(`(
      LOWER(u.email) LIKE $${values.length}
      OR LOWER(COALESCE(up.full_name, '')) LIKE $${values.length}
      OR LOWER(COALESCE(up.city, '')) LIKE $${values.length}
    )`);
  }
  if (input.role?.trim()) {
    values.push(input.role.trim());
    where.push(`u.role = $${values.length}`);
  }
  if (input.status?.trim()) {
    values.push(input.status.trim());
    where.push(`u.user_account_status = $${values.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sortBy = input.sortBy === "email" ? "u.email" : input.sortBy === "penalty_balance_azn" ? "u.penalty_balance_azn" : "u.created_at";
  const sortDir = input.sortDir === "asc" ? "ASC" : "DESC";
  const pool = getPgPool();
  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total
     FROM users u
     LEFT JOIN user_profiles up ON up.user_id = u.id
     ${whereSql}`,
    values
  );
  values.push(pageSize, offset);
  const result = await pool.query<{
    id: string;
    email: string;
    role: string;
    user_account_status: string;
    penalty_balance_azn: number;
    email_verified: boolean;
    created_at: Date;
    full_name: string | null;
    city: string | null;
  }>(
    `SELECT
      u.id, u.email, u.role, u.user_account_status, u.penalty_balance_azn, u.email_verified, u.created_at,
      up.full_name, up.city
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    ${whereSql}
    ORDER BY ${sortBy} ${sortDir}
    LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  const total = n(countResult.rows[0]?.total);
  return {
    items: result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role as UserRole,
      userAccountStatus: row.user_account_status,
      penaltyBalanceAzn: row.penalty_balance_azn,
      emailVerified: row.email_verified,
      createdAt: row.created_at.toISOString(),
      fullName: row.full_name ?? undefined,
      city: row.city ?? undefined
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function bulkUpdateAdminUserStatus(userIds: string[], status: string): Promise<number> {
  if (userIds.length === 0) return 0;
  const pool = getPgPool();
  const result = await pool.query(
    `UPDATE users
     SET user_account_status = $2
     WHERE id = ANY($1::text[])`,
    [userIds, status]
  );
  return result.rowCount ?? 0;
}

export async function listAdminListingsPaged(input: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  listingKind?: string;
  sellerType?: string;
  city?: string;
  sortBy?: "created_at" | "price_azn" | "year";
  sortDir?: "asc" | "desc";
}): Promise<PaginatedResult<AdminListingRow>> {
  const page = clampPage(input.page);
  const pageSize = clampPageSize(input.pageSize);
  const offset = (page - 1) * pageSize;
  const where: string[] = [];
  const values: Array<string | number> = [];
  if (input.q?.trim()) {
    values.push(`%${input.q.trim().toLowerCase()}%`);
    where.push(`(
      LOWER(title) LIKE $${values.length}
      OR LOWER(make) LIKE $${values.length}
      OR LOWER(model) LIKE $${values.length}
      OR LOWER(vin) LIKE $${values.length}
    )`);
  }
  if (input.status?.trim()) {
    values.push(input.status.trim());
    where.push(`status = $${values.length}`);
  }
  if (input.listingKind?.trim()) {
    values.push(input.listingKind.trim());
    where.push(`listing_kind = $${values.length}`);
  }
  if (input.sellerType?.trim()) {
    values.push(input.sellerType.trim());
    where.push(`seller_type = $${values.length}`);
  }
  if (input.city?.trim()) {
    values.push(input.city.trim());
    where.push(`city = $${values.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sortBy =
    input.sortBy === "price_azn" ? "price_azn" : input.sortBy === "year" ? "year" : "created_at";
  const sortDir = input.sortDir === "asc" ? "ASC" : "DESC";
  const pool = getPgPool();
  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM listings ${whereSql}`,
    values
  );
  values.push(pageSize, offset);
  const result = await pool.query<{
    id: string;
    title: string;
    status: string;
    seller_type: string;
    listing_kind: string | null;
    price_azn: number;
    city: string;
    year: number;
    plan_type: string | null;
    created_at: Date;
  }>(
    `SELECT id, title, status, seller_type, listing_kind, price_azn, city, year, plan_type, created_at
     FROM listings
     ${whereSql}
     ORDER BY ${sortBy} ${sortDir}
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  const total = n(countResult.rows[0]?.total);
  return {
    items: result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      sellerType: row.seller_type,
      listingKind: row.listing_kind === "part" ? "part" : "vehicle",
      priceAzn: row.price_azn,
      city: row.city,
      year: row.year,
      planType: row.plan_type ?? undefined,
      createdAt: row.created_at.toISOString()
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function bulkUpdateListingStatus(listingIds: string[], status: string): Promise<number> {
  if (listingIds.length === 0) return 0;
  const pool = getPgPool();
  const result = await pool.query(
    `
      UPDATE listings l
      SET
        status = $2,
        updated_at = NOW(),
        plan_expires_at = CASE
          WHEN $2 = 'active' THEN
            CASE COALESCE(l.plan_type, 'free')
              WHEN 'vip' THEN NOW() + INTERVAL '90 days'
              WHEN 'standard' THEN NOW() + INTERVAL '60 days'
              ELSE NOW() + INTERVAL '30 days'
            END
          ELSE l.plan_expires_at
        END
      WHERE l.id = ANY($1::text[])
        AND (
          $2 <> 'active'
          OR COALESCE(l.plan_type, 'free') <> 'free'
          OR l.owner_user_id IS NULL
          OR (
            SELECT COUNT(*)
            FROM listings x
            WHERE x.owner_user_id = l.owner_user_id
              AND x.id <> l.id
              AND COALESCE(x.plan_type, 'free') = 'free'
              AND x.status = 'active'
          ) = 0
        )
    `,
    [listingIds, status]
  );
  return result.rowCount ?? 0;
}

export async function getAdminListing(id: string): Promise<AdminListingRow & {
  description: string;
  make: string;
  model: string;
  vin: string | null;
  ownerUserId: string | null;
  ownerEmail: string | null;
} | null> {
  const pool = getPgPool();
  const result = await pool.query<{
    id: string;
    title: string;
    status: string;
    seller_type: string;
    listing_kind: string | null;
    price_azn: number;
    city: string;
    year: number;
    plan_type: string | null;
    created_at: Date;
    description: string;
    make: string;
    model: string;
    vin: string | null;
    owner_user_id: string | null;
    owner_email: string | null;
  }>(
    `SELECT l.id, l.title, l.status, l.seller_type, l.listing_kind, l.price_azn, l.city, l.year,
            l.plan_type, l.created_at, l.description, l.make, l.model, l.vin, l.owner_user_id,
            u.email AS owner_email
     FROM listings l
     LEFT JOIN users u ON u.id = l.owner_user_id
     WHERE l.id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    sellerType: row.seller_type,
    listingKind: row.listing_kind === "part" ? "part" : "vehicle",
    priceAzn: row.price_azn,
    city: row.city,
    year: row.year,
    planType: row.plan_type ?? undefined,
    createdAt: row.created_at.toISOString(),
    description: row.description,
    make: row.make,
    model: row.model,
    vin: row.vin,
    ownerUserId: row.owner_user_id,
    ownerEmail: row.owner_email
  };
}

export async function updateSingleAdminListing(id: string, updates: {
  status?: string;
  priceAzn?: number;
  title?: string;
  city?: string;
}): Promise<boolean> {
  const pool = getPgPool();
  const sets: string[] = ["updated_at = NOW()"];
  const values: (string | number)[] = [];

  if (updates.status !== undefined) {
    values.push(updates.status);
    sets.push(`status = $${values.length}`);
    if (updates.status === "active") {
      sets.push(`plan_expires_at = CASE COALESCE(plan_type, 'free')
        WHEN 'vip' THEN NOW() + INTERVAL '90 days'
        WHEN 'standard' THEN NOW() + INTERVAL '60 days'
        ELSE NOW() + INTERVAL '30 days'
      END`);
    }
  }
  if (updates.priceAzn !== undefined) {
    values.push(updates.priceAzn);
    sets.push(`price_azn = $${values.length}`);
  }
  if (updates.title !== undefined) {
    values.push(updates.title);
    sets.push(`title = $${values.length}`);
  }
  if (updates.city !== undefined) {
    values.push(updates.city);
    sets.push(`city = $${values.length}`);
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE listings SET ${sets.join(", ")} WHERE id = $${values.length}`,
    values
  );
  return (result.rowCount ?? 0) > 0;
}

export async function deleteAdminListing(id: string): Promise<boolean> {
  const pool = getPgPool();
  await pool.query("DELETE FROM listing_trust_signals WHERE listing_id = $1", [id]);
  await pool.query("DELETE FROM listing_media WHERE listing_id = $1", [id]);
  await pool.query("DELETE FROM listing_service_records WHERE listing_id = $1", [id]);
  const result = await pool.query("DELETE FROM listings WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function listAdminLeadsPaged(input: {
  page?: number;
  pageSize?: number;
  q?: string;
  stage?: string;
  source?: string;
  sortDir?: "asc" | "desc";
}): Promise<PaginatedResult<AdminLeadRow>> {
  const page = clampPage(input.page);
  const pageSize = clampPageSize(input.pageSize);
  const offset = (page - 1) * pageSize;
  const where: string[] = [];
  const values: Array<string | number> = [];
  if (input.q?.trim()) {
    values.push(`%${input.q.trim().toLowerCase()}%`);
    where.push(`(
      LOWER(l.customer_name) LIKE $${values.length}
      OR LOWER(COALESCE(l.customer_phone, '')) LIKE $${values.length}
      OR LOWER(COALESCE(l.customer_email, '')) LIKE $${values.length}
      OR LOWER(COALESCE(x.title, '')) LIKE $${values.length}
    )`);
  }
  if (input.stage?.trim()) {
    values.push(input.stage.trim());
    where.push(`l.stage = $${values.length}`);
  }
  if (input.source?.trim()) {
    values.push(input.source.trim());
    where.push(`l.source = $${values.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sortDir = input.sortDir === "asc" ? "ASC" : "DESC";
  const pool = getPgPool();
  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total
     FROM leads l
     LEFT JOIN listings x ON x.id = l.listing_id
     ${whereSql}`,
    values
  );
  values.push(pageSize, offset);
  const result = await pool.query<{
    id: string;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string | null;
    stage: string;
    source: string;
    response_time_minutes: number | null;
    created_at: Date;
    title: string | null;
  }>(
    `SELECT
      l.id, l.customer_name, l.customer_phone, l.customer_email, l.stage, l.source, l.response_time_minutes, l.created_at,
      x.title
     FROM leads l
     LEFT JOIN listings x ON x.id = l.listing_id
     ${whereSql}
     ORDER BY l.created_at ${sortDir}
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  const total = n(countResult.rows[0]?.total);
  return {
    items: result.rows.map((row) => ({
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone ?? undefined,
      customerEmail: row.customer_email ?? undefined,
      stage: row.stage,
      source: row.source,
      responseTimeMinutes: row.response_time_minutes ?? undefined,
      createdAt: row.created_at.toISOString(),
      listingTitle: row.title ?? undefined
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function bulkUpdateLeadStage(leadIds: string[], stage: string): Promise<number> {
  if (leadIds.length === 0) return 0;
  const pool = getPgPool();
  const result = await pool.query(
    `UPDATE leads
     SET stage = $2, updated_at = NOW()
     WHERE id = ANY($1::text[])`,
    [leadIds, stage]
  );
  return result.rowCount ?? 0;
}

export async function listAdminAuctionsPaged(input: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  mode?: string;
  freezeBidding?: "true" | "false";
  sortDir?: "asc" | "desc";
}): Promise<PaginatedResult<AdminAuctionRow>> {
  const page = clampPage(input.page);
  const pageSize = clampPageSize(input.pageSize);
  const offset = (page - 1) * pageSize;
  const where: string[] = [];
  const values: Array<string | number> = [];
  if (input.q?.trim()) {
    values.push(`%${input.q.trim().toLowerCase()}%`);
    where.push(`(
      LOWER(al.title_snapshot) LIKE $${values.length}
      OR LOWER(al.id) LIKE $${values.length}
      OR LOWER(al.seller_user_id) LIKE $${values.length}
    )`);
  }
  if (input.status?.trim()) {
    values.push(input.status.trim());
    where.push(`al.status = $${values.length}`);
  }
  if (input.mode?.trim()) {
    values.push(input.mode.trim());
    where.push(`al.mode = $${values.length}`);
  }
  if (input.freezeBidding === "true") {
    where.push(`COALESCE(ac.freeze_bidding, false) = true`);
  } else if (input.freezeBidding === "false") {
    where.push(`COALESCE(ac.freeze_bidding, false) = false`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sortDir = input.sortDir === "asc" ? "ASC" : "DESC";
  const pool = getPgPool();
  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total
     FROM auction_listings al
     LEFT JOIN auction_admin_controls ac ON ac.auction_id = al.id
     ${whereSql}`,
    values
  );
  values.push(pageSize, offset);
  const result = await pool.query<{
    id: string;
    title_snapshot: string;
    status: string;
    mode: string;
    current_bid_azn: number | null;
    starting_bid_azn: number;
    seller_user_id: string;
    winner_user_id: string | null;
    ends_at: Date;
    updated_at: Date;
    freeze_bidding: boolean | null;
    force_manual_review: boolean | null;
    note: string | null;
  }>(
    `SELECT
      al.id, al.title_snapshot, al.status, al.mode, al.current_bid_azn, al.starting_bid_azn,
      al.seller_user_id, al.winner_user_id, al.ends_at, al.updated_at,
      ac.freeze_bidding, ac.force_manual_review, ac.note
     FROM auction_listings al
     LEFT JOIN auction_admin_controls ac ON ac.auction_id = al.id
     ${whereSql}
     ORDER BY al.updated_at ${sortDir}
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  const total = n(countResult.rows[0]?.total);
  return {
    items: result.rows.map((row) => ({
      id: row.id,
      titleSnapshot: row.title_snapshot,
      status: row.status,
      mode: row.mode,
      currentBidAzn: row.current_bid_azn ?? undefined,
      startingBidAzn: row.starting_bid_azn,
      sellerUserId: row.seller_user_id,
      winnerUserId: row.winner_user_id ?? undefined,
      endsAt: row.ends_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      freezeBidding: row.freeze_bidding ?? false,
      forceManualReview: row.force_manual_review ?? false,
      controlNote: row.note ?? undefined
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function setAuctionAdminControls(input: {
  auctionId: string;
  actorUserId?: string;
  freezeBidding?: boolean;
  forceManualReview?: boolean;
  note?: string;
}): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `INSERT INTO auction_admin_controls (auction_id, freeze_bidding, force_manual_review, note, updated_by_user_id, updated_at)
     VALUES ($1, COALESCE($2, false), COALESCE($3, false), $4, $5, NOW())
     ON CONFLICT (auction_id) DO UPDATE SET
       freeze_bidding = COALESCE($2, auction_admin_controls.freeze_bidding),
       force_manual_review = COALESCE($3, auction_admin_controls.force_manual_review),
       note = COALESCE($4, auction_admin_controls.note),
       updated_by_user_id = COALESCE($5, auction_admin_controls.updated_by_user_id),
       updated_at = NOW()`,
    [input.auctionId, input.freezeBidding ?? null, input.forceManualReview ?? null, input.note ?? null, input.actorUserId ?? null]
  );
}

export async function getAuctionAdminControl(auctionId: string): Promise<{ freezeBidding: boolean; forceManualReview: boolean; note?: string } | null> {
  const pool = getPgPool();
  const result = await pool.query<{ freeze_bidding: boolean; force_manual_review: boolean; note: string | null }>(
    `SELECT freeze_bidding, force_manual_review, note
     FROM auction_admin_controls
     WHERE auction_id = $1
     LIMIT 1`,
    [auctionId]
  );
  if (!result.rows[0]) return null;
  return {
    freezeBidding: result.rows[0].freeze_bidding,
    forceManualReview: result.rows[0].force_manual_review,
    note: result.rows[0].note ?? undefined
  };
}

export async function getAdminUserMembershipProfile(userId: string): Promise<AdminUserMembershipProfile | null> {
  const pool = getPgPool();
  const userRes = await pool.query<{
    id: string;
    email: string;
    role: string;
    user_account_status: string;
    penalty_balance_azn: number;
    email_verified: boolean;
    phone: string | null;
    is_identity_verified: boolean;
    created_at: Date;
    full_name: string | null;
    city: string | null;
  }>(
    `SELECT
       u.id, u.email, u.role, u.user_account_status, u.penalty_balance_azn, u.email_verified,
       u.phone, u.is_identity_verified, u.created_at, up.full_name, up.city
     FROM users u
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId]
  );
  const userRow = userRes.rows[0];
  if (!userRow) return null;

  const [dealerRes, subsRes, listingsRes, invoicesRes, supportRes] = await Promise.all([
    pool.query<{ id: string; name: string; city: string; verified: boolean }>(
      `SELECT id, name, city, verified FROM dealer_profiles WHERE owner_user_id = $1 LIMIT 1`,
      [userId]
    ),
    pool.query<{
      id: string;
      business_type: string;
      plan_id: string;
      status: string;
      starts_at: Date | null;
      expires_at: Date | null;
    }>(
      `SELECT id, business_type, plan_id, status, starts_at, expires_at
       FROM business_plan_subscriptions
       WHERE owner_user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    ),
    pool.query<{
      id: string;
      title: string;
      status: string;
      listing_kind: string | null;
      seller_type: string;
      plan_type: string | null;
      plan_expires_at: Date | null;
      price_azn: number;
      city: string;
      created_at: Date;
    }>(
      `SELECT l.id, l.title, l.status, l.listing_kind, l.seller_type, l.plan_type, l.plan_expires_at, l.price_azn, l.city, l.created_at
       FROM listings l
       WHERE l.owner_user_id = $1 OR l.dealer_profile_id IN (
         SELECT id FROM dealer_profiles WHERE owner_user_id = $1
       )
       ORDER BY l.created_at DESC
       LIMIT 100`,
      [userId]
    ),
    pool.query<{
      id: string;
      invoice_number: string;
      payment_type: string;
      amount_azn: number;
      description: string;
      issued_at: Date;
    }>(
      `SELECT id, invoice_number, payment_type, amount_azn, description, issued_at
       FROM invoices
       WHERE user_id = $1
       ORDER BY issued_at DESC
       LIMIT 20`,
      [userId]
    ),
    pool.query<{
      id: string;
      subject: string;
      request_type: string;
      status: string;
      listing_id: string | null;
      created_at: Date;
    }>(
      `SELECT id, subject, request_type, status, listing_id, created_at
       FROM support_requests
       WHERE reporter_user_id = $1 OR LOWER(COALESCE(reporter_email, '')) = LOWER($2)
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId, userRow.email]
    )
  ]);

  const listings = listingsRes.rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    listingKind: row.listing_kind ?? "vehicle",
    sellerType: row.seller_type,
    planType: row.plan_type ?? undefined,
    planExpiresAt: row.plan_expires_at ? row.plan_expires_at.toISOString() : undefined,
    priceAzn: row.price_azn,
    city: row.city,
    createdAt: row.created_at.toISOString()
  }));

  return {
    user: {
      id: userRow.id,
      email: userRow.email,
      role: userRow.role as UserRole,
      userAccountStatus: userRow.user_account_status,
      penaltyBalanceAzn: userRow.penalty_balance_azn,
      emailVerified: userRow.email_verified,
      createdAt: userRow.created_at.toISOString(),
      fullName: userRow.full_name ?? undefined,
      city: userRow.city ?? undefined,
      phone: userRow.phone ?? undefined,
      isIdentityVerified: userRow.is_identity_verified
    },
    dealerProfile: dealerRes.rows[0]
      ? {
          id: dealerRes.rows[0].id,
          name: dealerRes.rows[0].name,
          city: dealerRes.rows[0].city,
          verified: dealerRes.rows[0].verified
        }
      : undefined,
    subscriptions: subsRes.rows.map((row) => ({
      id: row.id,
      businessType: row.business_type,
      planId: row.plan_id,
      status: row.status,
      startsAt: row.starts_at?.toISOString(),
      expiresAt: row.expires_at?.toISOString()
    })),
    listings,
    invoices: invoicesRes.rows.map((row) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      paymentType: row.payment_type,
      amountAzn: Number(row.amount_azn),
      description: row.description,
      issuedAt: row.issued_at.toISOString()
    })),
    supportRequests: supportRes.rows.map((row) => ({
      id: row.id,
      subject: row.subject,
      requestType: row.request_type,
      status: row.status,
      listingId: row.listing_id ?? undefined,
      createdAt: row.created_at.toISOString()
    })),
    stats: {
      totalListings: listings.length,
      activeListings: listings.filter((item) => item.status === "active").length,
      vehicleListings: listings.filter((item) => item.listingKind === "vehicle").length,
      partListings: listings.filter((item) => item.listingKind === "part").length,
      supportRequestCount: supportRes.rows.length
    }
  };
}
