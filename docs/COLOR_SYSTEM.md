# EkoMobil Rəng Sistemi

Bu sənəd saytın rəng palitrasını və istifadə qaydalarını strukturlaşdırır. Dizayn və inkişaf zamanı bu kodlardan istifadə edilməlidir.

## Rəng Palitrası

| Ad (AZ) | Ad (EN) | Hex Kod | Balans | Tətbiq sahəsi |
|---------|---------|---------|--------|---------------|
| **Ağ** | Clean Space | `#FFFFFF` | **50%** | Geniş boşluqlar, əsas arxa fonlar |
| **Dəniz dalğası mavisi** | Ocean Teal | `#0891B2` | **30%** | Düymələr, linklər, "Mobil" loqo, vurğular |
| **Qəhvəyi** | Deep Base | `#3E2F28` | **10%** | "Eko" loqo, dərinlik, struktur |
| **Qum rəngi** | Soft Brown | `#E5D3B3` | **10%** | Footer fonu, çərçivələr, subtle vurğular |

## Loqo rəngləri (EkoMobil)

- **Eko** → `#3E2F28` (Deep Base)
- **Mobil** → `#0891B2` (Ocean Teal)

## Komponentlərdə tətbiq

### Clean Space (#FFFFFF) – 50%
- Header arxa fonu
- Səhifə arxa fonu, Hero bölməsi
- Kartlar, Trust features
- Modal və drawer arxa fonları

### Ocean Teal (#0891B2) – 30%
- Əsas düymələr (btn-primary)
- CTA bölməsi arxa fonu
- Loqo "Mobil" hissəsi
- Aktiv linklər, nav vurğuları
- Badge və etiketlər

### Deep Base (#3E2F28) – 10%
- Loqo "Eko" hissəsi
- Başlıq və mətn vurğuları
- Footer mətnləri (Soft Brown fonunda)

### Soft Brown (#E5D3B3) – 10%
- Footer arxa fonu
- Kart border və çərçivələr
- Ayırıcı xətlər

## Tailwind / CSS dəyişənləri

```css
--color-deep-base: #3E2F28;
--color-clean-space: #FFFFFF;
--color-ocean-teal: #0891B2;
--color-soft-brown: #E5D3B3;
```

## Yeniləmə tarixi

- **2026-02** – İlkin palitranın təqdimatı və strukturlaşdırılması
