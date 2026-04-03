import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { bulkUpdateLeadStage, listAdminLeadsPaged } from "@/server/admin-store";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 25);
  const q = url.searchParams.get("q") || undefined;
  const stage = url.searchParams.get("stage") || undefined;
  const source = url.searchParams.get("source") || undefined;
  const sortDir = (url.searchParams.get("sortDir") as "asc" | "desc" | null) ?? undefined;
  const data = await listAdminLeadsPaged({ page, pageSize, q, stage, source, sortDir });
  return NextResponse.json({ ok: true, ...data });
}

export async function PATCH(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const body = (await req.json()) as { leadIds?: string[]; stage?: string; reason?: string };
  const leadIds = Array.isArray(body.leadIds) ? body.leadIds.filter(Boolean) : [];
  if (leadIds.length === 0 || !body.stage) {
    return NextResponse.json({ ok: false, error: "leadIds and stage are required." }, { status: 400 });
  }
  const allowed = new Set(["new", "in_progress", "test_drive", "offer", "won", "closed"]);
  if (!allowed.has(body.stage)) {
    return NextResponse.json({ ok: false, error: "Invalid lead stage." }, { status: 400 });
  }
  const updated = await bulkUpdateLeadStage(leadIds, body.stage);
  await createAdminAuditLog({
    actorUserId: auth.user.id,
    actorRole: auth.user.role,
    actionType: "bulk_lead_stage_update",
    entityType: "lead",
    reason: body.reason,
    metadata: { leadIds, stage: body.stage, updated }
  });
  return NextResponse.json({ ok: true, updated });
}
