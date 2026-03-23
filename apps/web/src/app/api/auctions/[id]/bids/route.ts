import { NextResponse } from "next/server";
import { fetchAuctionApi } from "@/server/auction-api-client";
import { listAuctionBids } from "@/server/auction-bid-store";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 50;
  const response = await fetchAuctionApi(`/api/auctions/${id}/bids?limit=${safeLimit}`);
  if (response) {
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  }

  const bids = await listAuctionBids(id, safeLimit);
  return NextResponse.json({ ok: true, bids });
}
