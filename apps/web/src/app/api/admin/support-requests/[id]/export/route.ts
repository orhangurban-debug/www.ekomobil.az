import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { buildSupportExportDocument, buildSupportPrintHtml } from "@/lib/support-admin";
import { getAdminSupportRequestById } from "@/server/admin-store";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const row = await getAdminSupportRequestById(id);
  if (!row) {
    return NextResponse.json({ ok: false, error: "Müraciət tapılmadı." }, { status: 404 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "json";
  const payload = buildSupportExportDocument({
    request: {
      id: row.id,
      requestType: row.requestType,
      subject: row.subject,
      message: row.message,
      status: row.status,
      priority: row.priority,
      riskFlag: row.riskFlag,
      source: row.source,
      reporterName: row.reporterName,
      reporterEmail: row.reporterEmail,
      reporterPhone: row.reporterPhone,
      reporterUserId: row.reporterUserId,
      reporterIp: row.reporterIp,
      reporterUserAgent: row.reporterUserAgent,
      listingId: row.listingId,
      adminResponse: row.adminResponse,
      internalNotes: row.internalNotes,
      createdAt: row.createdAt,
      lastActivityAt: row.lastActivityAt,
      responseAt: row.responseAt,
      resolvedAt: row.resolvedAt,
      assignedToEmail: row.assignedToEmail
    },
    reporterContext: row.reporterContext as Record<string, unknown> | undefined
  });

  if (format === "html") {
    const html = buildSupportPrintHtml({
      request: payload.request,
      reporterContext: payload.reporterContext
    });
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="ekomobil-muraciet-${row.id.slice(0, 8)}.html"`
      }
    });
  }

  return NextResponse.json({ ok: true, ...payload });
}
