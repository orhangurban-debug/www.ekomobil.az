import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { updateAdminUserStatus } from "@/server/admin-store";

const ALLOWED_STATUS = new Set(["active", "suspended", "review"]);

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await req.json()) as { status?: string };
  const status = (body.status || "").trim();
  if (!ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ ok: false, error: "Status dəyəri yanlışdır." }, { status: 400 });
  }

  try {
    await updateAdminUserStatus(id, status);
    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "user_status_updated",
      entityType: "user",
      entityId: id,
      metadata: { status }
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Status yenilənməsi uğursuz oldu." }, { status: 500 });
  }
}
