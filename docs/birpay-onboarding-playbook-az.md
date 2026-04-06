# EkoMobil BirPay Onboarding Playbook (AZ)

Bu sənəd bank (BirPay/Kapital Bank) inteqrasiya prosesində texniki və əməliyyat işlərini sürətləndirmək üçün hazırlanıb.

## 1) Hazırkı texniki hazırlıq

- Admin paneldə bank yoxlaması üçün hazır bölmə var:
  - `Admin > Ödəniş test hazırlığı` (`/admin/payments-readiness`)
- Bu bölmədə:
  - callback URL-lər,
  - merchant/terminal görünüşü,
  - order ID mapping cədvəli,
  - CSV export (`/api/admin/payments-readiness/orders?format=csv&limit=2000`)
  mövcuddur.

## 2) Banka təqdim ediləcək məlumatlar

- Merchant məlumatları:
  - `merchantId`
  - `terminalId`
- Test env:
  - `https://preapi.birpay.az`
- Production env:
  - `https://api.birpay.az`
- Callback/Webhook URL-lər:
  - Listing callback
  - Auction deposit callback
  - Auction service callback
  - Preauth callback
- Event siyahısı:
  - `payment_succeeded`
  - `payment_canceled`

## 3) Order ID təqdimatı üçün minimal data formatı

Banka göndərilən cədvəldə aşağıdakı sütunlar olmalıdır:

- `channel` (listing_plan / auction_deposit / auction_service)
- `internalPaymentId`
- `orderId`
- `remoteOrderId` (varsa)
- `amountAzn`
- `status`
- `providerMode`
- `paymentReference`
- `checkoutUrl`
- `createdAt`

## 4) Test mərhələsi üçün daxili checklist (P1.1–P1.4)

- P1.1 `POST /v1/payments`: payment yarat, redirect flow tamamla
- P1.2 `GET /v1/payments/{paymentId}`: status təsdiqi
- P1.3 `POST /v1/refunds`: refund yarat
- P1.4 `GET /v1/refunds/{refundId}`: refund status təsdiqi
- Bütün idempotent endpoint-lərdə `X-Idempotency-Key`
- Webhook imzası `X-Signature` HMAC yoxlaması

## 5) Gələn mailə cavab şablonları

### 5.1 Dokumentasiya göndərildikdən sonra cavab

Mövzu: Re: E-commerce BirPay API dokumentasiyası

Salam,

BirPay Checkout Merchant API dokumentasiyasını qəbul etdik.
Test mühitində inteqrasiya və ssenari yoxlamalarına başladıq.

Yoxlama planımız:
- Payment create/status
- Cancel/refund axınları
- Webhook event + signature verification
- Idempotency və retry davranışı

Test nəticələrini və Order ID-ləri qısa zamanda sizinlə paylaşacağıq.

Hörmətlə,  
EkoMobil texniki komanda

### 5.2 “Order ID təqdim edin” sorğusuna cavab

Mövzu: Re: Test mərhələsi uğurlu Order ID-lər

Salam,

Test mərhələsi üzrə uğurlu ödəniş order məlumatlarını təqdim edirik:

- Test Hesab: `<test_user_email>`
- Order ID: `<order_id>`
- Payment ID: `<payment_id>`
- Amount: `<amount> AZN`
- Status: `succeeded`
- Date: `<datetime>`

End-to-end test axını:
1. Test istifadəçi ilə checkout başladı
2. BirPay redirect/checkout tamamlandı
3. Callback/Webhook qəbul edildi
4. Signature verification uğurla keçdi
5. Ödəniş statusu DB-də yeniləndi
6. Plan/entitlement aktivləşdirildi

Lazım olarsa əlavə Order ID siyahısını CSV formatında təqdim edə bilərik.

Hörmətlə,  
EkoMobil texniki komanda

### 5.3 Test bitdi, production məlumat xahişi

Mövzu: BirPay test mərhələsi tamamlandı — production məlumat sorğusu

Salam,

BirPay test mərhələsini uğurla tamamladıq.
Xahiş edirik production aktivləşdirmə üçün aşağıdakı məlumatları paylaşasınız:

- Production merchant/terminal məlumatları (təsdiq)
- Production webhook qeydiyyatı təsdiqi
- Production secret/signature qaydaları
- Gerekli əlavə whitelist və ya əməliyyat tələbləri

Təşəkkür edirik.

Hörmətlə,  
EkoMobil texniki komanda

## 6) Daxili qeyd (operational)

- Bankdan cavab gecikməsin deyə maildən sonra eyni gün “qəbul edildi + işə başlandı” cavabı göndərin.
- Order ID soruşulduqda admin paneldən CSV export ilə ən azı 3–5 uğurlu test case təqdim edin.
- Göndərilən hər cavabda tarix/saat və test mühiti (`preprod`) açıq yazılsın.
