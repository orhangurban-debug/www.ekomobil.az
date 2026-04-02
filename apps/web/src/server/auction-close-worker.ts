import { getPgPool } from "@/lib/postgres";
import { createAuctionNotification } from "@/server/auction-notification-store";
import { voidPreauthForLosers } from "@/server/auction-preauth-store";
import { recordAuctionAuditLog } from "@/server/auction-store";
import { getSystemSettings } from "@/server/system-settings-store";

const SWEEP_INTERVAL_MS = Number(process.env.AUCTION_CLOSE_SWEEP_MS ?? 15_000);

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

async function notifyClosedAuction(input: {
  auctionId: string;
  sellerUserId: string;
  winnerUserId: string | null;
  titleSnapshot: string;
  status: string;
}): Promise<void> {
  if (input.status === "ended_pending_confirmation" && input.winnerUserId) {
    await Promise.all([
      createAuctionNotification({
        userId: input.winnerUserId,
        auctionId: input.auctionId,
        type: "auction_won",
        title: "Auksionu qazandınız",
        message: `"${input.titleSnapshot}" lotunda qalib oldunuz. Nəticəni təsdiqləyin.`,
        ctaHref: `/auction/${input.auctionId}/confirm`
      }),
      createAuctionNotification({
        userId: input.sellerUserId,
        auctionId: input.auctionId,
        type: "auction_ended",
        title: "Lot bağlandı",
        message: `"${input.titleSnapshot}" lotu bağlandı. Qalib alıcı ilə nəticəni təsdiqləyin.`,
        ctaHref: `/auction/${input.auctionId}/confirm`
      })
    ]);
    return;
  }

  if (input.status === "pending_seller_approval") {
    await createAuctionNotification({
      userId: input.sellerUserId,
      auctionId: input.auctionId,
      type: "seller_approval_needed",
      title: "Satıcı təsdiqi tələb olunur",
      message: `"${input.titleSnapshot}" lotunda təklif rezervə çox yaxındır. Qərar verin.`,
      ctaHref: `/auction/${input.auctionId}/confirm`
    });
    return;
  }

  await createAuctionNotification({
    userId: input.sellerUserId,
    auctionId: input.auctionId,
    type: "auction_closed_without_sale",
    title: "Lot satışsız bağlandı",
    message: `"${input.titleSnapshot}" lotunda rezerv qarşılanmadı və ya qalib müəyyən olunmadı.`,
    ctaHref: `/auction/${input.auctionId}/confirm`
  });
}

export async function closeExpiredAuctionsBatch(): Promise<number> {
  const pool = getPgPool();
  const client = await pool.connect();
  let processed = 0;
  const notificationQueue: Array<{
    auctionId: string;
    sellerUserId: string;
    winnerUserId: string | null;
    titleSnapshot: string;
    status: string;
  }> = [];
  try {
    await client.query("BEGIN");
    const rows = await client.query<{
      id: string;
      title_snapshot: string;
      seller_user_id: string;
      current_bid_azn: number | null;
      current_bidder_user_id: string | null;
      reserve_price_azn: number | null;
    }>(
      `SELECT id, title_snapshot, seller_user_id, current_bid_azn, current_bidder_user_id, reserve_price_azn
       FROM auction_listings
       WHERE status IN ('live', 'extended')
         AND ends_at < NOW()
       ORDER BY ends_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT 40`
    );

    const settings = await getSystemSettings().catch(() => ({
      auctionMode: "BETA_FIN_ONLY" as const
    }));

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

      if (settings.auctionMode === "STRICT_PRE_AUTH") {
        await voidPreauthForLosers({ auctionId: row.id, winnerUserId });
      }

      await recordAuctionAuditLog({
        auctionId: row.id,
        actionType: "auction_closed_by_web_fallback",
        detail: `Fallback close worker set status=${status}`
      });

      notificationQueue.push({
        auctionId: row.id,
        sellerUserId: row.seller_user_id,
        winnerUserId,
        titleSnapshot: row.title_snapshot,
        status
      });
      processed += 1;
    }

    await client.query("COMMIT");
    for (const item of notificationQueue) {
      await notifyClosedAuction(item).catch(() => undefined);
    }
    return processed;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

const auctionSweepGlobal = globalThis as unknown as { ekomobilAuctionCloseSweepAt?: number };

export async function runAuctionCloseSweepIfDue(): Promise<void> {
  const now = Date.now();
  if (
    typeof auctionSweepGlobal.ekomobilAuctionCloseSweepAt === "number" &&
    now - auctionSweepGlobal.ekomobilAuctionCloseSweepAt < SWEEP_INTERVAL_MS
  ) {
    return;
  }
  auctionSweepGlobal.ekomobilAuctionCloseSweepAt = now;
  await closeExpiredAuctionsBatch().catch(() => undefined);
}
