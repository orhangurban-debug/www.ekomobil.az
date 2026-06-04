# Release Known Risks

Bu sənəd buraxılış qərarında (GO/NO-GO) açıq qalan riskləri izləmək üçündür.

## 2026-05-01 - Open dependency advisory (RESOLVED)

- **Risk ID:** `KR-2026-05-01-POSTCSS`
- **Status:** `resolved` (2026-06-04)
- **Severity:** `moderate`
- **Source:** `npm audit --omit=dev`
- **Advisory:** `GHSA-qx2v-qp2m-jg93`
- **Affected path:** `next -> postcss (<8.5.10)`

### Resolution

- `next` `16.2.7`-yə yeniləndi.
- Root `package.json`-da `overrides.postcss = ^8.5.12` əlavə edildi (autoprefixer-in gətirdiyi `postcss@8.4.31` nested kopyası məcburi şəkildə patched versiyaya qaldırıldı).
- `auction-api` servisindəki `fastify` / `fast-uri` high findingləri `npm audit fix` ilə bağlandı.
- Nəticə: bütün workspace boyunca `npm audit` = **0 vulnerabilities**.

### Re-check command

```bash
npm audit            # root (bütün workspace-lər)
npm audit --omit=dev --workspace @ekomobil/web
```

## 2026-06-04 - Bank reversal/refund API wiring (partially wired)

- **Risk ID:** `KR-2026-06-04-BANK-REVERSAL`
- **Status:** `in-progress`
- **Severity:** `high (operational)`

### Context

`clearKapitalBankPreauth`, `refundKapitalBankOrder`, `reverseKapitalBankOrder` (kapital-bank-provider) və BirPay refund helperləri kodda var.

### Wired so far

- **Uduzan bidderlərin preauth DMS hold-u** auction-close-da artıq bank tərəfində geri qaytarılır: `reverseVoidedPreauthsAtBank` (auction-close-worker) COMMIT-dən sonra, **yalnız `live` rejimdə**, best-effort (try/catch, audit log, bloklamayan) `reverseKapitalBankOrder` çağırır. DB `voided` statusu source-of-truth olaraq qalır; uğursuzluq `preauth_bank_reversal_failed` audit log-u ilə reconciliation üçün qeyd edilir.
- Depozit settlement artıq auction-close transaksiyası daxilində atomik işləyir (crash → rollback).
- Idempotent finalize + preauth dublikat guard tətbiq edildi.

### Still open

1. **Qalib preauth capture/release** (sale confirm / no-show axınında `clearKapitalBankPreauth`).
2. **Depozit refund** bank tərəfində (`refundKapitalBankOrder`) — hazırda yalnız DB `returned`.
3. **Listing/business chargeback** real refund.
4. Canlı sandbox/prod-da exec-tran payload formatının (phase/voidKind/type) doğrulanması — bank test mühiti tələb olunur.

## 2026-06-04 - Services marketplace data layer (planned feature, not a bug)

- **Risk ID:** `KR-2026-06-04-SERVICES`
- **Status:** `planned`
- **Severity:** `medium (feature gap)`

### Context

`/services` UI tam hazırdır, lakin DB data layer yoxdur (`getServiceListingBySlug` `null` qaytarır, `demoServiceListings = []`).
İndeks səhifəsi düzgün "Hələ servis profili yoxdur" boş vəziyyətini göstərir və app daxilində ölü link yoxdur (kartlar yalnız data olduqda render olunur).
`/services/[slug]`-a birbaşa keçid 404 verir (yalnız manual URL ilə).

### Required to ship

1. `service_providers` migration + store (CRUD).
2. Partner onboarding axını (admin və ya self-serve).
3. `getServiceListingBySlug` / index data layer-in DB-yə bağlanması.
