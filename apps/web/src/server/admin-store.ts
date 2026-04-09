import { getPgPool } from "@/lib/postgres";
import type { UserRole } from "@/lib/auth";
import { DEALER_PLANS } from "@/lib/dealer-plans";
import { PARTS_STORE_PLANS } from "@/lib/parts-store-plans";

export interface AdminOverview {
  usersTotal: number;
  activeUsers: number;
  activeListings: number;
  liveAuctions: number;
  unresolvedCases: number;
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
  listingId?: string;
  assignedToUserId?: string;
  assignedToEmail?: string;
  adminResponse?: string;
  responseAt?: string;
  resolvedAt?: string;
  lastActivityAt: string;
  createdAt: string;
}

export interface AdminSupportSnapshot {
  total: number;
  newCount: number;
  inProgressCount: number;
  waitingUserCount: number;
  resolvedCount: number;
  urgentCount: number;
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
    const [users, listings, auctions, cases, revenue] = await Promise.all([
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
      monthlyRevenueAzn: n(revenue.rows[0]?.monthly_revenue)
    };
  } catch {
    return {
      usersTotal: 0,
      activeUsers: 0,
      activeListings: 0,
      liveAuctions: 0,
      unresolvedCases: 0,
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
    const result = await pool.query<{
      total: string;
      c_new: string;
      c_progress: string;
      c_waiting: string;
      c_resolved: string;
      c_urgent: string;
    }>(
      `SELECT
         COUNT(*)::text AS total,
         SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)::text AS c_new,
         SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)::text AS c_progress,
         SUM(CASE WHEN status = 'waiting_user' THEN 1 ELSE 0 END)::text AS c_waiting,
         SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END)::text AS c_resolved,
         SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END)::text AS c_urgent
       FROM support_requests`
    );
    return {
      total: n(result.rows[0]?.total),
      newCount: n(result.rows[0]?.c_new),
      inProgressCount: n(result.rows[0]?.c_progress),
      waitingUserCount: n(result.rows[0]?.c_waiting),
      resolvedCount: n(result.rows[0]?.c_resolved),
      urgentCount: n(result.rows[0]?.c_urgent)
    };
  } catch {
    return {
      total: 0,
      newCount: 0,
      inProgressCount: 0,
      waitingUserCount: 0,
      resolvedCount: 0,
      urgentCount: 0
    };
  }
}

export async function listAdminSupportRequestsPaged(input: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  priority?: string;
  requestType?: string;
  assigned?: "yes" | "no";
  sortDir?: "asc" | "desc";
}): Promise<PaginatedResult<AdminSupportRequestRow>> {
  const page = clampPage(input.page);
  const pageSize = clampPageSize(input.pageSize);
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
  }
  if (input.priority?.trim()) {
    values.push(input.priority.trim());
    where.push(`sr.priority = $${values.length}`);
  }
  if (input.requestType?.trim()) {
    values.push(input.requestType.trim());
    where.push(`sr.request_type = $${values.length}`);
  }
  if (input.assigned === "yes") where.push(`sr.assigned_to_user_id IS NOT NULL`);
  if (input.assigned === "no") where.push(`sr.assigned_to_user_id IS NULL`);
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sortDir = input.sortDir === "asc" ? "ASC" : "DESC";
  const pool = getPgPool();
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
    listing_id: string | null;
    assigned_to_user_id: string | null;
    assigned_to_email: string | null;
    admin_response: string | null;
    response_at: Date | null;
    resolved_at: Date | null;
    last_activity_at: Date;
    created_at: Date;
  }>(
    `SELECT
       sr.id, sr.request_type, sr.subject, sr.message, sr.status, sr.priority, sr.source,
       sr.reporter_user_id, sr.reporter_name, sr.reporter_email, sr.reporter_phone, sr.listing_id,
       sr.assigned_to_user_id, au.email AS assigned_to_email,
       sr.admin_response, sr.response_at, sr.resolved_at, sr.last_activity_at, sr.created_at
     FROM support_requests sr
     LEFT JOIN users au ON au.id = sr.assigned_to_user_id
     ${whereSql}
     ORDER BY sr.last_activity_at ${sortDir}
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  const total = n(countResult.rows[0]?.total);
  return {
    items: result.rows.map((row) => ({
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
      listingId: row.listing_id ?? undefined,
      assignedToUserId: row.assigned_to_user_id ?? undefined,
      assignedToEmail: row.assigned_to_email ?? undefined,
      adminResponse: row.admin_response ?? undefined,
      responseAt: row.response_at ? row.response_at.toISOString() : undefined,
      resolvedAt: row.resolved_at ? row.resolved_at.toISOString() : undefined,
      lastActivityAt: row.last_activity_at.toISOString(),
      createdAt: row.created_at.toISOString()
    })),
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
  adminResponse?: string;
}): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `UPDATE support_requests
     SET
       status = COALESCE($2, status),
       priority = COALESCE($3, priority),
       assigned_to_user_id = COALESCE($4, assigned_to_user_id),
       admin_response = COALESCE($5, admin_response),
       response_at = CASE WHEN $5 IS NULL THEN response_at ELSE NOW() END,
       resolved_at = CASE WHEN $2 IN ('resolved', 'closed') THEN NOW() ELSE resolved_at END,
       last_activity_at = NOW(),
       updated_at = NOW()
     WHERE id = $1`,
    [input.id, input.status ?? null, input.priority ?? null, input.assignedToUserId ?? null, input.adminResponse ?? null]
  );
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
