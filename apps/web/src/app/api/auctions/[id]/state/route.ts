import { NextResponse } from "next/server";
import { fetchAuctionApi } from "@/server/auction-api-client";
import { runAuctionCloseSweepIfDue } from "@/server/auction-close-worker";
import { getAuctionListing } from "@/server/auction-store";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const response = await fetchAuctionApi(`/api/auctions/${id}/state`);
  if (response) {
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  }

  await runAuctionCloseSweepIfDue();
  const auction = await getAuctionListing(id);
  if (!auction) {
    return NextResponse.json({ ok: false, error: "Auksion tapılmadı" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, auction });
}
