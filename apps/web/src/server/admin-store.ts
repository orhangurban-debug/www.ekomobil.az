import { getPgPool } from "@/lib/postgres";
import type { UserRole } from "@/lib/auth";

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
  totalRevenueAzn: number;
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
    const [listing, auction] = await Promise.all([
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
    ]);
    const listingPlanRevenueAzn = n(listing.rows[0]?.total);
    const auctionRevenueAzn = n(auction.rows[0]?.auction_revenue);
    const obligationRevenueAzn = n(auction.rows[0]?.obligation_revenue);
    const sellerBondRevenueAzn = n(auction.rows[0]?.bond_revenue);
    return {
      listingPlanRevenueAzn,
      auctionRevenueAzn,
      obligationRevenueAzn,
      sellerBondRevenueAzn,
      totalRevenueAzn: listingPlanRevenueAzn + auctionRevenueAzn
    };
  } catch {
    return {
      listingPlanRevenueAzn: 0,
      auctionRevenueAzn: 0,
      obligationRevenueAzn: 0,
      sellerBondRevenueAzn: 0,
      totalRevenueAzn: 0
    };
  }
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
