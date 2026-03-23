import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "./config";
import { changeViewerCount } from "./metrics";
import { getRedisPublisher, getRedisSubscriber } from "./redis";
import type { AuctionRealtimeEvent } from "./types";

type ClientSet = Set<FastifyReply["raw"]>;

const streams = new Map<string, ClientSet>();

function getChannel(auctionId: string): string {
  return `auction:${auctionId}`;
}

function writeEvent(target: FastifyReply["raw"], event: AuctionRealtimeEvent): void {
  target.write(`event: ${event.type}\n`);
  target.write(`data: ${JSON.stringify(event)}\n\n`);
}

function broadcastLocal(event: AuctionRealtimeEvent): void {
  const targets = streams.get(event.auctionId);
  if (!targets) return;
  for (const target of targets) {
    writeEvent(target, event);
  }
}

let subscriberInitialized = false;

export async function initRealtime(): Promise<void> {
  const subscriber = getRedisSubscriber();
  if (!subscriber || subscriberInitialized) return;
  subscriberInitialized = true;
  await subscriber.psubscribe("auction:*");
  subscriber.on("pmessage", (_pattern, _channel, payload) => {
    const parsed = JSON.parse(payload) as AuctionRealtimeEvent;
    broadcastLocal(parsed);
  });
  setInterval(() => {
    const heartbeat: AuctionRealtimeEvent = {
      auctionId: "*",
      type: "auction.heartbeat",
      occurredAt: new Date().toISOString(),
      payload: {}
    };
    for (const [auctionId, targets] of streams.entries()) {
      const scoped = { ...heartbeat, auctionId };
      for (const target of targets) {
        writeEvent(target, scoped);
      }
    }
  }, config.heartbeatMs).unref();
}

export async function publishRealtimeEvent(event: AuctionRealtimeEvent): Promise<void> {
  const publisher = getRedisPublisher();
  if (publisher) {
    await publisher.publish(getChannel(event.auctionId), JSON.stringify(event));
    return;
  }
  broadcastLocal(event);
}

export async function registerAuctionStream(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const auctionId = request.params.id;
  reply.raw.setHeader("Content-Type", "text/event-stream");
  reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
  reply.raw.setHeader("Connection", "keep-alive");
  reply.raw.setHeader("X-Accel-Buffering", "no");
  reply.hijack();
  reply.raw.write("\n");

  const targets = streams.get(auctionId) ?? new Set();
  targets.add(reply.raw);
  streams.set(auctionId, targets);
  changeViewerCount(1);

  request.raw.on("close", () => {
    const active = streams.get(auctionId);
    active?.delete(reply.raw);
    if (active && active.size === 0) {
      streams.delete(auctionId);
    }
    changeViewerCount(-1);
  });
}
