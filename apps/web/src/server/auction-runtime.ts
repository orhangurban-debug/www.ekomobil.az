export function getAuctionApiBaseUrl(): string | null {
  return process.env.AUCTION_API_BASE_URL?.replace(/\/$/, "") ?? null;
}

export function isAuctionApiConfigured(): boolean {
  return Boolean(getAuctionApiBaseUrl());
}

export function canUseAuctionMemoryFallback(): boolean {
  if (process.env.AUCTION_ALLOW_MEMORY_FALLBACK === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function assertAuctionMemoryFallbackAllowed(cause?: unknown): void {
  if (canUseAuctionMemoryFallback()) return;
  if (cause instanceof Error) {
    throw cause;
  }
  throw new Error("Auction persistence is unavailable and memory fallback is disabled.");
}

export function isDirectAuctionBidPathDisabled(): boolean {
  if (process.env.AUCTION_DIRECT_BID_PATH === "enabled") return false;
  return isAuctionApiConfigured() || process.env.NODE_ENV === "production";
}
