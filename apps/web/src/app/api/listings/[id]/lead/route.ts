import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { LeadInboxLimitError } from "@/server/business-leads-store";
import { createLeadForListing } from "@/server/dealer-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, context: Params) {
  const { id } = await context.params;

  const ip = getClientIp(req);
  const limit = await checkRateLimit(`lead:${ip}:${id}`, 5, 10);
  if (!limit.ok) return rateLimitResponse(600);

  let body: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    note?: string;
    source?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Keçərsiz sorğu" }, { status: 400 });
  }

  if (!body.customerName?.trim()) {
    return NextResponse.json({ ok: false, error: "Müştəri adı tələb olunur." }, { status: 400 });
  }

  try {
    await createLeadForListing({
      listingId: id,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone?.trim(),
      customerEmail: body.customerEmail?.trim(),
      note: body.note?.trim(),
      source: body.source || "listing_detail"
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof LeadInboxLimitError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 429 });
    }
    console.error("create lead error:", error);
    return NextResponse.json({ ok: false, error: "Müraciət göndərilə bilmədi." }, { status: 500 });
  }
}
