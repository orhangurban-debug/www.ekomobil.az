import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { getClientIp } from "@/lib/rate-limit";
import { recordAllPlatformConsents } from "@/server/user-consent-store";
import { recordUserActivity } from "@/server/user-activity-store";
import { platformConsentSchema, parseOrThrow, ValidationError } from "@/lib/validate";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Giriş tələb olunur." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  try {
    const parsed = parseOrThrow(platformConsentSchema, body);
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const result = await recordAllPlatformConsents({
      userId: user.id,
      ipAddress: ip,
      userAgent,
      source: parsed.source ?? "reaccept"
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    await recordUserActivity({
      userId: user.id,
      actionType: "platform_consent_accepted",
      ipAddress: ip,
      userAgent,
      metadata: { source: parsed.source ?? "reaccept" }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof ValidationError ? err.message : "Razılaşma qəbul edilmədi." },
      { status: 400 }
    );
  }
}
