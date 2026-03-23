# EkoMobil AI Köməkçi

## Ümumi baxış

Sağ alt küncdə floating düymə ilə AI chatbot. İstifadəçi avtomobil axtarışı haqqında sual yazır, AI parametrləri çıxarır və uyğun elanları göstərir.

## Konfiqurasiya

1. **GEMINI_API_KEY** – [Google AI Studio](https://aistudio.google.com/apikey) – API açarı əldə edin
2. `.env` faylına əlavə edin: `GEMINI_API_KEY="your-key"`

## Limitlər

| İstifadəçi | Gündəlik limit |
|------------|----------------|
| Qeydiyyatsız (IP) | 5 sual |
| Daxil olmuş | 20 sual |

Limitlər `ai_chat_usage` cədvəlində saxlanılır. Migrasiya: `npm run db:migrate`

## Arxitektura

- **API:** `POST /api/ai/chat` – mesaj alır, Gemini ilə parametr çıxarır, `listListings` çağırır, cavab qaytarır
- **GET /api/ai/chat** – qalan limit sayını qaytarır
- **Model:** Gemini 1.5 Flash
- **Limitlər:** `lib/ai/limits.ts` – PostgreSQL əsaslı

## Məhdudiyyətlər

- AI yalnız EkoMobil elanları və platforma haqqında cavab verir
- Başqa mövzularda cavab verməyəcək
