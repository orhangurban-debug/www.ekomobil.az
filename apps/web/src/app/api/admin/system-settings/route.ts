import { NextResponse } from "next/server";
import type { AuctionPaymentMode } from "@/lib/auction-system-settings";
import { requireApiRoles } from "@/lib/rbac";
import { updateSystemSettings } from "@/server/system-settings-store";

export async function POST(req: Request) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as {
    auctionMode?: AuctionPaymentMode;
    penaltyAmounts?: { vehicle?: number; part?: number };
  };

  const mode = body.auctionMode;
  const vehicle = Number(body.penaltyAmounts?.vehicle);
  const part = Number(body.penaltyAmounts?.part);
  const validMode = mode === "BETA_FIN_ONLY" || mode === "STRICT_PRE_AUTH";
  if (!validMode || !Number.isFinite(vehicle) || vehicle <= 0 || !Number.isFinite(part) || part <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid settings payload." }, { status: 400 });
  }

  try {
    const updated = await updateSystemSettings({
      auctionMode: mode,
      penaltyAmounts: { vehicle, part }
    });
    return NextResponse.json({ ok: true, settings: updated });
  } catch {
    return NextResponse.json({ ok: false, error: "Settings update failed." }, { status: 500 });
  }
}
