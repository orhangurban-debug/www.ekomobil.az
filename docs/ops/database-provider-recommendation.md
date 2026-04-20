# Database Provider Recommendation

## Recommended baseline

Use `Neon Launch` as the production PostgreSQL tier for the current stage of EkoMobil.

Why this is the default choice:

- The codebase already depends on PostgreSQL-specific behavior such as `ON CONFLICT`, JSONB fields, transactional updates, `FOR UPDATE`, and auction locking patterns.
- The platform is not a static content site. It combines read-heavy marketplace traffic with write-sensitive paths such as auth, favorites, saved searches, payments, support flows, and auction bidding.
- The current capacity target already exceeds free-tier expectations:
  - `1,500-3,000` concurrent users in normal growth
  - `5,000+` at campaign peaks
  - `50-150` bid requests/sec across hot auction lots

## Provider decision

### Neon Free

Do not use in production.

- Free compute exhaustion can take down login and other DB-backed features.
- The current workload has too many critical user flows tied to database availability.

### Neon Launch

Use this now.

- Lowest migration risk because no app architecture change is needed.
- Fits the current `pg` + Vercel + dedicated auction API setup.
- Good balance between startup cost and operational safety.

### Neon Scale

Upgrade only when real traffic proves it is needed.

Typical triggers:

- browse or mixed traffic misses the runbook SLOs
- auction p95 latency stays above target after query/index tuning
- connection pressure forces aggressive pool reduction
- campaign peaks create sustained DB saturation

### Supabase

Valid fallback, but not the first choice for this repo.

- It would mostly be used as hosted Postgres because the app does not currently rely on Supabase Auth, Realtime, or client SDK patterns.
- That means migration cost without getting most of the platform-specific upside.

### Vercel Postgres

Not recommended as a strategy target.

- Vercel's standalone Postgres product was sunset in favor of Neon-backed options.

## Operational baseline

### Web app

- `PG_POOL_MAX=10` is a safe starting point for the current Vercel setup.
- Raise to `12-15` only after checking total database connection headroom across live instances.

### Auction API

- `REDIS_URL` is mandatory in production.
- Keep Redis in the same region as `auction-api`.
- Start with `AUCTION_API_PG_POOL_MAX=20`.
- Increase toward `30-40` only if DB connection limits and load-test data support it.

## Validation before upgrading tiers

Run production-like load checks before moving beyond `Neon Launch`.

1. `npm run loadtest:browse`
2. `SESSION_COOKIE=<valid_session> npm run loadtest:mixed`
3. `AUCTION_ID=<lot_uuid> SESSION_COOKIE=<bidder_session> BID_START=10000 BID_STEP=100 npm run loadtest:bids`

Use the runbook thresholds:

- browse/read API: `p95 < 500ms`, error rate `< 2%`
- mixed API: `p95 < 700ms`, error rate `< 3%`
- bid path: `p95 < 900ms`, error rate `< 5%`

If these fail, tune indexes, reduce synchronous work, verify Redis co-location, and only then consider upgrading to `Neon Scale`.
