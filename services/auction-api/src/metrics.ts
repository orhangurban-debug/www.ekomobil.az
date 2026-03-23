const state = {
  acceptedBids: 0,
  rejectedBids: 0,
  bidLatencyMs: [] as number[],
  lockWaitMs: [] as number[],
  viewerCount: 0,
  antiSnipingTriggers: 0,
  paymentToActivationLagMs: [] as number[]
};

function summarize(values: number[]) {
  if (values.length === 0) {
    return { count: 0, avg: 0, max: 0 };
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    count: values.length,
    avg: Math.round(total / values.length),
    max: Math.max(...values)
  };
}

export function observeBidLatency(ms: number): void {
  state.bidLatencyMs.push(ms);
}

export function observeLockWait(ms: number): void {
  state.lockWaitMs.push(ms);
}

export function countAcceptedBid(): void {
  state.acceptedBids += 1;
}

export function countRejectedBid(): void {
  state.rejectedBids += 1;
}

export function changeViewerCount(delta: number): void {
  state.viewerCount = Math.max(0, state.viewerCount + delta);
}

export function countAntiSnipingTrigger(): void {
  state.antiSnipingTriggers += 1;
}

export function observePaymentToActivationLag(ms: number): void {
  state.paymentToActivationLagMs.push(ms);
}

export function getMetricsSnapshot() {
  return {
    bids: {
      accepted: state.acceptedBids,
      rejected: state.rejectedBids,
      latency: summarize(state.bidLatencyMs),
      lockWait: summarize(state.lockWaitMs)
    },
    realtime: {
      viewerCount: state.viewerCount,
      antiSnipingTriggers: state.antiSnipingTriggers
    },
    payments: {
      activationLag: summarize(state.paymentToActivationLagMs)
    }
  };
}
