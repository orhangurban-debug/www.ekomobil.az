import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { listAdminSupportRequestsPaged, updateAdminSupportRequest } from "@/server/admin-store";

const ALLOWED_STATUS = new Set(["new", "in_progress", "waiting_user", "resolved", "closed"]);
const ALLOWED_PRIORITY = new Set(["low", "normal", "high", "urgent"]);

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 25);
  const q = url.searchParams.get("q") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const priority = url.searchParams.get("priority") || undefined;
  const requestType = url.searchParams.get("requestType") || undefined;
  const assigned = (url.searchParams.get("assigned") as "yes" | "no" | null) ?? undefined;
  const sortDir = (url.searchParams.get("sortDir") as "asc" | "desc" | null) ?? undefined;
  const data = await listAdminSupportRequestsPaged({
    page,
    pageSize,
    q,
    status,
    priority,
    requestType,
    assigned,
    sortDir
  });
  return NextResponse.json({ ok: true, ...data });
}

export async function PATCH(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const body = (await req.json()) as {
    id?: string;
    status?: string;
    priority?: string;
    assignedToUserId?: string | null;
    adminResponse?: string;
    reason?: string;
  };
  if (!body.id) {
    return NextResponse.json({ ok: false, error: "Sorğu ID mütləqdir." }, { status: 400 });
  }
  if (body.status && !ALLOWED_STATUS.has(body.status)) {
    return NextResponse.json({ ok: false, error: "Status yanlışdır." }, { status: 400 });
  }
  if (body.priority && !ALLOWED_PRIORITY.has(body.priority)) {
    return NextResponse.json({ ok: false, error: "Prioritet yanlışdır." }, { status: 400 });
  }
  await updateAdminSupportRequest({
    id: body.id,
    status: body.status,
    priority: body.priority,
    assignedToUserId: typeof body.assignedToUserId === "string" ? body.assignedToUserId : undefined,
    adminResponse: body.adminResponse
  });
  await createAdminAuditLog({
    actorUserId: auth.user.id,
    actorRole: auth.user.role,
    actionType: "support_request_updated",
    entityType: "support_request",
    entityId: body.id,
    reason: body.reason,
    metadata: {
      status: body.status,
      priority: body.priority,
      assignedToUserId: body.assignedToUserId,
      responded: Boolean(body.adminResponse?.trim())
    }
  });
  return NextResponse.json({ ok: true });
}
