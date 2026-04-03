import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/auth";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { bulkUpdateAdminUserStatus, listAdminUsersPaged } from "@/server/admin-store";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 25);
  const q = url.searchParams.get("q") || undefined;
  const role = url.searchParams.get("role") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const sortBy = (url.searchParams.get("sortBy") as "created_at" | "email" | "penalty_balance_azn" | null) ?? undefined;
  const sortDir = (url.searchParams.get("sortDir") as "asc" | "desc" | null) ?? undefined;
  const data = await listAdminUsersPaged({ page, pageSize, q, role, status, sortBy, sortDir });
  return NextResponse.json({ ok: true, ...data });
}

export async function PATCH(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const body = (await req.json()) as {
    userIds?: string[];
    status?: string;
    role?: UserRole;
    reason?: string;
  };
  const userIds = Array.isArray(body.userIds) ? body.userIds.filter(Boolean) : [];
  if (userIds.length === 0) {
    return NextResponse.json({ ok: false, error: "No user IDs provided." }, { status: 400 });
  }
  if (body.status) {
    if (!["active", "suspended", "review"].includes(body.status)) {
      return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
    }
    const updated = await bulkUpdateAdminUserStatus(userIds, body.status);
    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "bulk_user_status_update",
      entityType: "user",
      reason: body.reason,
      metadata: { userIds, status: body.status, updated }
    });
    return NextResponse.json({ ok: true, updated });
  }
  return NextResponse.json({ ok: false, error: "Unsupported bulk operation." }, { status: 400 });
}
