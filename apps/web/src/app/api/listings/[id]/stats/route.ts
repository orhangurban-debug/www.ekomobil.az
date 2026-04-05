import { NextResponse } from "next/server";
import { bumpListingStat, getListingStats } from "@/server/listing-stats-store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: Params) {
  const { id } = await context.params;
  const stats = await getListingStats(id);
  return NextResponse.json({ ok: true, stats });
}

export async function POST(req: Request, context: Params) {
  const { id } = await context.params;
  const body = (await req.json()) as { action?: "view" | "contact_click" | "test_drive_click" };
  if (!body.action || !["view", "contact_click", "test_drive_click"].includes(body.action)) {
    return NextResponse.json({ ok: false, error: "Yanlış statistika əməliyyatı." }, { status: 400 });
  }
  await bumpListingStat(id, body.action);
  return NextResponse.json({ ok: true });
}
