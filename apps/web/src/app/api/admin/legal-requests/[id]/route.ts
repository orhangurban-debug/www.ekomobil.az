import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { updateLegalDataRequestStatus } from "@/server/legal-request-store";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { legalDataRequestStatusSchema, parseOrThrow, ValidationError } from "@/lib/validate";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteContext) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  try {
    const parsed = parseOrThrow(legalDataRequestStatusSchema, body);
    const request = await updateLegalDataRequestStatus({
      id,
      status: parsed.status,
      internalNotes: parsed.internalNotes,
      disclosureEntry: parsed.disclosureEntry
    });
    if (!request) {
      return NextResponse.json({ ok: false, error: "Sorğu tapılmadı." }, { status: 404 });
    }

    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "legal_request_updated",
      entityType: "legal_data_request",
      entityId: request.id,
      afterState: { status: request.status }
    });

    return NextResponse.json({ ok: true, request });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof ValidationError ? err.message : "Status yenilənmədi." },
      { status: 400 }
    );
  }
}
