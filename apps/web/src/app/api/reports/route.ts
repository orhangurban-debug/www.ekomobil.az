import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { createUserReport } from "@/server/user-report-store";
import { recordUserActivity } from "@/server/user-activity-store";
import { getListingDetail } from "@/server/listing-store";
import { parseOrThrow, userReportSchema, ValidationError } from "@/lib/validate";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = await checkRateLimit(`user-report:${ip}`, 10, 60);
  if (!limit.ok) return rateLimitResponse(300);

  const user = await getServerSessionUser();
  const userAgent = req.headers.get("user-agent") ?? undefined;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  try {
    const parsed = parseOrThrow(userReportSchema, body);

    let reportedUserId = parsed.reportedUserId;
    if (parsed.listingId) {
      const listing = await getListingDetail(parsed.listingId);
      if (!listing) {
        return NextResponse.json({ ok: false, error: "Elan tapılmadı." }, { status: 404 });
      }
      reportedUserId = listing.ownerUserId ?? listing.dealerOwnerUserId ?? reportedUserId;
    }

    if (user && reportedUserId === user.id) {
      return NextResponse.json({ ok: false, error: "Öz elanınızı şikayət edə bilməzsiniz." }, { status: 400 });
    }

    const result = await createUserReport({
      reporterUserId: user?.id,
      reportedUserId,
      listingId: parsed.listingId,
      reasonCode: parsed.reasonCode,
      description: parsed.description,
      reporterEvidence: parsed.reporterEvidence,
      reporterIp: ip,
      reporterUserAgent: userAgent
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    await recordUserActivity({
      userId: user?.id,
      actionType: "user_report_submitted",
      entityType: parsed.listingId ? "listing" : "user",
      entityId: parsed.listingId ?? reportedUserId,
      ipAddress: ip,
      userAgent,
      metadata: {
        reasonCode: parsed.reasonCode,
        reportId: result.report.id,
        incidentId: result.report.incidentId
      }
    });

    return NextResponse.json({
      ok: true,
      report: result.report,
      message:
        "Şikayət qeydə alındı. Satıcıya 7 gün müdafiə sübutu təqdim etmək üçün vaxt verilir. Hər iki tərəfin sübutu yoxlanılacaq."
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof ValidationError ? err.message : "Şikayət göndərilmədi." },
      { status: 400 }
    );
  }
}
