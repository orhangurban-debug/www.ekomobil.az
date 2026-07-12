import { NextResponse } from "next/server";
import type { AuctionPaymentMode } from "@/lib/auction-system-settings";
import { requireAdminCapability } from "@/lib/rbac";
import { createAdminAuditLog } from "@/server/admin-audit-store";
import { updateSystemSettings } from "@/server/system-settings-store";

export async function POST(req: Request) {
  const auth = await requireAdminCapability(req, "settings.manage");
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as {
    auctionMode?: AuctionPaymentMode;
    penaltyAmounts?: { vehicle?: number; part?: number };
    sellerBreachAmounts?: { vehicle?: number; part?: number };
  };

  const mode = body.auctionMode;
  const noShowVehicle = Number(body.penaltyAmounts?.vehicle);
  const noShowPart = Number(body.penaltyAmounts?.part);
  const breachVehicle = Number(body.sellerBreachAmounts?.vehicle);
  const breachPart = Number(body.sellerBreachAmounts?.part);
  const validMode = mode === "BETA_FIN_ONLY" || mode === "STRICT_PRE_AUTH";
  const validNoShow = Number.isFinite(noShowVehicle) && noShowVehicle > 0 && Number.isFinite(noShowPart) && noShowPart > 0;
  const validBreach = Number.isFinite(breachVehicle) && breachVehicle > 0 && Number.isFinite(breachPart) && breachPart > 0;
  if (!validMode || !validNoShow || !validBreach) {
    return NextResponse.json({ ok: false, error: "Ayar məlumatları yanlışdır." }, { status: 400 });
  }

  try {
    const updated = await updateSystemSettings({
      auctionMode: mode,
      penaltyAmounts: { vehicle: noShowVehicle, part: noShowPart },
      sellerBreachAmounts: { vehicle: breachVehicle, part: breachPart }
    });
    await createAdminAuditLog({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
      actionType: "system_settings_updated",
      entityType: "settings",
      entityId: "auction_system",
      metadata: updated
    });
    return NextResponse.json({ ok: true, settings: updated });
  } catch {
    return NextResponse.json({ ok: false, error: "Ayarların yenilənməsi uğursuz oldu." }, { status: 500 });
  }
}
