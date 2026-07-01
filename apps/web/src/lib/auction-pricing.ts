import type { AuctionMode } from "@/lib/auction";

/** Açıq minimum satış qiyməti — hərrac bu məbləğdən başlayır və altında satılmır. */
export function resolveTransparentAuctionFloor(floorAzn: number): {
  startingBidAzn: number;
  reservePriceAzn: number;
  mode: Extract<AuctionMode, "reserve">;
} {
  const floor = Math.round(floorAzn);
  if (!Number.isFinite(floor) || floor <= 0) {
    throw new Error("Minimum satış qiyməti düzgün deyil");
  }
  return {
    startingBidAzn: floor,
    reservePriceAzn: floor,
    mode: "reserve"
  };
}

export function validateMinimumSalePriceAgainstListing(input: {
  minimumSalePriceAzn: number;
  listingPriceAzn: number;
}): { ok: true } | { ok: false; error: string } {
  const minimum = Math.round(input.minimumSalePriceAzn);
  const listingPrice = Math.round(input.listingPriceAzn);

  if (!Number.isFinite(minimum) || minimum <= 0) {
    return { ok: false, error: "Minimum satış qiyməti 0-dan böyük olmalıdır" };
  }
  if (minimum > listingPrice) {
    return {
      ok: false,
      error:
        "Minimum satış qiyməti elandakı qiymətdən yüksək ola bilməz. Əvvəlcə elan qiymətini yeniləyin."
    };
  }
  return { ok: true };
}
