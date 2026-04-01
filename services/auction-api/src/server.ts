import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config";
import { getAuctionState, listAuctionBids, listAuctions } from "./bid-engine";
import { publishCoordinationEvent } from "./events";
import { getMetricsSnapshot } from "./metrics";
import { getPgPool } from "./postgres";
import { connectRedis } from "./redis";
import { initRealtime } from "./realtime";
import { startAuctionCloseWorker } from "./auction-close-worker";
import { registerBidRoutes } from "./routes/bids";
import { registerStreamRoutes } from "./routes/stream";

const app = Fastify({ logger: true });

async function main() {
  await app.register(cors, {
    origin: config.allowOrigins.length > 0 ? config.allowOrigins : true,
    credentials: true
  });

  app.get("/health", async () => {
    await getPgPool().query("SELECT 1");
    return { ok: true };
  });

  app.get("/metrics", async () => {
    return getMetricsSnapshot();
  });

  app.get<{ Querystring: { limit?: string } }>("/api/auctions", async (request) => {
    const limit = Number(request.query.limit ?? 20);
    const auctions = await listAuctions(Number.isFinite(limit) && limit > 0 ? limit : 20);
    return { ok: true, auctions };
  });

  app.get<{ Params: { id: string }; Querystring: { limit?: string } }>("/api/auctions/:id/bids", async (request, reply) => {
    const auction = await getAuctionState(request.params.id);
    if (!auction) {
      return reply.code(404).send({ ok: false, error: "Auksion tapılmadı" });
    }
    const limit = Number(request.query.limit ?? config.bidHistoryLimit);
    const bids = await listAuctionBids(request.params.id, Number.isFinite(limit) && limit > 0 ? limit : config.bidHistoryLimit);
    return { ok: true, bids };
  });

  await registerBidRoutes(app);
  await registerStreamRoutes(app);

  app.post<{
    Headers: { "x-auction-internal-secret"?: string };
    Body: {
      auctionId?: string;
      type?: "payment.updated" | "auction.updated";
      payload?: Record<string, unknown>;
      occurredAt?: string;
    };
  }>("/api/internal/events", async (request, reply) => {
    if (config.internalSecret && request.headers["x-auction-internal-secret"] !== config.internalSecret) {
      return reply.code(401).send({ ok: false, error: "Unauthorized" });
    }
    if (!request.body.auctionId || !request.body.type || !request.body.payload) {
      return reply.code(400).send({ ok: false, error: "auctionId, type və payload tələb olunur" });
    }
    await publishCoordinationEvent({
      auctionId: request.body.auctionId,
      type: request.body.type,
      payload: request.body.payload,
      occurredAt: request.body.occurredAt
    });
    return { ok: true };
  });

  await connectRedis();
  await initRealtime();
  startAuctionCloseWorker();
  await app.listen({ port: config.port, host: config.host });
}

main().catch((error) => {
  app.log.error(error);
  process.exit(1);
});
