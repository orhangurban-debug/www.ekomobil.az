import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { runAuctionBidPreflight } from "@/server/auction-bid-preflight";
import { fetchAuctionApi } from "@/server/auction-api-client";
import { placeAuctionBid } from "@/server/auction-bid-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { placeBidSchema, parseOrThrow, ValidationError } from "@/lib/validate";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Bid vermək üçün daxil olmalısınız" }, { status: 401 });
  }

  const { id } = await context.params;

  // Validate auction ID format before hitting DB
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ ok: false, error: "Keçərsiz auksion ID" }, { status: 400 });
  }

  // Rate limiting: 10 bids per minute per user across all auctions
  // + 3 bids per minute per user per specific auction (prevent sniping spam)
  const ip = getClientIp(req);
  const [globalLimit, auctionLimit] = await Promise.all([
    checkRateLimit(`bid:user:${user.id}`, 10, 1),
    checkRateLimit(`bid:user:${user.id}:auction:${id}`, 3, 1),
  ]);
  if (!globalLimit.ok || !auctionLimit.ok) {
    return rateLimitResponse(30);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseOrThrow(placeBidSchema, body);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof ValidationError ? err.message : "Bid məlumatları yanlışdır." },
      { status: 400 }
    );
  }

  // Hash IP and User-Agent for forensics (never store raw IP in auction events)
  const rawIp = ip;
  const userAgent = req.headers.get("user-agent") ?? "";
  const { createHash } = await import("node:crypto");
  const ipHash = createHash("sha256").update(rawIp + (process.env.AUTH_SECRET ?? "")).digest("hex").slice(0, 32);
  const deviceFingerprint = createHash("sha256")
    .update(userAgent + rawIp + (process.env.AUTH_SECRET ?? ""))
    .digest("hex")
    .slice(0, 32);

  const pre = await runAuctionBidPreflight({ userId: user.id, auctionId: id });
  if (!pre.ok) {
    const body: Record<string, unknown> = { ok: false, error: pre.message, code: pre.code };
    if (pre.code === "PREAUTH_REQUIRED" && pre.preauthAmountAzn !== undefined) {
      body.preauthAmountAzn = pre.preauthAmountAzn;
    }
    return NextResponse.json(body, { status: pre.status });
  }

  const proxied = await fetchAuctionApi(`/api/auctions/${id}/bids`, {
    method: "POST",
    body: JSON.stringify({
      bidderUserId: user.id,
      amountAzn: parsed.amountAzn,
      autoBidMaxAzn: parsed.autoBidMaxAzn,
      ip: ipHash,
      deviceFingerprint,
    }),
  });
  if (proxied) {
    const payload = await proxied.json();
    return NextResponse.json(payload, { status: proxied.status });
  }

  const result = await placeAuctionBid({
    auctionId: id,
    bidderUserId: user.id,
    amountAzn: parsed.amountAzn,
    autoBidMaxAzn: parsed.autoBidMaxAzn,
    ip: ipHash,
    deviceFingerprint,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, nextMinimumBidAzn: result.nextMinimumBidAzn },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    bid: result.bid,
    nextMinimumBidAzn: result.nextMinimumBidAzn,
  });
}
