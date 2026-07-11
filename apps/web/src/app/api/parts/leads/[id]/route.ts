import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { requirePartsStoreAccess } from "@/server/business-access";
import { updateLeadStage } from "@/server/business-leads-store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: Params) {
  const access = await requirePartsStoreAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: "Mağaza girişi tələb olunur." }, { status: 403 });
  }

  let body: { stage?: "new" | "contacted" | "visit_booked" | "closed"; note?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Keçərsiz sorğu" }, { status: 400 });
  }

  const { id } = await context.params;
  if (!body.stage) {
    return NextResponse.json({ ok: false, error: "Stage tələb olunur." }, { status: 400 });
  }

  const updated = await updateLeadStage({
    leadId: id,
    stage: body.stage,
    note: body.note,
    ownerUserId: access.user.id,
    businessType: "parts_store"
  });

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Sorğu tapılmadı və ya icazəniz yoxdur." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
