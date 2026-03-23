import Redis from "ioredis";
import { config } from "./config";

let publisher: Redis | null = null;
let subscriber: Redis | null = null;

export function getRedisPublisher(): Redis | null {
  if (!config.redisUrl) return null;
  if (!publisher) {
    publisher = new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 3 });
  }
  return publisher;
}

export function getRedisSubscriber(): Redis | null {
  if (!config.redisUrl) return null;
  if (!subscriber) {
    subscriber = new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 3 });
  }
  return subscriber;
}

export async function connectRedis(): Promise<void> {
  await Promise.all(
    [getRedisPublisher(), getRedisSubscriber()]
      .filter((client): client is Redis => Boolean(client))
      .map(async (client) => {
        if (client.status === "wait") {
          await client.connect();
        }
      })
  );
}
