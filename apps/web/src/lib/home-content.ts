/**
 * Ana səhifə məzmunu — admin paneldən idarə olunur (hero slaydları, kateqoriyalar, mətnlər).
 * Şəkillər admin paneldən yüklənir və ya URL kimi daxil edilir.
 */

export type HomeCategoryIcon =
  | "suv"
  | "electric"
  | "sedan"
  | "budget"
  | "vin"
  | "auction"
  | "parts"
  | "truck"
  | "star";

export type HomeCategoryTone = "sky" | "emerald" | "violet" | "amber" | "teal" | "rose";

export interface HomeSlide {
  id: string;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  imageUrl: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
}

export interface HomeCategory {
  id: string;
  label: string;
  href: string;
  icon: HomeCategoryIcon;
  tone: HomeCategoryTone;
  badge?: string;
}

export interface HomeContentConfig {
  slides: HomeSlide[];
  categories: HomeCategory[];
  featuredTitle: string;
  featuredSubtitle: string;
  sellCtaTitle: string;
  sellCtaText: string;
  updatedAt?: string;
}

export const DEFAULT_HOME_CONTENT: HomeContentConfig = {
  slides: [
    {
      id: "marketplace",
      badge: "Avtomobil bazarı",
      title: "Etibarla al.",
      highlight: "Şəffaf qiymətlə sat.",
      subtitle:
        "VIN yoxlamalı elanlar, etibar xalı və bazar analizi — Azərbaycanda ən şəffaf avtomobil bazarı.",
      imageUrl:
        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1920&q=80",
      ctaPrimaryLabel: "Elanları kəşf et",
      ctaPrimaryHref: "/listings",
      ctaSecondaryLabel: "Elan yerləşdir",
      ctaSecondaryHref: "/publish"
    },
    {
      id: "auction",
      badge: "Canlı auksion",
      title: "Real vaxtda",
      highlight: "hərrac.",
      subtitle:
        "Sayğac, avtomatik təklif və tam tarixi ilə şəffaf auksion — lot statusu anında yenilənir.",
      imageUrl:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1920&q=80",
      ctaPrimaryLabel: "Auksionlara bax",
      ctaPrimaryHref: "/auction",
      ctaSecondaryLabel: "Lot yerləşdir",
      ctaSecondaryHref: "/auction/sell"
    },
    {
      id: "trust",
      badge: "Etibar & yoxlama",
      title: "VIN, servis tarixçəsi,",
      highlight: "yürüş təsdiqi.",
      subtitle:
        "Hər elan məlumat dolğunluğuna görə qiymətləndirilir — alıcı risk siqnallarını əvvəlcədən görür.",
      imageUrl:
        "https://images.unsplash.com/photo-1619642751034-765df6927ada?auto=format&fit=crop&w=1920&q=80",
      ctaPrimaryLabel: "Etibar mərkəzi",
      ctaPrimaryHref: "/trust",
      ctaSecondaryLabel: "Elanları yoxla",
      ctaSecondaryHref: "/listings?vinProvided=1"
    },
    {
      id: "business",
      badge: "Salon & mağaza",
      title: "Biznesiniz üçün",
      highlight: "tam platforma.",
      subtitle:
        "Avtomobil salonu, ehtiyat hissə mağazası və servis — bir hesabdan idarə, analitika və CRM.",
      imageUrl:
        "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1920&q=80",
      ctaPrimaryLabel: "Salonları kəşf et",
      ctaPrimaryHref: "/dealers",
      ctaSecondaryLabel: "Biznes planları",
      ctaSecondaryHref: "/pricing#dealer"
    }
  ],
  categories: [
    { id: "suv", label: "SUV və krossover", href: "/listings?bodyType=SUV", icon: "suv", tone: "sky" },
    { id: "electric", label: "Elektrik", href: "/listings?fuelType=Elektrik", icon: "electric", tone: "emerald" },
    { id: "sedan", label: "Sedan", href: "/listings?bodyType=Sedan", icon: "sedan", tone: "violet" },
    { id: "budget", label: "10 000 ₼ altı", href: "/listings?maxPrice=10000", icon: "budget", tone: "amber" },
    { id: "vin", label: "VIN Məlumatı", href: "/listings?vinProvided=1", icon: "vin", tone: "teal" },
    { id: "auction", label: "Auksion", href: "/auction", icon: "auction", tone: "rose", badge: "Yeni" }
  ],
  featuredTitle: "Son elanlar",
  featuredSubtitle: "Premium seçilmiş avtomobillər",
  sellCtaTitle: "Avtomobilinizi satmaq istəyirsiniz?",
  sellCtaText: "Pulsuz elan, VIN yoxlama, etibar xalı və premium planlarla daha tez alıcı tapın."
};

const CATEGORY_ICONS: HomeCategoryIcon[] = [
  "suv",
  "electric",
  "sedan",
  "budget",
  "vin",
  "auction",
  "parts",
  "truck",
  "star"
];

const CATEGORY_TONES: HomeCategoryTone[] = ["sky", "emerald", "violet", "amber", "teal", "rose"];

function normalizeUrl(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (v.startsWith("/")) return v;
  if (/^https?:\/\//i.test(v)) return v;
  return "";
}

function parseSlide(raw: unknown, index: number): HomeSlide | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = String(o.title ?? "").trim();
  if (!title) return null;
  return {
    id: String(o.id ?? `slide-${index + 1}`).slice(0, 60),
    badge: String(o.badge ?? "").slice(0, 60),
    title: title.slice(0, 120),
    highlight: String(o.highlight ?? "").slice(0, 120),
    subtitle: String(o.subtitle ?? "").slice(0, 400),
    imageUrl: normalizeUrl(String(o.imageUrl ?? "")),
    ctaPrimaryLabel: String(o.ctaPrimaryLabel ?? "Ətraflı").slice(0, 60),
    ctaPrimaryHref: String(o.ctaPrimaryHref ?? "/").slice(0, 300),
    ctaSecondaryLabel: String(o.ctaSecondaryLabel ?? "").slice(0, 60),
    ctaSecondaryHref: String(o.ctaSecondaryHref ?? "").slice(0, 300)
  };
}

function parseCategory(raw: unknown, index: number): HomeCategory | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const label = String(o.label ?? "").trim();
  if (!label) return null;
  const icon = CATEGORY_ICONS.includes(o.icon as HomeCategoryIcon) ? (o.icon as HomeCategoryIcon) : "star";
  const tone = CATEGORY_TONES.includes(o.tone as HomeCategoryTone) ? (o.tone as HomeCategoryTone) : "sky";
  const badge = typeof o.badge === "string" && o.badge.trim() ? o.badge.trim().slice(0, 24) : undefined;
  return {
    id: String(o.id ?? `cat-${index + 1}`).slice(0, 60),
    label: label.slice(0, 60),
    href: String(o.href ?? "/listings").slice(0, 300),
    icon,
    tone,
    badge
  };
}

export function parseHomeContentConfig(raw: unknown): HomeContentConfig {
  if (!raw || typeof raw !== "object") {
    return {
      ...DEFAULT_HOME_CONTENT,
      slides: [...DEFAULT_HOME_CONTENT.slides],
      categories: [...DEFAULT_HOME_CONTENT.categories]
    };
  }
  const o = raw as Record<string, unknown>;
  const slides = Array.isArray(o.slides)
    ? o.slides.map((s, i) => parseSlide(s, i)).filter((s): s is HomeSlide => Boolean(s))
    : [];
  const categories = Array.isArray(o.categories)
    ? o.categories.map((c, i) => parseCategory(c, i)).filter((c): c is HomeCategory => Boolean(c))
    : [];

  return {
    slides: slides.length > 0 ? slides : [...DEFAULT_HOME_CONTENT.slides],
    categories: categories.length > 0 ? categories : [...DEFAULT_HOME_CONTENT.categories],
    featuredTitle: String(o.featuredTitle ?? DEFAULT_HOME_CONTENT.featuredTitle).slice(0, 120),
    featuredSubtitle: String(o.featuredSubtitle ?? DEFAULT_HOME_CONTENT.featuredSubtitle).slice(0, 200),
    sellCtaTitle: String(o.sellCtaTitle ?? DEFAULT_HOME_CONTENT.sellCtaTitle).slice(0, 160),
    sellCtaText: String(o.sellCtaText ?? DEFAULT_HOME_CONTENT.sellCtaText).slice(0, 400),
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined
  };
}
