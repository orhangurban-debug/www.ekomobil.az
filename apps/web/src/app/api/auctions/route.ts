import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { fetchAuctionApi } from "@/server/auction-api-client";
import { createAuctionListing } from "@/server/auction-store";
import { listAuctionListings } from "@/server/auction-store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const response = await fetchAuctionApi(`/api/auctions?limit=${Number.isFinite(limit) && limit > 0 ? limit : 20}`);
  if (response) {
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  }

  const auctions = await listAuctionListings(Number.isFinite(limit) && limit > 0 ? limit : 20);
  return NextResponse.json({ ok: true, auctions });
}

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Auksion lotu yaratmaq üçün daxil olmalısınız" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    listingId?: string;
    mode?: "ascending" | "reserve";
    startingBidAzn?: number;
    reservePriceAzn?: number;
    buyNowPriceAzn?: number;
    startsAt?: string;
    endsAt?: string;
    depositRequired?: boolean;
    depositAmountAzn?: number;
  };

  if (!body.listingId?.trim()) {
    return NextResponse.json({ ok: false, error: "listingId tələb olunur" }, { status: 400 });
  }

  const result = await createAuctionListing({
    listingId: body.listingId,
    sellerUserId: user.id,
    mode: body.mode,
    startingBidAzn: body.startingBidAzn,
    reservePriceAzn: body.reservePriceAzn,
    buyNowPriceAzn: body.buyNowPriceAzn,
    startsAt: body.startsAt,
    endsAt: body.endsAt,
    depositRequired: body.depositRequired,
    depositAmountAzn: body.depositAmountAzn
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, auction: result.auction });
}
