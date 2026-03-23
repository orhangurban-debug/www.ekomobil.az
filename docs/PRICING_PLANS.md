# EkoMobil Elan Qiymət Planları

## Rəqiblər Araşdırması

### Turbo.az (Azərbaycan)
- **Pulsuz**: 30 gün 1 elan
- **VIP**: Ödənişli – elan ön plana çıxır, daha çox görünmə
- Konkret VIP qiyməti saytda açıq deyil – dəstək xətti: (012) 526-47-47
- 24 saatda max 2 dəfə redaktə

### Tap.az (Azərbaycan)
- Pulsuz elan platforması
- VIP elan seçimi mövcuddur (əlavə görünmə)

### mobile.de (Almaniya – referans)
- **Runtimes**: 1 həftə, 4 həftə, 6 həftə
- **Basis**: Standart görünmə
- **Standard**: 1.5x daha çox klik
- **Premium**: 3x daha çox klik
- Əlavə: Eyecatcher, Page-1-Ad, Mark as NEW, Protected phone

### AutoScout24 (Avropa)
- Paket əsaslı qiymətləndirmə
- Çox vaxt mobile.de-dən ucuz

---

## EkoMobil Planları

| Plan | Qiymət (30 gün) | Xüsusiyyətlər |
|------|-----------------|---------------|
| **Pulsuz** | 0 ₼ | 1 elan, standart sıralanma, 30 gün |
| **Standart** | 9 ₼ | Vurğulanmış kart, 1.5x prioritet, statistika |
| **VIP** | 19 ₼ | Ön səhifə təklifi, 3x prioritet, vurğulanmış, statistika |

### Plan Detalları

**Pulsuz**
- İlk 1 elan üçün pulsuz
- Standart axtarış nəticələrində sıralanma
- 30 gün aktiv

**Standart**
- Vurğulanmış kart (border/background fərqi)
- Axtarışda yüksək prioritet (1.5x)
- Baxış statistikası
- 30 gün aktiv

**VIP**
- Ön səhifə "Son elanlar" bölməsində üstünlük
- Axtarışda maksimum prioritet (3x)
- Vurğulanmış görünüş
- Baxış statistikası
- 30 gün aktiv

---

## Texniki Tətbiq

- `listing_plans` cədvəli – plan tərifləri
- `listings.plan_type` – hər elanın planı (free, standard, vip)
- Publish flow-da plan seçimi (Pulsuz default)
- Ödəniş inteqrasiyası gələcək mərhələdə (indiki: plan seçimi + manuel/placeholder)

---

## Yeniləmə tarixi

- **2026-02** – İlkin planlar, Turbo.az və mobile.de tərzi əsasında
