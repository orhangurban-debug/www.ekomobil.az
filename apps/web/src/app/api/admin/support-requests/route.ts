import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { listAdminSupportRequestsPaged, updateAdminSupportRequest, deleteAdminSupportRequests, updateAdminUserRole } from "@/server/admin-store";
import { getPgPool } from "@/lib/postgres";
import { sendSupportReplyEmail } from "@/lib/email";
import { createDealerProfile } from "@/server/dealer-store";
import { upsertBusinessPlanSubscription } from "@/server/business-plan-store";

const ALLOWED_STATUS = new Set(["new", "in_progress", "waiting_user", "resolved", "closed", "archived"]);
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
  const requestGroup = url.searchParams.get("requestGroup") || undefined;
  const excludeRequestGroup = url.searchParams.get("excludeRequestGroup") || undefined;
  const riskFlag = url.searchParams.get("riskFlag") || undefined;
  const assigned = (url.searchParams.get("assigned") as "yes" | "no" | null) ?? undefined;
  const sortDir = (url.searchParams.get("sortDir") as "asc" | "desc" | null) ?? undefined;
  const data = await listAdminSupportRequestsPaged({
    page,
    pageSize,
    q,
    status,
    priority,
    requestType,
    requestGroup,
    excludeRequestGroup,
    riskFlag,
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
    internalNotes?: string;
    subject?: string;
    message?: string;
    riskFlag?: string;
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

  if (body.riskFlag && !["none", "watch", "abuse", "legal"].includes(body.riskFlag)) {
    return NextResponse.json({ ok: false, error: "Risk flag yanlışdır." }, { status: 400 });
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
    adminResponse: body.adminResponse,
    internalNotes: body.internalNotes,
    internalNotesProvided: "internalNotes" in body,
    subject: body.subject,
    message: body.message,
    subjectProvided: "subject" in body,
    messageProvided: "message" in body,
    riskFlag: body.riskFlag
  });

  // ── Business account auto-activation ──────────────────────────────────────
  // When a dealer_apply / partnership / parts_apply request is marked "resolved",
  // automatically grant the appropriate 30-day trial subscription (and for
  // dealer_apply, also create the dealer_profiles row and set the user role).
  let partnershipActivated = false;
  if (effectiveStatus === "resolved") {
    try {
      const pool = getPgPool();
      const reqRow = await pool.query<{
        request_type: string;
        reporter_user_id: string | null;
        metadata: Record<string, unknown> | null;
      }>(
        `SELECT request_type, reporter_user_id, metadata FROM support_requests WHERE id = $1 LIMIT 1`,
        [body.id]
      );
      const req = reqRow.rows[0];
      const isDealerApply = req?.request_type === "dealer_apply" || req?.request_type === "partnership";
      const isPartsApply  = req?.request_type === "parts_apply";

      // ── Salon / dealer activation ──────────────────────────────────────────
      if (isDealerApply && req.reporter_user_id) {
        const app = req.metadata?.dealerApplication as Record<string, unknown> | undefined;
        const businessName = (app?.businessName as string | undefined)?.trim() || "Dealer";
        const city = (app?.city as string | undefined)?.trim() || "Bakı";
        const voen = (app?.voen as string | undefined)?.trim() || null;
        const websiteUrl = (app?.website as string | undefined)?.trim() || null;
        const description = (app?.description as string | undefined)?.trim() || null;

        const existingProfile = await pool.query<{ id: string }>(
          `SELECT id FROM dealer_profiles WHERE owner_user_id = $1 LIMIT 1`,
          [req.reporter_user_id]
        );
        if (!existingProfile.rows[0]) {
          const dealerProfileId = randomUUID();
          await createDealerProfile({
            id: dealerProfileId,
            ownerUserId: req.reporter_user_id,
            name: businessName,
            city,
            voen,
            websiteUrl,
            description,
          });
          await updateAdminUserRole(req.reporter_user_id, "dealer");
          const now = new Date();
          const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          await upsertBusinessPlanSubscription({
            ownerUserId: req.reporter_user_id,
            businessType: "dealer",
            planId: "dealer_standard",
            status: "active",
            startsAt: now.toISOString(),
            expiresAt: trialEnd.toISOString(),
            trialGrantedAt: now.toISOString(),
          });
          partnershipActivated = true;
        }
      }

      // ── Parts store activation ─────────────────────────────────────────────
      if (isPartsApply && req.reporter_user_id) {
        const existingSub = await pool.query<{ id: string }>(
          `SELECT id FROM business_plan_subscriptions
           WHERE owner_user_id = $1 AND business_type = 'parts_store'
             AND status = 'active' AND (expires_at IS NULL OR expires_at >= NOW())
           LIMIT 1`,
          [req.reporter_user_id]
        );
        if (!existingSub.rows[0]) {
          const now = new Date();
          const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          await upsertBusinessPlanSubscription({
            ownerUserId: req.reporter_user_id,
            businessType: "parts_store",
            planId: "parts_store_standard",
            status: "active",
            startsAt: now.toISOString(),
            expiresAt: trialEnd.toISOString(),
            trialGrantedAt: now.toISOString(),
          });
          partnershipActivated = true;
        }
      }
    } catch (err) {
      console.error("[support-requests PATCH] Business activation failed:", err);
    }
  }

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
      responded: hasNewResponse,
      riskFlag: body.riskFlag,
      partnershipActivated,
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
    status: effectiveStatus,
    partnershipActivated,
  });
}

export async function DELETE(req: Request) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as { ids?: string[]; reason?: string };
  const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string" && id.trim()) : [];
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, error: "Silinəcək müraciət ID-ləri mütləqdir." }, { status: 400 });
  }

  const deleted = await deleteAdminSupportRequests(ids);
  if (deleted === 0) {
    return NextResponse.json(
      { ok: false, error: "Müraciət tapılmadı və ya silinmədi." },
      { status: 400 }
    );
  }

  await createAdminAuditLog({
    actorUserId: auth.user.id,
    actorRole: auth.user.role,
    actionType: "support_requests_deleted",
    entityType: "support_request",
    entityId: ids.join(","),
    reason: body.reason,
    metadata: { deleted, requested: ids.length }
  });

  return NextResponse.json({ ok: true, deleted });
}
