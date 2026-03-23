import type { FastifyInstance } from "fastify";
import { getAuctionState, listAuctionBids } from "../bid-engine";
import { registerAuctionStream } from "../realtime";

export async function registerStreamRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { id: string } }>("/api/auctions/:id/stream", async (request, reply) => {
    const [auction, bids] = await Promise.all([
      getAuctionState(request.params.id),
      listAuctionBids(request.params.id)
    ]);
    if (!auction) {
      return reply.code(404).send({ ok: false, error: "Auksion tapılmadı" });
    }

    await registerAuctionStream(request, reply);
    reply.raw.write("event: snapshot\n");
    reply.raw.write(
      `data: ${JSON.stringify({
        auctionId: request.params.id,
        type: "snapshot",
        occurredAt: new Date().toISOString(),
        payload: { auction, bids }
      })}\n\n`
    );
  });
}
