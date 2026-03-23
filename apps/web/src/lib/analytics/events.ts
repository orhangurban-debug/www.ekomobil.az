export const analyticsEventNames = [
  "listing_created",
  "listing_publish_attempted",
  "listing_published",
  "vin_check_started",
  "vin_check_completed",
  "mileage_flag_generated",
  "lead_created",
  "seller_contacted_buyer",
  "test_drive_booked",
  "deal_marked_sold"
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export interface AnalyticsEvent<TPayload = Record<string, unknown>> {
  eventName: AnalyticsEventName;
  timestamp: string;
  payload: TPayload;
}
