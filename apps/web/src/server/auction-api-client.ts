import { getAuctionApiBaseUrl } from "@/server/auction-runtime";

function buildAuctionApiUrl(path: string): string | null {
  const baseUrl = getAuctionApiBaseUrl();
  if (!baseUrl) return null;
  return `${baseUrl}${path}`;
}

export function hasAuctionApi(): boolean {
  return Boolean(buildAuctionApiUrl(""));
}

export async function fetchAuctionApi(path: string, init?: RequestInit): Promise<Response | null> {
  const url = buildAuctionApiUrl(path);
  if (!url) return null;
  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });
}

export async function notifyAuctionApiEvent(input: {
  auctionId: string;
  type: "payment.updated" | "auction.updated";
  payload: Record<string, unknown>;
  occurredAt?: string;
}): Promise<void> {
  const response = await fetchAuctionApi("/api/internal/events", {
    method: "POST",
    headers: {
      "x-auction-internal-secret": process.env.AUCTION_API_INTERNAL_SECRET ?? ""
    },
    body: JSON.stringify(input)
  });
  if (response && !response.ok) {
    throw new Error(`Auction API event publish failed with status ${response.status}`);
  }
}
