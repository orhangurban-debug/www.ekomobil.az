import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { createServiceInquiry } from "@/server/service-inquiry-store";
import { getApprovedServiceListingBySlug } from "@/server/service-listing-store";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function POST(req: Request, context: Params) {
  const { slug } = await context.params;
  const ip = getClientIp(req);
  const limit = await checkRateLimit(`service-inquiry:${ip}:${slug}`, 5, 10);
  if (!limit.ok) return rateLimitResponse(600);

  const listing = await getApprovedServiceListingBySlug(slug);
  if (!listing) {
    return NextResponse.json({ ok: false, error: "Servis profili tapılmadı." }, { status: 404 });
  }

  let body: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    preferredDate?: string;
    note?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Keçərsiz sorğu" }, { status: 400 });
  }

  if (!body.customerName?.trim() || !body.customerPhone?.trim()) {
    return NextResponse.json({ ok: false, error: "Ad və telefon tələb olunur." }, { status: 400 });
  }

  try {
    await createServiceInquiry({
      serviceListingId: listing.id,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      customerEmail: body.customerEmail?.trim(),
      preferredDate: body.preferredDate,
      note: body.note?.trim()
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("service inquiry error:", error);
    return NextResponse.json({ ok: false, error: "Sorğu göndərilə bilmədi." }, { status: 500 });
  }
}
