import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { updateListingPlan } from "@/server/listing-store";
import { type PlanType } from "@/lib/listing-plans";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olmalısınız" }, { status: 401 });
  }

  const body = (await _req.json()) as { planType?: string };
  const planType = body.planType as PlanType | undefined;
  if (!planType || !["standard", "vip"].includes(planType)) {
    return NextResponse.json(
      { ok: false, error: "Keçərli plan seçin: standard və ya vip" },
      { status: 400 }
    );
  }

  const result = await updateListingPlan(listingId, user.id, planType);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.error?.includes("tapılmadı") ? 404 : 403 }
    );
  }

  return NextResponse.json({ ok: true, planType });
}
