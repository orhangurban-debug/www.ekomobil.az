import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { notifyAuctionApiEvent } from "@/server/auction-api-client";
import { confirmAuctionSale } from "@/server/auction-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { confirmSaleSchema, parseOrThrow, ValidationError } from "@/lib/validate";

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

  // Rate limit: 10 confirmation actions per hour per user
  const ip = getClientIp(req);
  const limit = await checkRateLimit(`confirm-sale:${user.id}:${ip}`, 10, 60);
  if (!limit.ok) {
    return rateLimitResponse(300);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseOrThrow(confirmSaleSchema, body);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof ValidationError ? err.message : "Giriş məlumatları yanlışdır." },
      { status: 400 }
    );
  }

  const result = await confirmAuctionSale({
    auctionId: id,
    actorUserId: user.id,
    actorRole: parsed.actorRole,
    outcome: parsed.outcome,
    note: parsed.note,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  if (result.auction) {
    await notifyAuctionApiEvent({
      auctionId: result.auction.id,
      type: "auction.updated",
      payload: {
        auction: result.auction,
        outcome: result.outcome,
        actorRole: parsed.actorRole,
        action: parsed.outcome,
      },
    }).catch(() => undefined);
  }

  return NextResponse.json({
    ok: true,
    auction: result.auction,
    outcome: result.outcome,
  });
}
