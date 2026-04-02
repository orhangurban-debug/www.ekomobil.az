import { getPgPool } from "@/lib/postgres";
import type { ListingKind } from "@/lib/marketplace-types";

export type AuctionRiskTier = "trusted" | "standard" | "watch" | "restricted";

export interface AuctionUserRiskProfile {
  tier: AuctionRiskTier;
  preauthMultiplier: number;
  bidCapAzn: number | null;
  stats: {
    completedCount: number;
    disputedCount: number;
    buyerNoShowCount: number;
    sellerBreachCount: number;
    recentBreaches180d: number;
    accountAgeDays: number;
  };
}

function toSafeNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function resolveTier(input: {
  completedCount: number;
  disputedCount: number;
  buyerNoShowCount: number;
  sellerBreachCount: number;
  recentBreaches180d: number;
  accountAgeDays: number;
}): AuctionRiskTier {
  const severe = input.buyerNoShowCount + input.sellerBreachCount;
  if (input.recentBreaches180d >= 2 || severe >= 3) return "restricted";
  if (input.recentBreaches180d >= 1 || severe >= 1 || input.disputedCount >= 2) return "watch";
  if (input.completedCount >= 5 && input.disputedCount === 0 && input.accountAgeDays >= 30) return "trusted";
  return "standard";
}

function controlsForTier(tier: AuctionRiskTier): { preauthMultiplier: number; bidCapAzn: number | null } {
  switch (tier) {
    case "trusted":
      return { preauthMultiplier: 0.8, bidCapAzn: null };
    case "standard":
      return { preauthMultiplier: 1, bidCapAzn: null };
    case "watch":
      return { preauthMultiplier: 1.4, bidCapAzn: 50_000 };
    case "restricted":
      return { preauthMultiplier: 2, bidCapAzn: 20_000 };
  }
}

export function applyRiskAdjustedPreauthHold(
  baseHoldAzn: number,
  multiplier: number,
  kind: ListingKind
): number {
  const raw = Math.round(baseHoldAzn * multiplier);
  if (kind === "part") {
    return Math.max(5, Math.min(raw, 40));
  }
  return Math.max(20, Math.min(raw, 150));
}

export async function getAuctionUserRiskProfile(userId: string): Promise<AuctionUserRiskProfile> {
  try {
    const pool = getPgPool();

    const [accountRes, statsRes] = await Promise.all([
      pool.query<{ account_age_days: number }>(
        `SELECT GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400))::int AS account_age_days
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [userId]
      ),
      pool.query<{
        completed_count: string;
        disputed_count: string;
        buyer_no_show_count: string;
        seller_breach_count: string;
        recent_breaches_180d: string;
      }>(
        `SELECT
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::text                     AS completed_count,
           SUM(CASE WHEN status = 'disputed' THEN 1 ELSE 0 END)::text                      AS disputed_count,
           SUM(CASE WHEN status = 'no_show' AND winner_user_id = $1 THEN 1 ELSE 0 END)::text AS buyer_no_show_count,
           SUM(CASE WHEN status = 'seller_breach' AND seller_user_id = $1 THEN 1 ELSE 0 END)::text AS seller_breach_count,
           SUM(CASE
                 WHEN status IN ('no_show', 'seller_breach')
                  AND updated_at >= NOW() - INTERVAL '180 days'
                  AND (winner_user_id = $1 OR seller_user_id = $1)
                 THEN 1 ELSE 0
               END)::text AS recent_breaches_180d
         FROM auction_listings
         WHERE winner_user_id = $1 OR seller_user_id = $1`
        ,
        [userId]
      )
    ]);

    const accountAgeDays = toSafeNumber(accountRes.rows[0]?.account_age_days ?? 0);
    const row = statsRes.rows[0];
    const completedCount = toSafeNumber(row?.completed_count);
    const disputedCount = toSafeNumber(row?.disputed_count);
    const buyerNoShowCount = toSafeNumber(row?.buyer_no_show_count);
    const sellerBreachCount = toSafeNumber(row?.seller_breach_count);
    const recentBreaches180d = toSafeNumber(row?.recent_breaches_180d);

    const tier = resolveTier({
      completedCount,
      disputedCount,
      buyerNoShowCount,
      sellerBreachCount,
      recentBreaches180d,
      accountAgeDays
    });
    const controls = controlsForTier(tier);

    return {
      tier,
      preauthMultiplier: controls.preauthMultiplier,
      bidCapAzn: controls.bidCapAzn,
      stats: {
        completedCount,
        disputedCount,
        buyerNoShowCount,
        sellerBreachCount,
        recentBreaches180d,
        accountAgeDays
      }
    };
  } catch {
    return {
      tier: "standard",
      preauthMultiplier: 1,
      bidCapAzn: null,
      stats: {
        completedCount: 0,
        disputedCount: 0,
        buyerNoShowCount: 0,
        sellerBreachCount: 0,
        recentBreaches180d: 0,
        accountAgeDays: 0
      }
    };
  }
}
