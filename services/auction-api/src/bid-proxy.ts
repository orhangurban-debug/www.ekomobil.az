import type { PoolClient } from "pg";
import { getMinBidIncrement } from "./bid-increment";

export async function computeTieBreakerUserId(
  client: PoolClient,
  auctionId: string,
  userA: string,
  userB: string
): Promise<string> {
  const r = await client.query<{ bidder_user_id: string }>(
    `SELECT bidder_user_id
     FROM auction_bids
     WHERE auction_id = $1 AND bidder_user_id = ANY($2::text[])
     GROUP BY bidder_user_id
     ORDER BY MIN(created_at) ASC
     LIMIT 1`,
    [auctionId, [userA, userB]]
  );
  return r.rows[0]?.bidder_user_id ?? userA;
}

export interface ProxyBattleInput {
  startingBidAzn: number;
  currentBidAzn: number | null;
  currentLeaderId: string | null;
  challengerId: string;
  challengerAmount: number;
  challengerMax: number;
  leaderMax: number | null;
  tieWinnerId: string;
}

export interface ProxyBattleResult {
  winnerId: string;
  finalPrice: number;
  /** Lider qalib qaldıqda avtomatik təklif sətiri üçün */
  leaderAutoAmount?: number;
}

/**
 * İki tərəfli proxy: max_auto ilə minimum qiymət qaydası (tie: tieWinnerId).
 */
export function resolveTwoPartyProxy(input: ProxyBattleInput): ProxyBattleResult {
  const start = input.startingBidAzn;
  const cur = input.currentBidAzn;

  if (!input.currentLeaderId) {
    const price = Math.max(input.challengerAmount, start);
    if (price > input.challengerMax) {
      throw new Error("Təklif limiti keçir");
    }
    return { winnerId: input.challengerId, finalPrice: price };
  }

  if (input.challengerId === input.currentLeaderId) {
    const floor = cur ?? start;
    if (input.challengerAmount < floor) {
      throw new Error("Cari təklifdən aşağı ola bilməz");
    }
    const price = Math.min(input.challengerMax, Math.max(input.challengerAmount, floor));
    return { winnerId: input.challengerId, finalPrice: price };
  }

  const L = Math.max(cur ?? 0, start);
  const Ma = input.leaderMax ?? cur ?? start;
  const Mb = input.challengerMax;

  if (Mb > Ma) {
    const inc = getMinBidIncrement(Math.max(L, Ma));
    let finalPrice = Math.min(Mb, Ma + inc);
    if (finalPrice < input.challengerAmount) {
      finalPrice = input.challengerAmount;
    }
    if (finalPrice > Mb) {
      throw new Error("Maksimum büdcə kifayət etmir");
    }
    return { winnerId: input.challengerId, finalPrice };
  }

  if (Mb < Ma) {
    const inc = getMinBidIncrement(Math.max(L, Mb));
    const finalPrice = Math.min(Ma, Mb + inc);
    return {
      winnerId: input.currentLeaderId,
      finalPrice,
      leaderAutoAmount: finalPrice
    };
  }

  return { winnerId: input.tieWinnerId, finalPrice: Mb };
}
