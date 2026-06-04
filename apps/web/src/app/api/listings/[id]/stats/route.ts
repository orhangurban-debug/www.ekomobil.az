import { NextResponse } from "next/server";
import { bumpListingStat, getListingStats } from "@/server/listing-stats-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: Params) {
  const { id } = await context.params;
  try {
    const stats = await getListingStats(id);
    return NextResponse.json({ ok: true, stats });
  } catch {
    return NextResponse.json({ ok: true, stats: null });
  }
}

export async function POST(req: Request, context: Params) {
  const { id } = await context.params;

  // Public endpoint — rate limit per IP+listing to limit metric inflation.
  const ip = getClientIp(req);
  const limit = await checkRateLimit(`stats:${ip}:${id}`, 40, 1);
  if (!limit.ok) return rateLimitResponse(60);

  let body: { action?: "view" | "contact_click" | "test_drive_click" };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Keçərsiz sorğu" }, { status: 400 });
  }

  if (!body.action || !["view", "contact_click", "test_drive_click"].includes(body.action)) {
    return NextResponse.json({ ok: false, error: "Yanlış statistika əməliyyatı." }, { status: 400 });
  }

  try {
    await bumpListingStat(id, body.action);
    return NextResponse.json({ ok: true });
  } catch {
    // Stats are best-effort; never surface a 500 to the client for a view bump.
    return NextResponse.json({ ok: true });
  }
}
