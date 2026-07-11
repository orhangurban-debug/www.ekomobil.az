import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { recordServiceListingStat, type ServiceStatEvent } from "@/server/service-stats-store";
import { getApprovedServiceListingBySlug } from "@/server/service-listing-store";

interface Params {
  params: Promise<{ slug: string }>;
}

const ALLOWED: ServiceStatEvent[] = ["view", "contact_click"];

export async function POST(req: Request, context: Params) {
  const { slug } = await context.params;
  const ip = getClientIp(req);
  const limit = await checkRateLimit(`service-stat:${ip}:${slug}`, 30, 60);
  if (!limit.ok) return rateLimitResponse(60);

  const listing = await getApprovedServiceListingBySlug(slug);
  if (!listing) {
    return NextResponse.json({ ok: false, error: "Servis tapılmadı." }, { status: 404 });
  }

  let body: { event?: string };
  try {
    body = (await req.json()) as { event?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Keçərsiz sorğu" }, { status: 400 });
  }

  if (!body.event || !ALLOWED.includes(body.event as ServiceStatEvent)) {
    return NextResponse.json({ ok: false, error: "Keçərsiz event." }, { status: 400 });
  }

  await recordServiceListingStat(listing.id, body.event as ServiceStatEvent);
  return NextResponse.json({ ok: true });
}
