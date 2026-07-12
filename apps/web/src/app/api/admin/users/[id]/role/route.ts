import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/auth";
import {
  type AdminCapability,
  type AdminStaffType,
  isAdminStaffType,
  permissionsForStaffType,
  roleForStaffType,
  sanitizeCapabilities
} from "@/lib/admin-permissions";
import { requireAdminCapability } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { assignAdminStaffRole } from "@/server/admin-store";

const ALLOWED_ROLES: UserRole[] = ["admin", "support", "dealer", "viewer"];

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminCapability(req, "users.assign_staff");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (id === auth.user.id) {
    return NextResponse.json({ ok: false, error: "Öz rolunuzu dəyişə bilməzsiniz." }, { status: 400 });
  }

  const body = (await req.json()) as {
    role?: UserRole;
    staffType?: AdminStaffType;
    permissions?: AdminCapability[];
    confirm?: boolean;
  };

  if (!body.role || !ALLOWED_ROLES.includes(body.role)) {
    return NextResponse.json({ ok: false, error: "Rol dəyəri yanlışdır." }, { status: 400 });
  }

  const isStaffRole = body.role === "admin" || body.role === "support";
  if (isStaffRole && body.confirm !== true) {
    return NextResponse.json(
      { ok: false, error: "Admin/staff təyinatı üçün təsdiq tələb olunur." },
      { status: 400 }
    );
  }

  let staffType: AdminStaffType | null = null;
  let permissions: AdminCapability[] = [];
  let resolvedRole = body.role;

  if (isStaffRole) {
    if (!body.staffType || !isAdminStaffType(body.staffType)) {
      return NextResponse.json({ ok: false, error: "Admin növü seçilməlidir." }, { status: 400 });
    }
    staffType = body.staffType;
    resolvedRole = roleForStaffType(staffType);
    permissions =
      staffType === "custom"
        ? sanitizeCapabilities(body.permissions)
        : sanitizeCapabilities(body.permissions?.length ? body.permissions : permissionsForStaffType(staffType));

    if (staffType === "custom" && permissions.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Xüsusi admin üçün ən azı bir səlahiyyət seçin." },
        { status: 400 }
      );
    }
  }

  try {
    await assignAdminStaffRole({
      userId: id,
      role: resolvedRole,
      staffType,
      permissions,
      grantedBy: auth.user.id
    });
    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "user_role_updated",
      entityType: "user",
      entityId: id,
      metadata: {
        role: resolvedRole,
        staffType,
        permissions,
        confirmed: Boolean(body.confirm)
      }
    });
    return NextResponse.json({ ok: true, role: resolvedRole, staffType, permissions });
  } catch {
    return NextResponse.json({ ok: false, error: "Rol yenilənməsi uğursuz oldu." }, { status: 500 });
  }
}
