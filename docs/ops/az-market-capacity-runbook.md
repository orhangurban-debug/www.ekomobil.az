# Azerbaijan Market Capacity Runbook

This runbook targets expected marketplace growth in Azerbaijan and uses Turbo.az-like traffic behavior as a benchmark (read-heavy usage with bursty peaks in evenings/weekends).

## 0) Production Database Baseline

- Use `Neon Launch` as the default production PostgreSQL tier.
- Do not rely on `Neon Free` for production traffic or authentication-critical flows.
- Treat `Neon Scale` as the next step only after load tests or live metrics prove Launch is no longer sufficient.
- Keep `services/auction-api` on a dedicated runtime with `Redis` in the same region for realtime fanout and hot bid bursts.

See also: [Database Provider Recommendation](./database-provider-recommendation.md) and [Load Test Rollout Checklist](./load-test-rollout-checklist.md)

## 1) Capacity Targets (Practical)

- **Phase A (current growth):** 1,500-3,000 concurrent online users.
- **Phase B (campaign peaks):** 5,000+ concurrent online users.
- **Auction hot lots:** 50-150 bid requests/sec aggregated across active lots.

These are planning targets, not guaranteed SLAs, until load tests are run against production-like infra.

## 2) Architecture Baseline

- Keep `apps/web` focused on page/API aggregation and auth.
- Move high-frequency auction write path to `services/auction-api`.
- Use Redis for realtime/pubsub and fast fanout.
- Use PostgreSQL for source-of-truth writes with proper pooling.

## 3) Mandatory Production Env (Web)

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `AUCTION_API_BASE_URL` (points to deployed `auction-api`)
- `AUCTION_API_INTERNAL_SECRET`
- `CRON_SECRET`
- `PG_POOL_MAX` (start with `10`; raise only after checking DB connection headroom)

## 4) Mandatory Production Env (Auction API)

- `DATABASE_URL`
- `REDIS_URL`
- `APP_URL`
- `AUCTION_API_ALLOWED_ORIGINS`
- `AUCTION_API_INTERNAL_SECRET`
- `AUCTION_API_PG_POOL_MAX` (start with `20`; scale toward `30-40` only if DB limits allow)

## 5) Load Testing (k6)

Prerequisite: install k6 locally.

- **Browse-heavy traffic**
  - `npm run loadtest:browse`
- **Mixed traffic (read + light authenticated API)**
  - `SESSION_COOKIE=<valid_session> npm run loadtest:mixed`
- **Hot auction burst**
  - `AUCTION_ID=<lot_uuid> SESSION_COOKIE=<bidder_session> BID_START=10000 BID_STEP=100 npm run loadtest:bids`

## 6) SLO Guardrails

- Browse/read API: p95 < 500ms, error rate < 2%
- Mixed API: p95 < 700ms, error rate < 3%
- Bid path: p95 < 900ms, error rate < 5%

If thresholds fail:
- increase DB pool and/or DB tier,
- reduce synchronous work in bid flow,
- ensure auction-api and Redis are co-located regionally,
- tune indexes and lock contention hotspots.

Before moving from `Neon Launch` to `Neon Scale`, confirm that the failure is caused by sustained DB resource pressure rather than missing indexes, pool misconfiguration, or region mismatch.

## 7) Rollout Strategy

1. Deploy `auction-api` to staging + connect Redis.
2. Enable `AUCTION_API_BASE_URL` in staging web.
3. Run k6 scenarios and capture p95/p99 + error rates.
4. Tune infra and query/index bottlenecks.
5. Promote to production with canary period and live monitoring.
