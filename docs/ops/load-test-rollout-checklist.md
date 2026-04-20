# Load Test Rollout Checklist

Use this checklist before deciding whether `Neon Launch` is still sufficient or the platform should move to `Neon Scale`.

## Preconditions

- Production-like database tier is active (`Neon Launch` or higher).
- `services/auction-api` is deployed separately.
- `REDIS_URL` is configured and Redis is in the same region as `auction-api`.
- `AUCTION_API_BASE_URL` and `AUCTION_API_INTERNAL_SECRET` are configured in web.
- At least one valid authenticated session is available for mixed traffic tests.
- At least one valid auction lot and bidder session are available for bid tests.

## Scenario 1: Browse-heavy

Run:

```bash
npm run loadtest:browse
```

Pass target:

- error rate `< 2%`
- `p95 < 500ms`
- `p99 < 1200ms`

## Scenario 2: Mixed traffic

Run:

```bash
SESSION_COOKIE=<valid_session> npm run loadtest:mixed
```

Pass target:

- error rate `< 3%`
- `p95 < 700ms`
- `p99 < 1500ms`

## Scenario 3: Hot auction burst

Run:

```bash
AUCTION_ID=<lot_uuid> SESSION_COOKIE=<bidder_session> BID_START=10000 BID_STEP=100 npm run loadtest:bids
```

Pass target:

- error rate `< 5%`
- `p95 < 900ms`
- `p99 < 2000ms`

## Decision rule

Stay on `Neon Launch` if:

- all three scenarios pass, or
- failures are fixed by query/index tuning, pool tuning, or region placement changes

Consider `Neon Scale` only if:

- latency remains above target after tuning
- DB saturation is sustained during production-like tests
- connection pressure forces unsafe pool reductions
- campaign peaks repeatedly exhaust safe headroom

## What to inspect before upgrading

1. Web DB pool size (`PG_POOL_MAX`)
2. Auction API DB pool size (`AUCTION_API_PG_POOL_MAX`)
3. Redis and auction API regional placement
4. Slow queries and missing indexes
5. Lock contention in auction bid and close-worker paths

If the root cause is not persistent database capacity, do not upgrade tiers yet.
