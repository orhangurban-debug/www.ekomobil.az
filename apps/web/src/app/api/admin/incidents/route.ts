import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { createIncidentCase, listIncidentInbox } from "@/server/admin-incident-store";

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 25);
  const q = url.searchParams.get("q") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const severity = url.searchParams.get("severity") || undefined;
  const sourceType = (url.searchParams.get("sourceType") as "incident" | "manual_review" | "auction_case" | "all" | null) ?? "all";
  const data = await listIncidentInbox({ page, pageSize, q, status, severity, sourceType });
  return NextResponse.json({ ok: true, ...data });
}

export async function POST(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const body = (await req.json()) as {
    subjectType?: string;
    subjectId?: string;
    category?: string;
    severity?: "low" | "medium" | "high" | "critical";
    title?: string;
    description?: string;
    reporterUserId?: string;
    metadata?: unknown;
  };
  if (!body.subjectType || !body.subjectId || !body.category || !body.title) {
    return NextResponse.json({ ok: false, error: "Obyekt tipi, obyekt ID-si, kateqoriya və başlıq mütləqdir." }, { status: 400 });
  }
  const incident = await createIncidentCase({
    actorUserId: auth.user.id,
    subjectType: body.subjectType,
    subjectId: body.subjectId,
    category: body.category,
    severity: body.severity ?? "medium",
    title: body.title,
    description: body.description,
    reporterUserId: body.reporterUserId,
    metadata: body.metadata
  });
  await createAdminAuditLog({
    actorUserId: auth.user.id,
    actorRole: auth.user.role,
    actionType: "incident_created",
    entityType: "incident",
    entityId: incident.id,
    metadata: incident
  });
  return NextResponse.json({ ok: true, incident });
}
