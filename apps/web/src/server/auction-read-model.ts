import type { AuctionListingRecord } from "@/lib/auction";
import { fetchAuctionApi } from "@/server/auction-api-client";
import { getAuctionListing } from "@/server/auction-store";

export async function getAuctionListingForRead(auctionId: string): Promise<AuctionListingRecord | null> {
  const response = await fetchAuctionApi(`/api/auctions/${auctionId}/state`);
  if (response?.ok) {
    const payload = (await response.json()) as { ok: boolean; auction?: AuctionListingRecord };
    if (payload.ok && payload.auction) {
      return payload.auction;
    }
  }
  return getAuctionListing(auctionId);
}
