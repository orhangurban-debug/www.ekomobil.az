# EkoMobil

Etibar əsaslı avtomobil alqı-satqı platforması (Azərbaycan).

## Layihə strukturu
- `apps/web`: Next.js tətbiqi – alıcı, satıcı və diler interfeysləri.
- `docs/foundation`: Arxitektura və uyğunluq əsasları.
- `docs/COLOR_SYSTEM.md`: Rəng palitrası və dizayn sistemi.

## Başlanğıc
1. Node.js 20+ quraşdırın.
2. `npm install` (repository root-da).
3. `apps/web/.env.example` əsasında `apps/web/.env` faylını konfiqurasiya edin.
4. DB migrasiyaları: `npm run db:migrate --workspace @ekomobil/web`
5. `npm run dev:web` — development serveri işə salın.

## Phase-0 Goals
- Hybrid C2C + B2B foundation
- Trust model baseline (VIN, mileage flags, seller verification, media protocol)
- Audit-friendly domain model for future integrations
