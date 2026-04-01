import { GoogleGenAI } from "@google/genai";
import type { ListingQuery } from "@/lib/marketplace-types";
import type { CarModelInsights } from "@/lib/car-insights";

const EXTRACT_SEARCH_PROMPT = `Sən EkoMobil avtomobil platformasının köməkçisisən. İstifadəçinin mesajından elan axtarış parametrlərini çıxar.

Mövcud parametrlər (JSON):
- make: marka (Toyota, BMW, Mercedes, Hyundai, Kia, Volkswagen, və s.)
- city: şəhər (Bakı, Sumqayıt, Gəncə, və s.)
- minPrice, maxPrice: manat (AZN)
- minYear, maxYear: il
- minMileage, maxMileage: km
- fuelType: Benzin, Dizel, Hibrid, Elektrik, Qaz
- transmission: Avtomat, Mexanik, Yarıavtomat
- sellerType: private, dealer
- vinVerified: true (əgər "VIN doğrulanmış", "etibarlı" istəyirsə)
- sort: trust_desc, price_asc, price_desc, year_desc, mileage_asc, recent
- search: azad mətn axtarışı

Qayda: Yalnız istifadəçinin açıq dediyi və ya güclü əmarlardan çıxan parametrləri qoy. Güman etmə.
"Etibarlı", "VIN yoxlanılmış" → vinVerified: true
"Ucuz", "bütçəyə uyğun" → maxPrice təxmini (məs: 20000)
"Ailə üçün" → search və ya heç nə (çox spesifik deyil)

Cavabı YALNIZ valid JSON ver, heç bir izah yazma. Format:
{"make":"Toyota","maxPrice":25000,"vinVerified":true}
Əgər heç bir parametr çıxarılmırsa: {}`;

const REPLY_PROMPT = `Sən EkoMobil avtomobil platformasının köməkçisisən. Yalnız elanlar, axtarış və platforma haqqında cavab ver.
Əgər mövzu avtomobil elanları deyilsə, "Bu sual EkoMobil platforması ilə bağlı deyil. Avtomobil elanları və axtarış haqqında suala cavab verə bilərəm." de.
Qısa və faydalı cavab ver. Azərbaycan dilində yaz.`;

export async function extractSearchParams(userMessage: string): Promise<Partial<ListingQuery>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return {};

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `${EXTRACT_SEARCH_PROMPT}\n\nİstifadəçi: ${userMessage}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 512
      }
    });

    const text = response.text?.trim();
    if (!text) return {};

    const parsed = JSON.parse(text) as Record<string, unknown>;
    const q: Partial<ListingQuery> = {};
    if (typeof parsed.make === "string") q.make = parsed.make;
    if (typeof parsed.city === "string") q.city = parsed.city;
    if (typeof parsed.search === "string") q.search = parsed.search;
    if (typeof parsed.minPrice === "number") q.minPrice = parsed.minPrice;
    if (typeof parsed.maxPrice === "number") q.maxPrice = parsed.maxPrice;
    if (typeof parsed.minYear === "number") q.minYear = parsed.minYear;
    if (typeof parsed.maxYear === "number") q.maxYear = parsed.maxYear;
    if (typeof parsed.minMileage === "number") q.minMileage = parsed.minMileage;
    if (typeof parsed.maxMileage === "number") q.maxMileage = parsed.maxMileage;
    if (typeof parsed.fuelType === "string") q.fuelType = parsed.fuelType;
    if (typeof parsed.transmission === "string") q.transmission = parsed.transmission;
    if (parsed.vinVerified === true) q.vinVerified = true;
    if (parsed.sellerVerified === true) q.sellerVerified = true;
    if (parsed.sellerType === "private" || parsed.sellerType === "dealer") q.sellerType = parsed.sellerType;
    if (typeof parsed.sort === "string" && ["trust_desc", "price_asc", "price_desc", "year_desc", "mileage_asc", "recent"].includes(parsed.sort)) {
      q.sort = parsed.sort as ListingQuery["sort"];
    }
    return q;
  } catch {
    return {};
  }
}

const CAR_INSIGHTS_PROMPT = `Sən avtomobil analitiki ekspertisən. Aşağıdakı avtomobil modeli üçün JSON formatında dəqiq analitik məlumat yarat.

Məlumat mənbələri: J.D. Power IQS/VDS, Consumer Reports Reliability Survey, TÜV Report, Euro NCAP/NHTSA. Reytinqlər 1–10 şkalasında.

JSON strukturu (YALNIZ bu JSON-u qaytar, heç bir izah əlavə etmə):
{
  "make": "string",
  "model": "string", 
  "yearFrom": number,
  "ratings": {
    "reliability": number (1-10),
    "comfort": number (1-10),
    "performance": number (1-10),
    "economy": number (1-10),
    "safety": number (1-10)
  },
  "ownerSatisfaction": number (0-100, faiz),
  "strengths": ["string", "string", "string"],
  "weaknesses": ["string", "string", "string"],
  "commonProblems": ["string", "string"],
  "maintenanceCost": "aşağı" | "orta" | "yüksək" | "çox yüksək",
  "sourceNote": "string (qısa mənbə qeydi)",
  "verdict": "string (2-3 cümlə, Azərbaycan dilində)"
}

Bütün mətn sahələri Azərbaycan dilində olmalıdır. Reytinqlər beynəlxalq ortalama göstəriciləri əks etdirməlidir.`;

// In-memory cache to avoid duplicate Gemini calls within a server lifecycle
const insightsCache = new Map<string, CarModelInsights>();

export async function generateCarInsightsAi(
  make: string,
  model: string,
  year: number
): Promise<CarModelInsights | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const cacheKey = `${make}::${model}::${Math.floor(year / 5) * 5}`;
  if (insightsCache.has(cacheKey)) return insightsCache.get(cacheKey)!;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `${CAR_INSIGHTS_PROMPT}\n\nModel: ${make} ${model} (${year} il)`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 1024
      }
    });

    const text = response.text?.trim();
    if (!text) return null;

    const parsed = JSON.parse(text) as CarModelInsights;
    // Basic validation
    if (!parsed.ratings || typeof parsed.ratings.reliability !== "number") return null;

    insightsCache.set(cacheKey, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export async function generateChatReply(
  userMessage: string,
  listingsContext: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "AI xidməti hazırda əlçatan deyil. Zəhmət olmasa elanlar səhifəsindən axtarış edin.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const content = listingsContext
      ? `${REPLY_PROMPT}\n\nİstifadəçi: ${userMessage}\n\nTapılan elanlar:\n${listingsContext}`
      : `${REPLY_PROMPT}\n\nİstifadəçi: ${userMessage}`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: content,
      config: {
        temperature: 0.5,
        maxOutputTokens: 1024
      }
    });

    return response.text?.trim() ?? "Cavab alınmadı.";
  } catch (e) {
    console.error("Gemini error:", e);
    return "Xəta baş verdi. Yenidən cəhd edin.";
  }
}
