import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { listAdminAuditLogs } from "@/server/admin-audit-store";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 25);
  const entityType = url.searchParams.get("entityType") || undefined;
  const actionType = url.searchParams.get("actionType") || undefined;
  const actorUserId = url.searchParams.get("actorUserId") || undefined;
  const q = url.searchParams.get("q") || undefined;
  const data = await listAdminAuditLogs({ page, pageSize, entityType, actionType, actorUserId, q });
  return NextResponse.json({ ok: true, ...data });
}
