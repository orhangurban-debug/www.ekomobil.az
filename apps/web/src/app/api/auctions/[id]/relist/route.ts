import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { notifyAuctionApiEvent } from "@/server/auction-api-client";
import { createAuctionServicePayment } from "@/server/auction-payment-store";
import { relistAuctionFromPrevious } from "@/server/auction-store";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Əməliyyat üçün daxil olmalısınız" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ ok: false, error: "Keçərsiz auksion ID" }, { status: 400 });
  }

  const ip = getClientIp(req);
  const limit = await checkRateLimit(`auction-relist:${user.id}:${ip}`, 10, 60);
  if (!limit.ok) {
    return rateLimitResponse(300);
  }

  const relistResult = await relistAuctionFromPrevious({
    sourceAuctionId: id,
    actorUserId: user.id
  });
  if (!relistResult.ok) {
    return NextResponse.json({ ok: false, error: relistResult.error }, { status: 400 });
  }

  const lotPayment = await createAuctionServicePayment({
    auctionId: relistResult.auction.id,
    actorUserId: user.id,
    eventType: "lot_fee"
  });
  if (!lotPayment.ok || !lotPayment.payment.checkoutUrl) {
    return NextResponse.json(
      { ok: false, error: lotPayment.ok ? "Lot checkout yaradıla bilmədi" : lotPayment.error },
      { status: 400 }
    );
  }

  let bondCheckoutUrl: string | undefined;
  if (relistResult.auction.sellerBondRequired) {
    const bondPayment = await createAuctionServicePayment({
      auctionId: relistResult.auction.id,
      actorUserId: user.id,
      eventType: "seller_performance_bond"
    });
    if (!bondPayment.ok || !bondPayment.payment.checkoutUrl) {
      return NextResponse.json(
        { ok: false, error: bondPayment.ok ? "Satıcı bond checkout yaradıla bilmədi" : bondPayment.error },
        { status: 400 }
      );
    }
    bondCheckoutUrl = bondPayment.payment.checkoutUrl;
  }

  await notifyAuctionApiEvent({
    auctionId: relistResult.auction.id,
    type: "auction.updated",
    payload: {
      auction: relistResult.auction,
      action: "relisted_from_previous",
      sourceAuctionId: id
    }
  }).catch(() => undefined);

  return NextResponse.json({
    ok: true,
    auction: relistResult.auction,
    lotCheckoutUrl: lotPayment.payment.checkoutUrl,
    bondCheckoutUrl
  });
}
