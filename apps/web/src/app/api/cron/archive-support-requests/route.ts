/**
 * EkoMobil — Dəstək müraciətlərinin avtomatik arxivlənməsi
 *
 * Cədvəl: gündə 1 dəfə (03:00 UTC)
 * İcazə: CRON_SECRET Bearer token
 *
 * Məntiq: resolved/closed statuslu, vaxtı keçmiş müraciətlər → archived
 */

import { NextResponse } from "next/server";
import { autoArchiveStaleSupportRequests } from "@/server/admin-store";
import { SUPPORT_ARCHIVE_AFTER_DAYS } from "@/lib/support-retention";
import { createAdminAuditLog } from "@/server/admin-audit-store";

function isAuthorizedCronRequest(req: Request): boolean {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  if (!configuredSecret) return process.env.NODE_ENV !== "production";
  const authHeader = req.headers.get("authorization")?.trim() ?? "";
  return authHeader === `Bearer ${configuredSecret}`;
}

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const archived = await autoArchiveStaleSupportRequests();
    if (archived > 0) {
      await createAdminAuditLog({
        actorUserId: "system",
        actorRole: "system",
        actionType: "support_requests_auto_archived",
        entityType: "support_request",
        entityId: "batch",
        metadata: { archived, retentionDays: SUPPORT_ARCHIVE_AFTER_DAYS }
      });
    }
    return NextResponse.json({
      ok: true,
      archived,
      retentionDays: SUPPORT_ARCHIVE_AFTER_DAYS
    });
  } catch (error) {
    console.error("[cron/archive-support-requests]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 }
    );
  }
}
