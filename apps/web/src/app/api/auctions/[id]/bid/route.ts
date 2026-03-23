import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { fetchAuctionApi } from "@/server/auction-api-client";
import { placeAuctionBid } from "@/server/auction-bid-store";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Bid vermək üçün daxil olmalısınız" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await req.json().catch(() => ({}))) as {
    amountAzn?: number;
    autoBidMaxAzn?: number;
  };

  if (!body.amountAzn || body.amountAzn <= 0) {
    return NextResponse.json({ ok: false, error: "Keçərli bid məbləği tələb olunur" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const deviceFingerprint = req.headers.get("user-agent") ?? undefined;

  const proxied = await fetchAuctionApi(`/api/auctions/${id}/bids`, {
    method: "POST",
    body: JSON.stringify({
      bidderUserId: user.id,
      amountAzn: body.amountAzn,
      autoBidMaxAzn: body.autoBidMaxAzn,
      ip,
      deviceFingerprint
    })
  });
  if (proxied) {
    const payload = await proxied.json();
    return NextResponse.json(payload, { status: proxied.status });
  }

  const result = await placeAuctionBid({
    auctionId: id,
    bidderUserId: user.id,
    amountAzn: body.amountAzn,
    autoBidMaxAzn: body.autoBidMaxAzn,
    ip,
    deviceFingerprint
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, nextMinimumBidAzn: result.nextMinimumBidAzn }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    bid: result.bid,
    nextMinimumBidAzn: result.nextMinimumBidAzn
  });
}
