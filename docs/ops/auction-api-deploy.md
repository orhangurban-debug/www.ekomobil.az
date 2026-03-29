# Auction API Deployment (Railway + Redis + Vercel)

This guide enables dedicated auction write/realtime capacity by deploying `services/auction-api` separately and connecting `apps/web` to it.

## 1) Deploy `services/auction-api` on Railway

1. Create new Railway project.
2. Add service from GitHub repo root:
   - Root directory: `services/auction-api`
3. Add a Redis service in the same project.
4. Set service variables:
   - `NODE_ENV=production`
   - `DATABASE_URL=<same Postgres used by apps/web>`
   - `REDIS_URL=<from Railway Redis>`
   - `APP_URL=https://ekomobil.az`
   - `AUCTION_API_ALLOWED_ORIGINS=https://ekomobil.az,https://www.ekomobil.az`
   - `AUCTION_API_INTERNAL_SECRET=<shared random secret>`
   - `AUCTION_API_PG_POOL_MAX=20`
5. Deploy and copy public URL (example):
   - `https://auction-api-production.up.railway.app`

## 2) Configure Vercel (`apps/web`)

Add the same shared secret and API base URL in Vercel project env vars:

- `AUCTION_API_BASE_URL=https://auction-api-production.up.railway.app`
- `AUCTION_API_INTERNAL_SECRET=<same as Railway>`

Then redeploy web.

## 3) Health Checks

- Auction API:
  - `GET <AUCTION_API_BASE_URL>/health` -> `200 { ok: true }`
  - `GET <AUCTION_API_BASE_URL>/metrics` -> `200`
- Web app:
  - Place a bid from UI and confirm no fallback errors.
  - `ops/auctions` telemetry should report connected service.

## 4) Security Notes

- Never commit secrets to git.
- Keep `AUCTION_API_INTERNAL_SECRET` high-entropy (>= 32 bytes).
- Limit CORS to production domains only.

## 5) Scaling Notes

- Start with one auction-api instance and monitor p95 bid latency.
- Increase Railway instance size and Redis tier before horizontal scaling.
- Tune `AUCTION_API_PG_POOL_MAX` according to Postgres connection limits.
