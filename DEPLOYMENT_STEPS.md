# EkoMobil deploy – addım-addım

## Addım 1: Git başlat (əgər yoxdursa)

Terminalda layihə qovluğunda:

```bash
cd /Users/orkhangurban/asanavto.az
git init
git add .
git commit -m "EkoMobil ilk commit"
```

---

## Addım 2: GitHub-da yeni repo yarat

1. **github.com** aç
2. Sağ üstdə **+** → **New repository**
3. **Repository name:** `ekomobil` və ya `asanavto-az`
4. **Public** seç
5. **Create repository** bas (README, .gitignore əlavə etmə)

---

## Addım 3: GitHub-a push et

GitHub repo yaradandan sonra göstərilən əmrləri işlə. Və ya:

```bash
cd /Users/orkhangurban/asanavto.az

# GitHub-da yaratdığınız reponun URL-ni əvəz edin:
# orhangurban-debug/ekomobil
git remote add origin https://github.com/orhangurban-debug/ekomobil.git

git branch -M main
git push -u origin main
```

> **Qeyd:** GitHub istifadəçi adın `orhangurban-debug` deyilsə, URL-də öz adını yaz.

---

## Addım 4: Vercel-də deploy

1. **vercel.com** → daxil ol (GitHub ilə)
2. **Add New** → **Project**
3. **Import Git Repository** bölməsində repo axtar: `ekomobil`
4. **Import** bas

---

## Addım 5: Vercel konfiqurasiyası

Import səhifəsində:

1. **Root Directory:** **Edit** bas → `apps/web` yaz → **Continue**

2. **Environment Variables** əlavə et:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | PostgreSQL connection string (Neon, Supabase və s.) |
   | `AUTH_SECRET` | `openssl rand -hex 32` ilə yarat |
   | `GEMINI_API_KEY` | Google AI Studio açarı |

3. **Deploy** bas

---

## Addım 6: Domen (ekomobil.az)

1. Vercel-də proyekt aç
2. **Settings** → **Domains**
3. **Add** → `ekomobil.az` və `www.ekomobil.az`

4. **Smarthost** paneline keç:
   - Domenlər → EKOMOBIL.AZ → DNS
   - Vercel-in göstərdiyi A və CNAME recordları əlavə et

---

## Addım 7: Database (opsiyonel)

Əgər PostgreSQL lazımdırsa:

- **Neon Launch** (neon.tech) – bu layihə üçün tövsiyə olunan production seçimi
- **Supabase Pro** (supabase.com) – alternativ, amma bu repo üçün əsas seçim deyil

Connection string-i Vercel `DATABASE_URL`-ə yapışdır.

> Qeyd: auth, payments və auction workload-larına görə free-tier database ilə production işlətmək tövsiyə olunmur.

---

## Xülasə

| Addım | Harada | Nə et |
|-------|--------|-------|
| 1 | Terminal | `git init`, `git add .`, `git commit` |
| 2 | GitHub | Yeni repo yarat |
| 3 | Terminal | `git remote add`, `git push` |
| 4 | Vercel | Import → repo seç |
| 5 | Vercel | Root: `apps/web`, env variables, Deploy |
| 6 | Vercel + Smarthost | Domen əlavə et, DNS ayarla |
