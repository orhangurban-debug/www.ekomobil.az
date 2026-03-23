# Security and Persistence Baseline

## Persistence Model
- Stores are persisted in PostgreSQL.
- Migration runner:
  - `apps/web/scripts/migrate.mjs`
  - SQL files in `apps/web/scripts/migrations/*.sql`
- Runtime DB access is centralized via `src/lib/postgres.ts`.
- Current persistent tables:
  - `manual_review_cases`
  - `analytics_events`
  - `schema_migrations`

## Authentication
- Session cookie: `ekomobil_session` (HTTP-only, signed, 12h TTL).
- Login endpoint: `POST /api/auth/login`
- Logout endpoint: `POST /api/auth/logout`
- Seed users available in `src/lib/auth.ts` for development.

## RBAC
- Roles: `admin`, `support`, `dealer`, `viewer`
- Page-level guard: `requirePageRoles(...)`
- API-level guard: `requireApiRoles(...)`

Protected surfaces:
- `GET /api/reviews` -> `admin|support`
- `POST /api/reviews/[id]/resolve` -> `admin|support`
- `GET /api/analytics` -> `admin|support|viewer`
- `POST /api/analytics` -> authenticated roles
- `/ops/reviews` page -> `admin|support`
- `/ops/analytics` page -> `admin|support|viewer`
- `/dealer` page -> `admin|dealer`

## Environment
- `DATABASE_URL` is required for app routes that read/write persistent data.
- `AUTH_SECRET` is required for signed session cookies.
