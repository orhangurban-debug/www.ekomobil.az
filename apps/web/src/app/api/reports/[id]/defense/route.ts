import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { submitReportDefense } from "@/server/user-report-store";
import { recordUserActivity } from "@/server/user-activity-store";
import { getClientIp } from "@/lib/rate-limit";
import { parseOrThrow, userReportDefenseSchema, ValidationError } from "@/lib/validate";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteContext) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Giriş tələb olunur." }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  try {
    const parsed = parseOrThrow(userReportDefenseSchema, body);
    const result = await submitReportDefense({
      reportId: id,
      reportedUserId: user.id,
      defense: parsed.defense
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    await recordUserActivity({
      userId: user.id,
      actionType: "user_report_defense_submitted",
      entityType: "user_report",
      entityId: id,
      ipAddress: getClientIp(req),
      userAgent: req.headers.get("user-agent") ?? undefined
    });

    return NextResponse.json({
      ok: true,
      report: result.report,
      message: "Müdafiə qeydə alındı. Hər iki tərəfin sübutu yoxlanılacaq."
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof ValidationError ? err.message : "Müdafiə göndərilmədi." },
      { status: 400 }
    );
  }
}
