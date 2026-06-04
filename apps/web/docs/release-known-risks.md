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

## 2026-06-04 - Bank reversal/refund API wiring (open operational task)

- **Risk ID:** `KR-2026-06-04-BANK-REVERSAL`
- **Status:** `open`
- **Severity:** `high (operational)`

### Context

Depozit qaytarılması (`returned`/`forfeited`) və preauth `void`/`capture` hazırda yalnız DB statusunu dəyişir.
`clearKapitalBankPreauth`, `refundKapitalBankOrder`, `reverseKapitalBankOrder` (kapital-bank-provider) və BirPay refund helperləri kodda var, lakin canlı bank API çağırışları ilə bağlanmayıb.

### Mitigation in place

- Depozit settlement artıq auction-close transaksiyası daxilində atomik işləyir (crash → rollback).
- Idempotent finalize + preauth dublikat guard tətbiq edildi.

### Exit criteria

1. Settlement/preauth-close yollarında real bank reversal/refund/capture çağırışları qoşulur.
2. Canlı sandbox/prod-da bir kiçik reversal end-to-end test edilir.
