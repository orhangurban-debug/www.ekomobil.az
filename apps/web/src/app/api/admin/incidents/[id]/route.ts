import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { updateIncidentCase } from "@/server/admin-incident-store";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const body = (await req.json()) as {
    status?: "open" | "triage" | "in_review" | "actioned" | "resolved" | "dismissed";
    assignedToUserId?: string | null;
    resolutionNote?: string;
    note?: string;
  };
  const updated = await updateIncidentCase({
    incidentId: id,
    actorUserId: auth.user.id,
    status: body.status,
    assignedToUserId: body.assignedToUserId,
    resolutionNote: body.resolutionNote,
    note: body.note
  });
  if (!updated) {
    return NextResponse.json({ ok: false, error: "İnsident tapılmadı." }, { status: 404 });
  }
  await createAdminAuditLog({
    actorUserId: auth.user.id,
    actorRole: auth.user.role,
    actionType: "incident_updated",
    entityType: "incident",
    entityId: id,
    reason: body.note,
    metadata: { status: body.status, assignedToUserId: body.assignedToUserId }
  });
  return NextResponse.json({ ok: true, incident: updated });
}
