# EkoMobil

Etibar əsaslı avtomobil alqı-satqı platforması (Azərbaycan).

## Layihə strukturu
- `apps/web`: Next.js tətbiqi – alıcı, satıcı və diler interfeysləri.
- `services/auction-api`: yüksək tezlikli bid/realtime üçün ayrıca servis.
- `docs/foundation`: Arxitektura və uyğunluq əsasları.
- `docs/COLOR_SYSTEM.md`: Rəng palitrası və dizayn sistemi.
- `docs/ops/az-market-capacity-runbook.md`: AZ bazarı üçün kapasite hədəfləri və load-test runbook.

## Başlanğıc
1. Node.js 20+ quraşdırın.
2. `npm install` (repository root-da).
3. `apps/web/.env.example` əsasında `apps/web/.env` faylını konfiqurasiya edin.
4. DB migrasiyaları: `npm run db:migrate --workspace @ekomobil/web`
5. `npm run dev:web` — development serveri işə salın.

## Load test quick start

- `npm run loadtest:browse`
- `SESSION_COOKIE=<valid_session> npm run loadtest:mixed`
- `AUCTION_ID=<lot_uuid> SESSION_COOKIE=<bidder_session> npm run loadtest:bids`

## Phase-0 Goals
- Hybrid C2C + B2B foundation
- Trust model baseline (VIN, mileage flags, seller verification, media protocol)
- Audit-friendly domain model for future integrations
