import { AnalyticsEventName } from "@/lib/analytics/events";

export async function trackEvent(eventName: AnalyticsEventName, payload: Record<string, unknown>) {
  await fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      timestamp: new Date().toISOString(),
      payload
    })
  });
}
