# Analytics and KPI Specification

## Objective
Define event tracking and dashboards to operationalize the North Star metric and decision-making for C2C and B2B flows.

## North Star
- `VerifiedTransactionRate`
- Formula:
  - `verified_completed_transactions / total_completed_transactions`
- Time windows:
  - daily, weekly, monthly.

## Metric Tree

### A. Supply Quality
- VerifiedListingShare = verified_active_listings / total_active_listings
- MediaCompleteShare = media_complete_listings / total_active_listings
- SellerVerifiedShare = listings_from_verified_sellers / total_active_listings

### B. Demand Efficiency
- LeadToVisitRate = visits_booked / total_leads
- LeadToSaleRate = completed_sales / total_leads
- AvgTimeToFirstQualifiedLead

### C. Trust and Risk
- MileageMismatchHighRiskRate
- DisputeRate
- FraudConfirmedRate
- FalsePositiveRate (for trust flags)

### D. B2B Commercial
- B2B_MRR
- DealerRetention90D
- DealerResponseTimeP50/P95
- PaidFeatureAttachRate

## Event Taxonomy (Core)

## 1) Listing Lifecycle Events
- `listing_created`
- `listing_draft_saved`
- `listing_publish_attempted`
- `listing_published`
- `listing_archived`

Required props:
- listing_id, seller_id, segment_type (C2C/B2B), city, vehicle_class, created_at

## 2) Trust Events
- `vin_check_started`
- `vin_check_completed`
- `vin_check_failed`
- `mileage_flag_generated`
- `seller_verification_started`
- `seller_verification_completed`
- `trust_badge_displayed`

Required props:
- listing_id, trust_signal_type, trust_status, reason_code, source_type, freshness_hours

## 3) Media Quality Events
- `media_upload_started`
- `media_upload_completed`
- `media_protocol_failed`
- `media_protocol_passed`

Required props:
- listing_id, image_count, video_duration_sec, failed_check_type

## 4) Discovery and Consideration Events
- `search_performed`
- `filter_applied`
- `listing_viewed`
- `compare_added`
- `price_insight_viewed`

Required props:
- user_id (or anonymous_id), query_filters, listing_id, rank_position

## 5) Lead and Deal Events
- `lead_created`
- `lead_viewed_by_seller`
- `seller_contacted_buyer`
- `test_drive_booked`
- `deal_marked_sold`
- `transaction_verified_completed`

Required props:
- listing_id, dealer_id (if B2B), lead_id, response_time_sec, deal_value

## 6) Risk and Dispute Events
- `dispute_opened`
- `dispute_resolved`
- `fraud_report_submitted`
- `fraud_confirmed`

Required props:
- case_id, listing_id, risk_category, resolution_time_hours, resolution_outcome

## Tracking Quality Rules
- Event naming in snake_case.
- All timestamps in UTC ISO 8601.
- No raw PII in analytics payload.
- Schema registry with versioning for each event.
- Late-arrival tolerance and idempotency keys required.

## Dashboard Specification

## Executive Dashboard (Weekly)
- North Star trend (4-week rolling).
- Verified listing share by segment.
- Lead-to-sale trend and split by city.
- Dispute and fraud trend with threshold alerts.
- B2B MRR and dealer retention snapshot.

## Product Dashboard (Daily)
- Publish funnel (draft -> publish attempt -> live).
- Trust funnel (VIN start -> verified badge shown).
- Media protocol failure reasons.
- Compare tool and price insight usage.

## Operations Dashboard (Daily)
- Manual review queue size and aging.
- Partner connector freshness and failure rate.
- SLA breaches (dealer response and integration latency).

## Sales/B2B Dashboard (Daily/Weekly)
- Dealer onboarding funnel.
- Dealer response time distribution.
- Inventory aging and close rates by dealer tier.

## Alerting Thresholds
- VerifiedTransactionRate drops > 15% week-over-week.
- VIN check failure rate > 10% for 2 consecutive hours.
- P95 lead response time > 30 minutes for top-tier dealers.
- Dispute rate > 2.5% weekly.

## Data Model Notes
- Use stable IDs for listing, user, dealer, partner.
- Persist trust decisions with reason codes.
- Join keys for analytics warehouse:
  - listing_id, seller_id, dealer_id, event_date.

## Delivery Plan (4 Weeks)
- Week 1: event schema finalization and tracking plan sign-off.
- Week 2: SDK instrumentation and QA for listing/trust events.
- Week 3: lead/deal and risk events instrumentation.
- Week 4: dashboard rollout and alert calibration.

## Validation Checklist
- [ ] All critical events present in staging.
- [ ] Metric definitions signed by product and data.
- [ ] Dashboard numbers reconcile with source systems.
- [ ] Alert routes mapped to owners and on-call schedule.
