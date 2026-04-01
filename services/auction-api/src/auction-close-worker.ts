import { getPgPool } from "./postgres";

const WORKER_INTERVAL_MS = Number(process.env.AUCTION_CLOSE_WORKER_MS ?? 30_000);

function pickClosedStatus(input: {
  currentBidAzn: number | null;
  reservePriceAzn: number | null;
  currentBidderUserId: string | null;
}): { status: string; winnerUserId: string | null } {
  const bid = input.currentBidAzn;
  const reserve = input.reservePriceAzn;
  const leader = input.currentBidderUserId;

  if (bid === null || bid === undefined) {
    return { status: "not_met_reserve", winnerUserId: null };
  }
  if (reserve === null || reserve <= 0) {
    return { status: "ended_pending_confirmation", winnerUserId: leader };
  }
  if (bid >= reserve) {
    return { status: "ended_pending_confirmation", winnerUserId: leader };
  }
  const gap = (reserve - bid) / reserve;
  if (gap < 0.05) {
    return { status: "pending_seller_approval", winnerUserId: leader };
  }
  return { status: "not_met_reserve", winnerUserId: null };
}

async function voidNonWinnerPreauth(client: {
  query: (sql: string, params?: unknown[]) => Promise<unknown>;
}, auctionId: string, winnerUserId: string | null): Promise<void> {
  if (!winnerUserId) {
    await client.query(
      `UPDATE auction_preauth_transactions
       SET status = 'voided', voided_at = NOW(), updated_at = NOW()
       WHERE auction_id = $1 AND status = 'held'`,
      [auctionId]
    );
    return;
  }
  await client.query(
    `UPDATE auction_preauth_transactions
     SET status = 'voided', voided_at = NOW(), updated_at = NOW()
     WHERE auction_id = $1 AND status = 'held' AND user_id <> $2`,
    [auctionId, winnerUserId]
  );
}

/**
 * Bitmiş live/extended lotları bağlayır: rezerv qaydası + STRICT pre-auth void.
 */
export async function closeExpiredAuctionsBatch(): Promise<void> {
  const pool = getPgPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const rows = await client.query<{
      id: string;
      current_bid_azn: number | null;
      current_bidder_user_id: string | null;
      reserve_price_azn: number | null;
    }>(
      `SELECT id, current_bid_azn, current_bidder_user_id, reserve_price_azn
       FROM auction_listings
       WHERE status IN ('live', 'extended')
         AND ends_at < NOW()
       ORDER BY ends_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT 40`
    );

    let auctionMode = "BETA_FIN_ONLY";
    try {
      const m = await client.query<{ auction_mode: string }>(
        `SELECT auction_mode FROM system_settings WHERE id = 1 LIMIT 1`
      );
      if (m.rows[0]?.auction_mode === "STRICT_PRE_AUTH") {
        auctionMode = "STRICT_PRE_AUTH";
      }
    } catch {
      // system_settings yoxdursa (köhnə DB) — yalnız status yenilənir
    }

    for (const row of rows.rows) {
      const { status, winnerUserId } = pickClosedStatus({
        currentBidAzn: row.current_bid_azn,
        reservePriceAzn: row.reserve_price_azn,
        currentBidderUserId: row.current_bidder_user_id
      });
      await client.query(
        `UPDATE auction_listings
         SET status = $2::text,
             winner_user_id = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [row.id, status, winnerUserId]
      );

      if (auctionMode === "STRICT_PRE_AUTH") {
        await voidNonWinnerPreauth(client, row.id, winnerUserId);
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export function startAuctionCloseWorker(): void {
  if (process.env.AUCTION_CLOSE_WORKER_DISABLED === "true") {
    return;
  }
  const tick = () => {
    void closeExpiredAuctionsBatch().catch((error) => {
      console.error("[auction-close-worker]", error);
    });
  };
  tick();
  setInterval(tick, Number.isFinite(WORKER_INTERVAL_MS) && WORKER_INTERVAL_MS >= 5_000 ? WORKER_INTERVAL_MS : 30_000).unref();
}
