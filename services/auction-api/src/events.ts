import { observePaymentToActivationLag } from "./metrics";
import { publishRealtimeEvent } from "./realtime";

export interface CoordinationEventInput {
  auctionId: string;
  type: "payment.updated" | "auction.updated";
  payload: Record<string, unknown>;
  occurredAt?: string;
}

export async function publishCoordinationEvent(input: CoordinationEventInput): Promise<void> {
  if (typeof input.payload.activationLagMs === "number") {
    observePaymentToActivationLag(input.payload.activationLagMs);
  }
  await publishRealtimeEvent({
    auctionId: input.auctionId,
    type: input.type,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    payload: input.payload
  });
}
