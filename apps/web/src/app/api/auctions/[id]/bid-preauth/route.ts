import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { getBidPreauthHoldAmountAzn } from "@/lib/auction-fees";
import { getSystemSettings } from "@/server/system-settings-store";
import { getListingKindForAuction } from "@/server/auction-bid-preflight-store";
import { createPendingPreauthHold } from "@/server/auction-preauth-store";
import { applyRiskAdjustedPreauthHold, getAuctionUserRiskProfile } from "@/server/auction-risk-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * STRICT_PRE_AUTH: lot üçün hold sətri yaradır (Kapital callback ilə 'held' olmalıdır).
 */
export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olmalısınız" }, { status: 401 });
  }

  const { id: auctionId } = await context.params;
  if (!auctionId || !/^[0-9a-f-]{36}$/.test(auctionId)) {
    return NextResponse.json({ ok: false, error: "Keçərsiz auksion ID" }, { status: 400 });
  }

  const ip = getClientIp(_req);
  const limit = await checkRateLimit(`bid-preauth:${user.id}:${ip}`, 5, 1);
  if (!limit.ok) return rateLimitResponse(60);

  const settings = await getSystemSettings();
  if (settings.auctionMode !== "STRICT_PRE_AUTH") {
    return NextResponse.json(
      { ok: false, error: "Bu rejimdə pre-auth tələb olunmur." },
      { status: 400 }
    );
  }

  const kind = await getListingKindForAuction(auctionId);
  if (!kind) {
    return NextResponse.json({ ok: false, error: "Auksion tapılmadı" }, { status: 404 });
  }

  const basePenalty = kind === "part" ? settings.penaltyAmounts.part : settings.penaltyAmounts.vehicle;
  const baseHold = getBidPreauthHoldAmountAzn(kind, basePenalty);
  const risk = await getAuctionUserRiskProfile(user.id);
  const amountAzn = applyRiskAdjustedPreauthHold(baseHold, risk.preauthMultiplier, kind);
  const preauth = await createPendingPreauthHold({
    auctionId,
    userId: user.id,
    amountAzn
  });

  return NextResponse.json({
    ok: true,
    preauthId: preauth.id,
    amountAzn,
    checkoutUrl: preauth.checkoutUrl,
    riskTier: risk.tier,
    message: "Simvolik kart hold checkout-u yaradıldı."
  });
}
