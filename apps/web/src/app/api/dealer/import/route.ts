import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { importDealerInventoryCsv } from "@/server/dealer-store";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user || (user.role !== "dealer" && user.role !== "admin")) {
    return NextResponse.json({ ok: false, error: "Dealer access required." }, { status: 403 });
  }

  const body = (await req.json()) as { csv?: string };
  if (!body.csv?.trim()) {
    return NextResponse.json({ ok: false, error: "CSV məzmunu tələb olunur." }, { status: 400 });
  }

  const result = await importDealerInventoryCsv(user.id, body.csv);
  return NextResponse.json({ ok: true, ...result });
}
