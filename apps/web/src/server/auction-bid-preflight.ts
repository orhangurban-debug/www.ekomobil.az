import { getSystemSettings } from "@/server/system-settings-store";
import {
  getUserBidGate,
  getListingKindForAuction,
  recordBidCardValidation
} from "@/server/auction-bid-preflight-store";
import { hasHeldPreauthForAuction } from "@/server/auction-preauth-store";

export type BidPreflightFailure =
  | { ok: false; status: 403; code: "PENALTY_BALANCE"; message: string }
  | { ok: false; status: 403; code: "ACCOUNT_BLOCKED"; message: string }
  | { ok: false; status: 403; code: "IDENTITY_REQUIRED"; message: string }
  | { ok: false; status: 403; code: "PREAUTH_REQUIRED"; message: string; preauthAmountAzn?: number }
  | { ok: false; status: 403 | 503; code: "CONFIG"; message: string };

export type BidPreflightSuccess = { ok: true };

/**
 * Next.js bid route: auksion API-yə keçməzdən əvvəl rejim, borc və (STRICT) hold yoxlaması.
 */
export async function runAuctionBidPreflight(input: {
  userId: string;
  auctionId: string;
}): Promise<BidPreflightSuccess | BidPreflightFailure> {
  const gate = await getUserBidGate(input.userId);
  if (!gate) {
    return { ok: false, status: 503, code: "CONFIG", message: "İstifadəçi tapılmadı." };
  }
  if (gate.userAccountStatus !== "active") {
    return {
      ok: false,
      status: 403,
      code: "ACCOUNT_BLOCKED",
      message: "Hesabınız aktiv deyil; təklif verə bilməzsiniz."
    };
  }
  if (gate.penaltyBalanceAzn > 0) {
    return {
      ok: false,
      status: 403,
      code: "PENALTY_BALANCE",
      message: "Əvvəlki auksion üzrə platforma borcunuz var. Borc bağlanana qədər təklif verə bilməzsiniz."
    };
  }

  const settings = await getSystemSettings();
  const listingKind = await getListingKindForAuction(input.auctionId);
  if (!listingKind) {
    return { ok: false, status: 503, code: "CONFIG", message: "Lot növü müəyyən edilmədi." };
  }

  if (settings.auctionMode === "BETA_FIN_ONLY") {
    if (!gate.isIdentityVerified) {
      return {
        ok: false,
        status: 403,
        code: "IDENTITY_REQUIRED",
        message: "Bu rejimdə təklif üçün şəxsiyyət təsdiqi (FIN/identifikasiya) tələb olunur."
      };
    }
    const mockCard =
      process.env.NODE_ENV !== "production" || process.env.AUCTION_BID_CARD_VALIDATE_MOCK === "true";
    await recordBidCardValidation({
      userId: input.userId,
      auctionId: input.auctionId,
      status: mockCard ? "simulated_ok" : "initiated"
    });
    if (!mockCard) {
      // Prod: burada 1 ₼ auth + dərhal void (Kapital və s.) çağırılmalıdır; uğursuzdursa 402.
    }
    return { ok: true };
  }

  // STRICT_PRE_AUTH
  const held = await hasHeldPreauthForAuction(input.auctionId, input.userId);
  if (held) return { ok: true };

  const amount =
    listingKind === "part"
      ? settings.penaltyAmounts.part
      : settings.penaltyAmounts.vehicle;

  return {
    ok: false,
    status: 403,
    code: "PREAUTH_REQUIRED",
    message:
      "Bu auksion üçün əvvəlcədən kart hold (pre-auth) tamamlanmalıdır. Ödəniş səhifəsini açıb hold-u bitirin.",
    preauthAmountAzn: amount
  };
}
