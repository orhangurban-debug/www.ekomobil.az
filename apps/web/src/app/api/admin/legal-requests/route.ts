import { NextResponse } from "next/server";
import { requireAdminCapability } from "@/lib/rbac";
import { createLegalDataRequest, listLegalDataRequests } from "@/server/legal-request-store";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { legalDataRequestSchema, parseOrThrow, ValidationError } from "@/lib/validate";

export async function GET(req: Request) {
  const auth = await requireAdminCapability(req, "legal.manage");
  if (!auth.ok) return auth.response;

  const requests = await listLegalDataRequests(100);
  return NextResponse.json({ ok: true, requests });
}

export async function POST(req: Request) {
  const auth = await requireAdminCapability(req, "legal.manage");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  try {
    const parsed = parseOrThrow(legalDataRequestSchema, body);
    const request = await createLegalDataRequest({
      ...parsed,
      createdByUserId: auth.user.id
    });

    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "legal_request_created",
      entityType: "legal_data_request",
      entityId: request.id,
      metadata: { referenceNumber: request.referenceNumber, authorityName: request.authorityName }
    });

    return NextResponse.json({ ok: true, request });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof ValidationError ? err.message : "Sorğu yaradılmadı." },
      { status: 400 }
    );
  }
}
