/**
 * EkoMobil — Elan Müddəti Bitmə Cron İşi
 *
 * Cədvəl: gündə 2 dəfə (06:00, 18:00 UTC)
 * İcazə: CRON_SECRET Bearer token
 *
 * Məntiq:
 *   1. plan_expires_at + lütf müddəti keçmiş ACTIVE elanları → "archived"
 *   2. Lütf müddəti yaxınlaşan (3 gün) elanları → bildiriş loqu
 *   3. Demo/in-memory elanlar üçün eyni məntiqi tətbiq edir
 */

import { NextResponse } from "next/server";
import { getPgPool } from "@/lib/postgres";
import { createAdminAuditLog } from "@/server/admin-audit-store";

function isAuthorizedCronRequest(req: Request): boolean {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  if (!configuredSecret) return process.env.NODE_ENV !== "production";
  const authHeader = req.headers.get("authorization")?.trim() ?? "";
  return authHeader === `Bearer ${configuredSecret}`;
}

interface ExpirySummary {
  archived: number;
  nearExpiry: number;
  expiredBusinessSubscriptions: number;
  nearExpiryBusinessSubscriptions: number;
  errors: string[];
}

async function runExpireListings(): Promise<ExpirySummary> {
  const summary: ExpirySummary = {
    archived: 0,
    nearExpiry: 0,
    expiredBusinessSubscriptions: 0,
    nearExpiryBusinessSubscriptions: 0,
    errors: []
  };

  try {
    const pool = getPgPool();

    // Grace period per plan (days)
    // free: +7, standard: +14, vip: +30
    const archiveResult = await pool.query<{ count: string }>(`
      UPDATE listings
      SET status = 'archived', updated_at = NOW()
      WHERE status = 'active'
        AND plan_expires_at IS NOT NULL
        AND (
          (COALESCE(plan_type, 'free') = 'free'     AND plan_expires_at + INTERVAL '7 days'  < NOW()) OR
          (COALESCE(plan_type, 'free') = 'standard' AND plan_expires_at + INTERVAL '14 days' < NOW()) OR
          (COALESCE(plan_type, 'free') = 'vip'      AND plan_expires_at + INTERVAL '30 days' < NOW())
        )
      RETURNING id
    `);
    summary.archived = archiveResult.rowCount ?? 0;

    // Count near-expiry listings (within 3 days) for monitoring
    const nearResult = await pool.query<{ count: string }>(`
      SELECT COUNT(*)::text as count
      FROM listings
      WHERE status = 'active'
        AND plan_expires_at IS NOT NULL
        AND plan_expires_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'
    `);
    summary.nearExpiry = Number(nearResult.rows[0]?.count ?? 0);

    const expireSubsResult = await pool.query<{ count: string }>(`
      UPDATE business_plan_subscriptions
      SET status = 'expired', updated_at = NOW()
      WHERE status = 'active'
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
      RETURNING id
    `);
    summary.expiredBusinessSubscriptions = expireSubsResult.rowCount ?? 0;

    const nearSubsResult = await pool.query<{ count: string }>(`
      SELECT COUNT(*)::text as count
      FROM business_plan_subscriptions
      WHERE status = 'active'
        AND expires_at IS NOT NULL
        AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'
    `);
    summary.nearExpiryBusinessSubscriptions = Number(nearSubsResult.rows[0]?.count ?? 0);

    await createAdminAuditLog({
      actorRole: "system",
      actionType: "cron_expiry_health",
      entityType: "subscription",
      metadata: summary
    });

  } catch (err) {
    summary.errors.push(
      err instanceof Error ? err.message : "DB xəta"
    );
  }

  return summary;
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && !process.env.CRON_SECRET?.trim()) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured for production" },
      { status: 500 }
    );
  }
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runExpireListings();
  return NextResponse.json({ ok: true, summary, ts: new Date().toISOString() });
}
