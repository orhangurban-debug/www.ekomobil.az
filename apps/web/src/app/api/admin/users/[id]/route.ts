import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import type { UserRole } from "@/lib/auth";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { deleteAdminUserPermanently, getAdminUserMembershipProfile, updateAdminUserProfile } from "@/server/admin-store";

const ALLOWED_ROLES = new Set<UserRole>(["admin", "support", "dealer", "viewer"]);
const ALLOWED_STATUS = new Set(["active", "suspended", "review"]);

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireApiRoles(_req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const profile = await getAdminUserMembershipProfile(id);
  if (!profile) {
    return NextResponse.json({ ok: false, error: "İstifadəçi tapılmadı." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, profile });
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await req.json()) as {
    fullName?: string | null;
    city?: string | null;
    phone?: string | null;
    role?: UserRole;
    userAccountStatus?: string;
    penaltyBalanceAzn?: number;
  };

  if (body.role && auth.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Rol dəyişikliyi yalnız admin üçündür." }, { status: 403 });
  }
  if (body.role && !ALLOWED_ROLES.has(body.role)) {
    return NextResponse.json({ ok: false, error: "Rol dəyəri yanlışdır." }, { status: 400 });
  }
  if (body.userAccountStatus && !ALLOWED_STATUS.has(body.userAccountStatus)) {
    return NextResponse.json({ ok: false, error: "Status dəyəri yanlışdır." }, { status: 400 });
  }
  if (body.penaltyBalanceAzn !== undefined && auth.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Cərimə balansı yalnız admin tərəfindən dəyişdirilə bilər." }, { status: 403 });
  }
  if (id === auth.user.id && body.role && body.role !== auth.user.role) {
    return NextResponse.json({ ok: false, error: "Öz rolunuzu dəyişə bilməzsiniz." }, { status: 400 });
  }
  if (id === auth.user.id && body.userAccountStatus === "suspended") {
    return NextResponse.json({ ok: false, error: "Öz hesabınızı dayandıra bilməzsiniz." }, { status: 400 });
  }

  try {
    await updateAdminUserProfile({
      userId: id,
      fullName: body.fullName,
      city: body.city,
      phone: body.phone,
      role: body.role,
      userAccountStatus: body.userAccountStatus,
      penaltyBalanceAzn: body.penaltyBalanceAzn
    });

    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "user_profile_updated",
      entityType: "user",
      entityId: id,
      metadata: body
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "İstifadəçi yenilənmədi." }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (id === auth.user.id) {
    return NextResponse.json({ ok: false, error: "Öz hesabınızı silə bilməzsiniz." }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as { reason?: string };

  try {
    await deleteAdminUserPermanently(id);
    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "user_deleted",
      entityType: "user",
      entityId: id,
      reason: body.reason,
      metadata: { hardDelete: true }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "İstifadəçi silinmədi.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
