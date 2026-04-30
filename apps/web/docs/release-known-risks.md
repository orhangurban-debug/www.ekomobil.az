# Release Known Risks

Bu sənəd buraxılış qərarında (GO/NO-GO) açıq qalan riskləri izləmək üçündür.

## 2026-05-01 - Open dependency advisory

- **Risk ID:** `KR-2026-05-01-POSTCSS`
- **Status:** `accepted-temporarily`
- **Severity:** `moderate`
- **Source:** `npm audit --omit=dev`
- **Advisory:** `GHSA-qx2v-qp2m-jg93`
- **Affected path:** `next -> postcss (<8.5.10)`

### Context

`@ekomobil/web` hazırda `next@16.2.4` istifadə edir və bu versiya `postcss@8.4.31` tranzitiv asılılığını gətirir.
Bu səbəbdən audit nəticəsində 2 ədəd `moderate` finding görünür.

### Why this is temporarily accepted

- Problem birbaşa tətbiq kodundan yox, framework tranzitiv dependency xəttindən gəlir.
- Build və test yaşıl vəziyyətdədir (`npm run build`, `npm run test`).
- Ödəniş readiness ayrıca `GO` statusundadır.

### Mitigation in place

- `npm audit --omit=dev` buraxılış yoxlama checklist-inə daxil edilib.
- Bu risk ayrıca izləmə altında saxlanılır və upstream patch çıxanda dərhal yenilənəcək.

### Exit criteria (risk closure)

Risk aşağıdakı hallardan biri ilə bağlanmış sayılır:

1. `next` patched buraxılış verib və tranzitiv `postcss` artıq vulnerable deyil.
2. Rəsmi, stabil və təhlükəsiz dependency yolu ilə audit finding tam bağlanır.

### Re-check command

```bash
npm audit --omit=dev
```
