import { NextResponse } from "next/server";
import { AnalyticsEvent, analyticsEventNames } from "@/lib/analytics/events";
import { ingestAnalyticsEvent, listAnalyticsEvents } from "@/server/analytics-store";
import { requireApiRoles } from "@/lib/rbac";

export async function POST(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support", "dealer", "viewer"]);
  if (!auth.ok) return auth.response;

  const payload = (await req.json()) as AnalyticsEvent;
  if (!analyticsEventNames.includes(payload.eventName)) {
    return NextResponse.json({ ok: false, error: "Unsupported event name." }, { status: 400 });
  }

  await ingestAnalyticsEvent(payload);
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support", "viewer"]);
  if (!auth.ok) return auth.response;

  return NextResponse.json({ ok: true, items: await listAnalyticsEvents() });
}
