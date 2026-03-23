import { NextResponse } from "next/server";
import { createLeadForListing } from "@/server/dealer-store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, context: Params) {
  const body = (await req.json()) as {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    note?: string;
    source?: string;
  };
  const { id } = await context.params;
  if (!body.customerName?.trim()) {
    return NextResponse.json({ ok: false, error: "Müştəri adı tələb olunur." }, { status: 400 });
  }

  await createLeadForListing({
    listingId: id,
    customerName: body.customerName.trim(),
    customerPhone: body.customerPhone?.trim(),
    customerEmail: body.customerEmail?.trim(),
    note: body.note?.trim(),
    source: body.source || "listing_detail"
  });
  return NextResponse.json({ ok: true });
}
