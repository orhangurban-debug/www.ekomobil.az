import type { PoolClient } from "pg";
import { observeLockWait } from "./metrics";

export async function lockAuctionForBid(client: PoolClient, auctionId: string): Promise<void> {
  const startedAt = Date.now();
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [auctionId]);
  observeLockWait(Date.now() - startedAt);
}
