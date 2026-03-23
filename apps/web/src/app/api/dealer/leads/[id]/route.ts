import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { updateLeadStage } from "@/server/dealer-store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: Params) {
  const user = await getServerSessionUser();
  if (!user || (user.role !== "dealer" && user.role !== "admin")) {
    return NextResponse.json({ ok: false, error: "Dealer access required." }, { status: 403 });
  }

  const body = (await req.json()) as { stage?: "new" | "contacted" | "visit_booked" | "closed"; note?: string };
  const { id } = await context.params;
  if (!body.stage) {
    return NextResponse.json({ ok: false, error: "Stage tələb olunur." }, { status: 400 });
  }

  await updateLeadStage({ leadId: id, stage: body.stage, note: body.note });
  return NextResponse.json({ ok: true });
}
