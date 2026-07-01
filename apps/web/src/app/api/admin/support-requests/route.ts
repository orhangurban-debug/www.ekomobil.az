import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { listAdminSupportRequestsPaged, updateAdminSupportRequest } from "@/server/admin-store";
import { getPgPool } from "@/lib/postgres";
import { sendSupportReplyEmail } from "@/lib/email";

const ALLOWED_STATUS = new Set(["new", "in_progress", "waiting_user", "resolved", "closed"]);
const ALLOWED_PRIORITY = new Set(["low", "normal", "high", "urgent"]);

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 25);
  const q = url.searchParams.get("q") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const priority = url.searchParams.get("priority") || undefined;
  const requestType = url.searchParams.get("requestType") || undefined;
  const assigned = (url.searchParams.get("assigned") as "yes" | "no" | null) ?? undefined;
  const sortDir = (url.searchParams.get("sortDir") as "asc" | "desc" | null) ?? undefined;
  const data = await listAdminSupportRequestsPaged({
    page,
    pageSize,
    q,
    status,
    priority,
    requestType,
    assigned,
    sortDir
  });
  return NextResponse.json({ ok: true, ...data });
}

export async function PATCH(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;
  const body = (await req.json()) as {
    id?: string;
    status?: string;
    priority?: string;
    assignedToUserId?: string | null;
    adminResponse?: string;
    reason?: string;
    resendEmail?: boolean;
  };
  if (!body.id) {
    return NextResponse.json({ ok: false, error: "Sorğu ID mütləqdir." }, { status: 400 });
  }
  if (body.status && !ALLOWED_STATUS.has(body.status)) {
    return NextResponse.json({ ok: false, error: "Status yanlışdır." }, { status: 400 });
  }
  if (body.priority && !ALLOWED_PRIORITY.has(body.priority)) {
    return NextResponse.json({ ok: false, error: "Prioritet yanlışdır." }, { status: 400 });
  }

  // Fetch reporter contact info before updating (needed for email notification)
  const hasNewResponse = Boolean(body.adminResponse?.trim());
  let reporterEmail: string | null = null;
  let reporterName: string | null = null;
  let requestSubject: string = "Müraciətiniz";
  let previousResponse: string | null = null;

  if (hasNewResponse) {
    try {
      const pool = getPgPool();
      const row = await pool.query<{
        reporter_email: string | null;
        reporter_name: string | null;
        subject: string;
        admin_response: string | null;
      }>(
        `SELECT reporter_email, reporter_name, subject, admin_response
         FROM support_requests WHERE id = $1 LIMIT 1`,
        [body.id]
      );
      if (row.rows[0]) {
        reporterEmail = row.rows[0].reporter_email;
        reporterName = row.rows[0].reporter_name;
        requestSubject = row.rows[0].subject || "Müraciətiniz";
        previousResponse = row.rows[0].admin_response;
      }
    } catch (err) {
      console.error("[support-requests PATCH] Failed to fetch reporter info:", err);
    }
  }

  const newResponse = body.adminResponse?.trim();
  const isNewOrChangedResponse = hasNewResponse && newResponse !== (previousResponse ?? "").trim();

  let effectiveStatus = body.status;
  if (
    isNewOrChangedResponse &&
    effectiveStatus &&
    (effectiveStatus === "new" || effectiveStatus === "in_progress")
  ) {
    effectiveStatus = "waiting_user";
  }

  await updateAdminSupportRequest({
    id: body.id,
    status: effectiveStatus,
    priority: body.priority,
    assignedToUserId: body.assignedToUserId === null || body.assignedToUserId === ""
      ? null
      : typeof body.assignedToUserId === "string"
        ? body.assignedToUserId
        : undefined,
    assigneeProvided: "assignedToUserId" in body,
    adminResponse: body.adminResponse
  });

  await createAdminAuditLog({
    actorUserId: auth.user.id,
    actorRole: auth.user.role,
    actionType: "support_request_updated",
    entityType: "support_request",
    entityId: body.id,
    reason: body.reason,
    metadata: {
      status: effectiveStatus,
      priority: body.priority,
      assignedToUserId: body.assignedToUserId,
      responded: hasNewResponse
    }
  });

  let emailSent = false;
  let emailError: string | undefined;

  const shouldSendEmail =
    Boolean(newResponse && reporterEmail) &&
    (isNewOrChangedResponse || body.resendEmail === true);

  if (shouldSendEmail && reporterEmail && newResponse) {
    const emailResult = await sendSupportReplyEmail({
      to: reporterEmail,
      recipientName: reporterName ?? undefined,
      originalSubject: requestSubject,
      requestId: body.id,
      adminResponse: newResponse!
    });
    emailSent = emailResult.ok;
    emailError = emailResult.error;
    if (!emailResult.ok) {
      console.error("[support-requests PATCH] Email send failed:", emailResult.error);
    }
  } else if ((isNewOrChangedResponse || body.resendEmail) && !reporterEmail) {
    emailError = "Müraciətçinin e-poçt ünvanı yoxdur.";
  }

  return NextResponse.json({
    ok: true,
    emailSent,
    emailError,
    status: effectiveStatus
  });
}
