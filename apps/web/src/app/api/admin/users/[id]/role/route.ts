import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/auth";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { updateAdminUserRole } from "@/server/admin-store";

const ALLOWED_ROLES: UserRole[] = ["admin", "support", "dealer", "viewer"];

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await req.json()) as { role?: UserRole };
  if (!body.role || !ALLOWED_ROLES.includes(body.role)) {
    return NextResponse.json({ ok: false, error: "Rol dəyəri yanlışdır." }, { status: 400 });
  }

  try {
    await updateAdminUserRole(id, body.role);
    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "user_role_updated",
      entityType: "user",
      entityId: id,
      metadata: { role: body.role }
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Rol yenilənməsi uğursuz oldu." }, { status: 500 });
  }
}
