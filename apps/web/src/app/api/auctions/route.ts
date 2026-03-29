import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { fetchAuctionApi } from "@/server/auction-api-client";
import { createAuctionListing, listAuctionListings } from "@/server/auction-store";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { createAuctionSchema, parseOrThrow, ValidationError } from "@/lib/validate";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawLimit = Number(url.searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 100 ? rawLimit : 20;

  const response = await fetchAuctionApi(`/api/auctions?limit=${limit}`);
  if (response) {
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  }

  const auctions = await listAuctionListings(limit);
  return NextResponse.json({ ok: true, auctions });
}

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Auksion lotu yaratmaq üçün daxil olmalısınız" }, { status: 401 });
  }

  // Rate limit: 5 lots per hour per user
  const ip = getClientIp(req);
  const limit = await checkRateLimit(`auction-create:${user.id}:${ip}`, 5, 60);
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
    parsed = parseOrThrow(createAuctionSchema, body);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof ValidationError ? err.message : "Giriş məlumatları yanlışdır." },
      { status: 400 }
    );
  }

  const result = await createAuctionListing({
    listingId: parsed.listingId,
    sellerUserId: user.id,
    mode: parsed.mode,
    startingBidAzn: parsed.startingBidAzn,
    reservePriceAzn: parsed.reservePriceAzn,
    buyNowPriceAzn: parsed.buyNowPriceAzn,
    startsAt: parsed.startsAt,
    endsAt: parsed.endsAt,
    depositRequired: parsed.depositRequired,
    depositAmountAzn: parsed.depositAmountAzn,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, auction: result.auction });
}
