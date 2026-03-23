import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { createAuctionServicePayment } from "@/server/auction-payment-store";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Ödəniş üçün daxil olmalısınız" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { auctionId?: string };
  if (!body.auctionId?.trim()) {
    return NextResponse.json({ ok: false, error: "auctionId tələb olunur" }, { status: 400 });
  }

  const result = await createAuctionServicePayment({
    auctionId: body.auctionId,
    actorUserId: user.id,
    eventType: "lot_fee"
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, payment: result.payment, checkoutUrl: result.payment.checkoutUrl });
}
