import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { createAuctionServicePayment } from "@/server/auction-payment-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { auctionPaymentSchema, parseOrThrow, ValidationError } from "@/lib/validate";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Ödəniş üçün daxil olmalısınız" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const limit = await checkRateLimit(`payment:${user.id}:${ip}`, 10, 10);
  if (!limit.ok) return rateLimitResponse(120);

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  let parsed;
  try { parsed = parseOrThrow(auctionPaymentSchema, body); } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof ValidationError ? err.message : "Yanlış məlumat." }, { status: 400 });
  }

  const result = await createAuctionServicePayment({
    auctionId: parsed.auctionId,
    actorUserId: user.id,
    eventType: "lot_fee",
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, payment: result.payment, checkoutUrl: result.payment.checkoutUrl });
}
