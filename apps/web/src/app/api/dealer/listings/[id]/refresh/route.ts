import { NextResponse } from "next/server";
import { requireSalonPanelAccess } from "@/server/business-access";
import { refreshDealerListingInventory } from "@/server/dealer-store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, context: Params) {
  const auth = await requireSalonPanelAccess();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: "Salon girişi tələb olunur." }, { status: 403 });
  }

  const { id } = await context.params;
  const ok = await refreshDealerListingInventory(auth.user.id, id);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Elan tapılmadı və ya icazəniz yoxdur." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
