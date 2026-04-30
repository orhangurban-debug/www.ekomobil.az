import type { AuctionBidRecord, AuctionListingRecord } from "@/lib/auction";

type AuctionSnapshotResponse = {
  ok: boolean;
  auction?: AuctionListingRecord;
  bids?: AuctionBidRecord[];
  error?: string;
};

type AuctionListResponse = {
  ok: boolean;
  auctions?: AuctionListingRecord[];
  error?: string;
};

type AuctionBidsResponse = {
  ok: boolean;
  bids?: AuctionBidRecord[];
  error?: string;
};

export async function fetchAuctionList(limit = 20): Promise<AuctionListingRecord[]> {
  const response = await fetch(`/api/auctions?limit=${limit}`, { cache: "no-store" });
  const payload = (await response.json()) as AuctionListResponse;
  if (!response.ok || !payload.ok || !payload.auctions) {
    throw new Error(payload.error ?? "Auksion siyahısı yüklənmədi");
  }
  return payload.auctions;
}

export async function fetchAuctionState(auctionId: string): Promise<AuctionListingRecord> {
  const response = await fetch(`/api/auctions/${auctionId}/state`, { cache: "no-store" });
  const payload = (await response.json()) as AuctionSnapshotResponse;
  if (!response.ok || !payload.ok || !payload.auction) {
    throw new Error(payload.error ?? "Auksion vəziyyəti yüklənmədi");
  }
  return payload.auction;
}

export async function fetchAuctionBids(auctionId: string, limit = 50): Promise<AuctionBidRecord[]> {
  const response = await fetch(`/api/auctions/${auctionId}/bids?limit=${limit}`, { cache: "no-store" });
  const payload = (await response.json()) as AuctionBidsResponse;
  if (!response.ok || !payload.ok || !payload.bids) {
    throw new Error(payload.error ?? "Bid tarixi yüklənmədi");
  }
  return payload.bids;
}

export function subscribeAuctionStream(
  auctionId: string,
  handlers: {
    onSnapshot: (payload: { auction?: AuctionListingRecord; bids?: AuctionBidRecord[] }) => void;
    onBidAccepted: (payload: { auction?: AuctionListingRecord; bid?: AuctionBidRecord }) => void;
    onCoordination: (payload: { auction?: AuctionListingRecord }) => void;
    onError?: () => void;
  }
): () => void {
  const source = new EventSource(`/api/auctions/${auctionId}/stream`);
  function safeParse<T>(raw: string): T | null {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  source.addEventListener("snapshot", (event) => {
    const parsed = safeParse<{
      payload?: { auction?: AuctionListingRecord; bids?: AuctionBidRecord[] };
    }>((event as MessageEvent).data);
    if (parsed) handlers.onSnapshot(parsed.payload ?? {});
  });
  source.addEventListener("bid.accepted", (event) => {
    const parsed = safeParse<{
      payload?: { auction?: AuctionListingRecord; bid?: AuctionBidRecord };
    }>((event as MessageEvent).data);
    if (parsed) handlers.onBidAccepted(parsed.payload ?? {});
  });
  source.addEventListener("payment.updated", (event) => {
    const parsed = safeParse<{
      payload?: { auction?: AuctionListingRecord };
    }>((event as MessageEvent).data);
    if (parsed) handlers.onCoordination(parsed.payload ?? {});
  });
  source.addEventListener("auction.updated", (event) => {
    const parsed = safeParse<{
      payload?: { auction?: AuctionListingRecord };
    }>((event as MessageEvent).data);
    if (parsed) handlers.onCoordination(parsed.payload ?? {});
  });
  source.onerror = () => {
    handlers.onError?.();
    source.close();
  };
  return () => source.close();
}
