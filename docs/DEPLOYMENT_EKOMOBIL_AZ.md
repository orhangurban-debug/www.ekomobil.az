# EkoMobil.az – Domain və Deploy Təlimatı

## 1. Deploy platforması seçimi

### Vercel (tövsiyə olunur)
- Next.js üçün ən uyğun
- Pulsuz SSL (HTTPS)
- Özəl domen dəstəyi
- Git inteqrasiyası

### Smarthost hosting
- VPS və ya shared hosting varsa
- Node.js dəstəyi lazımdır

---

## 2. Vercel ilə deploy

### Addım 1: Vercelə proyekt əlavə edin
1. [vercel.com](https://vercel.com) – hesab açın (GitHub ilə)
2. **Add New Project** → GitHub repo seçin
3. **Root Directory:** `apps/web` qeyd edin (monorepo üçün mütləq)
4. **Framework Preset:** Next.js (avtomatik seçilə bilər)

### Addım 2: Environment variables
Vercel dashboard → Project → Settings → Environment Variables:

| Dəyişən | Qiymət |
|---------|--------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Təsadüfi açar (openssl rand -hex 32) |
| `GEMINI_API_KEY` | Google AI API açarı |

### Addım 3: Domen əlavə etmək
1. Vercel → Project → **Settings** → **Domains**
2. **Add** → `ekomobil.az` yazın
3. `www.ekomobil.az` da əlavə edin

Vercel sizə DNS təlimatları verəcək.

---

## 3. Smarthost DNS konfiqurasiyası

Smarthost panelində **Domenlər** → **EKOMOBIL.AZ** → **DNS** (və ya tənzimləmə ikonuna keçin).

### Vercel istifadə etsəniz

Vercel-də domain əlavə etdikdən sonra göstərilən DNS recordları əlavə edin:

| Növ | Ad | Qiymət |
|-----|-----|--------|
| A | @ | `76.76.21.21` |
| CNAME | www | `cname.vercel-dns.com` |

Vercel dashboard-da dəqiq IP və CNAME göstərilir – onları istifadə edin.

### Öz serveriniz (VPS) varsa

| Növ | Ad | Qiymət |
|-----|-----|--------|
| A | @ | Server IP-niz (məs: 123.45.67.89) |
| A | www | Eyni IP |

---

## 4. Gözləmə müddəti

DNS dəyişiklikləri 24–48 saat ərzində tam tətbiq oluna bilər (adətən 15–60 dəqiqə).

---

## 5. Yoxlama

- https://ekomobil.az
- https://www.ekomobil.az

SSL sertifikatı Vercel-də avtomatik aktiv olur.
