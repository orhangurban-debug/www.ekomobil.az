import type { FastifyInstance } from "fastify";
import { getAuctionState, placeBid } from "../bid-engine";
import { publishRealtimeEvent } from "../realtime";

export async function registerBidRoutes(app: FastifyInstance): Promise<void> {
  app.post<{
    Params: { id: string };
    Body: { bidderUserId?: string; amountAzn?: number; autoBidMaxAzn?: number; ip?: string; deviceFingerprint?: string };
  }>("/api/auctions/:id/bids", async (request, reply) => {
    if (!request.body.bidderUserId || !request.body.amountAzn || request.body.amountAzn <= 0) {
      return reply.code(400).send({ ok: false, error: "Keçərli bidder və bid məbləği tələb olunur" });
    }

    const result = await placeBid({
      auctionId: request.params.id,
      bidderUserId: request.body.bidderUserId,
      amountAzn: request.body.amountAzn,
      autoBidMaxAzn: request.body.autoBidMaxAzn,
      ip: request.body.ip,
      deviceFingerprint: request.body.deviceFingerprint
    });

    if (!result.ok) {
      return reply.code(400).send(result);
    }

    const occurredAt = new Date().toISOString();
    const basePayload = {
      bid: result.bid,
      auction: result.auction,
      nextMinimumBidAzn: result.nextMinimumBidAzn,
      extended: result.extended,
      timeExtended: result.timeExtended
    };
    await publishRealtimeEvent({
      auctionId: request.params.id,
      type: "bid.accepted",
      occurredAt,
      payload: basePayload
    });
    await publishRealtimeEvent({
      auctionId: request.params.id,
      type: "NEW_BID",
      occurredAt,
      payload: basePayload
    });
    if (result.timeExtended) {
      await publishRealtimeEvent({
        auctionId: request.params.id,
        type: "TIME_EXTENDED",
        occurredAt,
        payload: {
          auction: result.auction,
          extendedByMs: basePayload.auction?.endsAt
        }
      });
    }

    return reply.send(result);
  });

  app.get<{ Params: { id: string } }>("/api/auctions/:id/state", async (request, reply) => {
    const auction = await getAuctionState(request.params.id);
    if (!auction) {
      return reply.code(404).send({ ok: false, error: "Auksion tapılmadı" });
    }
    return reply.send({ ok: true, auction });
  });
}
