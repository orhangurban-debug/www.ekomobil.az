# Bank cavabı gözləmə müddəti checklist (AZ)

Bu sənəd bank credential-ları gələnə qədər daxili hazırlıq işlərini sistemli saxlamaq üçündür.

## 1) Callback əlçatanlıq yoxlaması (tamamlanıb)

- `https://ekomobil.az/api/payments/kapital-bank/callback` -> `400` (route işləyir, input gözləyir)
- `https://ekomobil.az/api/payments/auction-deposit/callback` -> `400`
- `https://ekomobil.az/api/payments/auction-service/callback` -> `400`
- `https://ekomobil.az/api/payments/auction-preauth/callback` -> `400`

Qeyd: `400` burada normaldır, çünki test üçün tələb olunan `paymentId/depositId/preauthId` göndərilməyib.

## 2) Təhlükəsizlik hardening (tamamlanıb)

- `.env` daxilində `AUTH_SECRET` güclü 64-hex dəyərə yenilənib.
- Live mode saxlanılıb, BirPay preprod host (`https://preapi.birpay.az`) təyinlidir.

## 3) Bank cavabı gələn kimi doldurulacaq env dəyişənləri

- `KAPITAL_BANK_MERCHANT_ID`
- `KAPITAL_BANK_TERMINAL_ID`
- `KAPITAL_BANK_USERNAME`
- `KAPITAL_BANK_PASSWORD`
- `KAPITAL_BANK_SECRET`

## 4) Daxili UAT planı (bank cavabından dərhal sonra)

1. P1.1: `POST /v1/payments` checkout + redirect tamamla  
2. P1.2: `GET /v1/payments/{paymentId}` status təsdiqi  
3. P1.3: `POST /v1/refunds` refund yarat  
4. P1.4: `GET /v1/refunds/{refundId}` status təsdiqi  
5. Webhook `X-Signature` HMAC təsdiqi  
6. Admin `payments-readiness` üzərindən CSV export və banka order siyahısı göndərişi

## 5) Əməliyyat hazırlığı

- Test user-lər:
  - alıcı (listing/auction payment üçün)
  - satıcı (auction service flow üçün)
  - dealer/parts (plan ssenariləri üçün)
- Ən az 3 test case banka təqdim üçün saxlanılsın:
  - 1 uğurlu
  - 1 cancel
  - 1 failed/refused
