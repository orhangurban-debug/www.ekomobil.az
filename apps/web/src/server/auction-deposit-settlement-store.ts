import type { AuctionStatus } from "@/lib/auction";
import { getPgPool } from "@/lib/postgres";
import { getAuctionDepositsMemory, getAuctionParticipantsMemory } from "@/server/auction-memory";
import { assertAuctionMemoryFallbackAllowed } from "@/server/auction-runtime";

export async function settleHeldDepositsForAuctionOutcome(input: {
  auctionId: string;
  outcomeStatus: AuctionStatus;
  winnerUserId?: string | null;
}): Promise<{ returned: number; forfeited: number }> {
  const shouldReturnAll = ["completed", "seller_breach", "disputed", "not_met_reserve", "cancelled"].includes(
    input.outcomeStatus
  );
  const shouldForfeitWinner = input.outcomeStatus === "no_show";

  if (!shouldReturnAll && !shouldForfeitWinner) {
    return { returned: 0, forfeited: 0 };
  }

  let returned = 0;
  let forfeited = 0;
  try {
    const pool = getPgPool();

    if (shouldForfeitWinner && input.winnerUserId) {
      const forfeitedRows = await pool.query<{ bidder_user_id: string }>(
        `UPDATE auction_deposits
         SET status = 'forfeited',
             forfeited_at = COALESCE(forfeited_at, NOW()),
             updated_at = NOW()
         WHERE auction_id = $1
           AND bidder_user_id = $2
           AND status = 'held'
         RETURNING bidder_user_id`,
        [input.auctionId, input.winnerUserId]
      );
      forfeited = forfeitedRows.rowCount ?? 0;
      if (forfeited > 0) {
        await pool.query(
          `UPDATE auction_participants
           SET deposit_status = 'forfeited',
               updated_at = NOW()
           WHERE auction_id = $1
             AND bidder_user_id = $2`,
          [input.auctionId, input.winnerUserId]
        );
      }
    }

    const returnRows = await pool.query<{ bidder_user_id: string }>(
      `UPDATE auction_deposits
       SET status = 'returned',
           returned_at = COALESCE(returned_at, NOW()),
           updated_at = NOW()
       WHERE auction_id = $1
         AND status = 'held'
         ${shouldForfeitWinner && input.winnerUserId ? "AND bidder_user_id <> $2" : ""}
       RETURNING bidder_user_id`,
      shouldForfeitWinner && input.winnerUserId ? [input.auctionId, input.winnerUserId] : [input.auctionId]
    );
    returned = returnRows.rowCount ?? 0;

    if (returned > 0) {
      if (shouldForfeitWinner && input.winnerUserId) {
        await pool.query(
          `UPDATE auction_participants
           SET deposit_status = 'returned',
               updated_at = NOW()
           WHERE auction_id = $1
             AND bidder_user_id IN (
               SELECT bidder_user_id
               FROM auction_deposits
               WHERE auction_id = $1
                 AND status = 'returned'
             )
             AND bidder_user_id <> $2`,
          [input.auctionId, input.winnerUserId]
        );
      } else {
        await pool.query(
          `UPDATE auction_participants
           SET deposit_status = 'returned',
               updated_at = NOW()
           WHERE auction_id = $1
             AND bidder_user_id IN (
               SELECT bidder_user_id
               FROM auction_deposits
               WHERE auction_id = $1
                 AND status = 'returned'
             )`,
          [input.auctionId]
        );
      }
    }

    return { returned, forfeited };
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    const deposits = getAuctionDepositsMemory();
    const participants = getAuctionParticipantsMemory();
    const nowIso = new Date().toISOString();
    for (const item of deposits) {
      if (item.auctionId !== input.auctionId || item.status !== "held") continue;
      if (shouldForfeitWinner && input.winnerUserId && item.bidderUserId === input.winnerUserId) {
        item.status = "forfeited";
        item.forfeitedAt = item.forfeitedAt ?? nowIso;
        item.updatedAt = nowIso;
        forfeited += 1;
        const participant = participants.find(
          (entry) => entry.auctionId === input.auctionId && entry.bidderUserId === item.bidderUserId
        );
        if (participant) {
          participant.depositStatus = "forfeited";
          participant.updatedAt = nowIso;
        }
        continue;
      }
      item.status = "returned";
      item.returnedAt = item.returnedAt ?? nowIso;
      item.updatedAt = nowIso;
      returned += 1;
      const participant = participants.find(
        (entry) => entry.auctionId === input.auctionId && entry.bidderUserId === item.bidderUserId
      );
      if (participant) {
        participant.depositStatus = "returned";
        participant.updatedAt = nowIso;
      }
    }
    return { returned, forfeited };
  }
}
