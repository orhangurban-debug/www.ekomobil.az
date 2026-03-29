import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { createAuctionDeposit } from "@/server/auction-payment-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { auctionPaymentSchema, parseOrThrow, ValidationError } from "@/lib/validate";

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Deposit üçün daxil olmalısınız" }, { status: 401 });
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

  const result = await createAuctionDeposit({
    auctionId: parsed.auctionId,
    bidderUserId: user.id,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, deposit: result.deposit, checkoutUrl: result.deposit.checkoutUrl });
}
