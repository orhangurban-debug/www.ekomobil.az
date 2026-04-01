import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { getSystemSettings } from "@/server/system-settings-store";
import { getListingKindForAuction } from "@/server/auction-bid-preflight-store";
import { createPendingPreauthHold } from "@/server/auction-preauth-store";
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

  const amountAzn = kind === "part" ? settings.penaltyAmounts.part : settings.penaltyAmounts.vehicle;
  const { id } = await createPendingPreauthHold({
    auctionId,
    userId: user.id,
    amountAzn
  });

  return NextResponse.json({
    ok: true,
    preauthId: id,
    amountAzn,
    message:
      "Növbəti addım: PSP ilə hold yaradıb callback-də statusu 'held' edin. İnkişaf mühitində əl ilə DB yeniləyə bilərsiniz."
  });
}
