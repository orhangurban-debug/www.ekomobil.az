import { NextResponse } from "next/server";
import { getPricingPlanAdminConfig } from "@/server/system-settings-store";
import { isLaunchPromoActive, getLaunchPromoBadgeText } from "@/lib/launch-promo";

/**
 * Public, unauthenticated endpoint so client-side publish/upgrade forms can
 * show live "açılış kampaniyası" pricing without a server-rendered wrapper.
 */
export async function GET() {
  const cfg = await getPricingPlanAdminConfig();
  const active = isLaunchPromoActive(cfg.launchPromo);
  return NextResponse.json({
    ok: true,
    active,
    badge: getLaunchPromoBadgeText(cfg.launchPromo)
  });
}
