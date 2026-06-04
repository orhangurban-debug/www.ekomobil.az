import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { getDealerProfileIdForUser, updateLeadStage } from "@/server/dealer-store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: Params) {
  const user = await getServerSessionUser();
  if (!user || (user.role !== "dealer" && user.role !== "admin")) {
    return NextResponse.json({ ok: false, error: "Dealer access required." }, { status: 403 });
  }

  let body: { stage?: "new" | "contacted" | "visit_booked" | "closed"; note?: string };
  try {
    body = (await req.json()) as { stage?: "new" | "contacted" | "visit_booked" | "closed"; note?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Keçərsiz sorğu" }, { status: 400 });
  }
  const { id } = await context.params;
  if (!body.stage) {
    return NextResponse.json({ ok: false, error: "Stage tələb olunur." }, { status: 400 });
  }

  try {
    // Non-admin dealers may only mutate leads belonging to their own dealer profile.
    let dealerProfileId: string | undefined;
    if (user.role !== "admin") {
      const ownProfileId = await getDealerProfileIdForUser(user.id);
      if (!ownProfileId) {
        return NextResponse.json({ ok: false, error: "Dealer profili tapılmadı." }, { status: 403 });
      }
      dealerProfileId = ownProfileId;
    }

    const updated = await updateLeadStage({ leadId: id, stage: body.stage, note: body.note, dealerProfileId });
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Lead tapılmadı və ya icazəniz yoxdur." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("dealer lead update error:", error);
    return NextResponse.json({ ok: false, error: "Lead yenilənərkən server xətası baş verdi." }, { status: 500 });
  }
}
