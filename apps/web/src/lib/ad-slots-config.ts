import type { AdMode, AdSize } from "@/components/ads/ad-banner";

export interface AdSlotCustomContent {
  logoText: string;
  headline: string;
  sub: string;
  cta: string;
  href: string;
  accent: string;
}

/**
 * Ödənişli reklam kampaniyası — admin paneldən şəkil yüklənir, büdcə və gündəlik
 * tarif əsasında müddət avtomatik hesablanır. Müddət bitəndə reklam avtomatik sönür.
 */
export interface AdCampaign {
  advertiserName: string;
  /** Yüklənmiş reklam şəkli (banner kreativi) */
  imageUrl: string;
  /** Kliklə keçid ünvanı */
  linkUrl: string;
  /** Ümumi büdcə (AZN) */
  budgetAzn: number;
  /** Gündəlik tarif (AZN/gün) — müddət = büdcə / gündəlik tarif */
  dailyRateAzn: number;
  /** Başlama tarixi (YYYY-MM-DD) */
  startDate: string;
  /** Kampaniya master açarı — admin əl ilə dayandıra/başlada bilər */
  active: boolean;
}

export type AdCampaignState = "not_configured" | "scheduled" | "live" | "expired" | "paused";

export interface AdCampaignStatus {
  configured: boolean;
  durationDays: number;
  startDate: string;
  endDate: string | null;
  daysRemaining: number;
  isLive: boolean;
  state: AdCampaignState;
}

export interface AdSlotItem {
  id: string;
  label: string;
  page: "home" | "listings" | "parts" | "global";
  size: AdSize;
  enabled: boolean;
  mode: AdMode | "custom" | "campaign";
  placeholderText: string;
  /** Aylıq qiymət (AZN) — admin paneldə göstərilir */
  priceAznPerMonth: number;
  priceNote: string;
  customContent?: AdSlotCustomContent;
  campaign?: AdCampaign;
}

export interface AdSlotsConfig {
  slots: AdSlotItem[];
  /** Ümumi reklam şərtləri (admin paneldə) */
  pricingNotes: string;
  contactEmail: string;
  updatedAt?: string;
}

export const DEFAULT_AD_SLOTS: AdSlotItem[] = [
  {
    id: "home-top-leaderboard",
    label: "Ana səhifə — hero altı (Leaderboard)",
    page: "home",
    size: "leaderboard",
    enabled: true,
    mode: "placeholder",
    placeholderText: "Burda sizin reklamınız ola bilər!",
    priceAznPerMonth: 450,
    priceNote: "728×90 · desktop · ~15 000 görüntüləmə/ay"
  },
  {
    id: "home-top-mobile",
    label: "Ana səhifə — hero altı (Mobil)",
    page: "home",
    size: "mobile",
    enabled: true,
    mode: "placeholder",
    placeholderText: "Burda sizin reklamınız ola bilər!",
    priceAznPerMonth: 180,
    priceNote: "320×50 · mobil"
  },
  {
    id: "home-mid-wide",
    label: "Ana səhifə — məzmun ortası (Wide)",
    page: "home",
    size: "wide",
    enabled: true,
    mode: "placeholder",
    placeholderText: "Burda sizin reklamınız ola bilər!",
    priceAznPerMonth: 550,
    priceNote: "970×90 · desktop geniş"
  },
  {
    id: "home-listings-native",
    label: "Ana səhifə — elanlar arası (Native)",
    page: "home",
    size: "rectangle",
    enabled: true,
    mode: "placeholder",
    placeholderText: "Burda sizin reklamınız ola bilər!",
    priceAznPerMonth: 320,
    priceNote: "300×250 · elan kartı formatı"
  },
  {
    id: "home-bottom-leaderboard",
    label: "Ana səhifə — footer üstü (Leaderboard)",
    page: "home",
    size: "leaderboard",
    enabled: true,
    mode: "placeholder",
    placeholderText: "Burda sizin reklamınız ola bilər!",
    priceAznPerMonth: 380,
    priceNote: "728×90 · footer yaxınlığı"
  },
  {
    id: "listings-bottom",
    label: "Elanlar — səhifə altı",
    page: "listings",
    size: "leaderboard",
    enabled: true,
    mode: "placeholder",
    placeholderText: "Burda sizin reklamınız ola bilər!",
    priceAznPerMonth: 420,
    priceNote: "728×90 · yüksək niyyət trafiki"
  },
  {
    id: "listings-inline",
    label: "Elanlar — grid arası (Native)",
    page: "listings",
    size: "rectangle",
    enabled: true,
    mode: "placeholder",
    placeholderText: "Burda sizin reklamınız ola bilər!",
    priceAznPerMonth: 290,
    priceNote: "300×250 · hər 6 elandan sonra"
  },
  {
    id: "parts-bottom",
    label: "Mağaza — səhifə altı",
    page: "parts",
    size: "leaderboard",
    enabled: true,
    mode: "placeholder",
    placeholderText: "Burda sizin reklamınız ola bilər!",
    priceAznPerMonth: 280,
    priceNote: "728×90 · hissə mağazası"
  },
  {
    id: "parts-inline",
    label: "Mağaza — grid arası (Native)",
    page: "parts",
    size: "rectangle",
    enabled: true,
    mode: "placeholder",
    placeholderText: "Burda sizin reklamınız ola bilər!",
    priceAznPerMonth: 220,
    priceNote: "300×250 · hər 6 elandan sonra"
  }
];

export const DEFAULT_AD_SLOTS_CONFIG: AdSlotsConfig = {
  slots: DEFAULT_AD_SLOTS,
  pricingNotes:
    "Qiymətlər aylıq, 30 günlük dövrlə hesablanır. Endirimlər 3+ slot paketində tətbiq olunur. Kampaniya müddəti və klik/impression hesabatı admin tərəfindən təqdim edilir.",
  contactEmail: "reklam@ekomobil.az"
};

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseCampaign(raw: unknown): AdCampaign | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const imageUrl = normalizeAssetUrl(String(o.imageUrl ?? ""));
  const linkUrl = normalizeAssetUrl(String(o.linkUrl ?? ""));
  const startDate = isIsoDate(String(o.startDate ?? "")) ? String(o.startDate) : todayIso();
  return {
    advertiserName: String(o.advertiserName ?? "").slice(0, 120),
    imageUrl,
    linkUrl,
    budgetAzn: typeof o.budgetAzn === "number" && o.budgetAzn >= 0 ? o.budgetAzn : 0,
    dailyRateAzn: typeof o.dailyRateAzn === "number" && o.dailyRateAzn >= 0 ? o.dailyRateAzn : 0,
    startDate,
    active: o.active === true
  };
}

/** Xarici URL və ya daxili yol — digəri boş qaytarılır (təhlükəsiz normallaşdırma). */
function normalizeAssetUrl(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (v.startsWith("/")) return v;
  if (/^https?:\/\//i.test(v)) return v;
  return "";
}

function parseSlotItem(raw: unknown, fallback: AdSlotItem): AdSlotItem {
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  const mode =
    o.mode === "demo" || o.mode === "custom" || o.mode === "campaign" ? o.mode : "placeholder";
  const size =
    o.size === "leaderboard" || o.size === "rectangle" || o.size === "wide" || o.size === "mobile"
      ? o.size
      : fallback.size;
  const page =
    o.page === "home" || o.page === "listings" || o.page === "parts" || o.page === "global"
      ? o.page
      : fallback.page;

  let customContent: AdSlotCustomContent | undefined;
  if (o.customContent && typeof o.customContent === "object") {
    const c = o.customContent as Record<string, unknown>;
    customContent = {
      logoText: String(c.logoText ?? "AD"),
      headline: String(c.headline ?? ""),
      sub: String(c.sub ?? ""),
      cta: String(c.cta ?? "Ətraflı"),
      href: String(c.href ?? "/"),
      accent: String(c.accent ?? "#0057FF")
    };
  }

  return {
    id: String(o.id ?? fallback.id),
    label: String(o.label ?? fallback.label),
    page,
    size,
    enabled: o.enabled !== false,
    mode,
    placeholderText: String(o.placeholderText ?? fallback.placeholderText),
    priceAznPerMonth:
      typeof o.priceAznPerMonth === "number" && o.priceAznPerMonth >= 0
        ? o.priceAznPerMonth
        : fallback.priceAznPerMonth,
    priceNote: String(o.priceNote ?? fallback.priceNote),
    customContent,
    campaign: parseCampaign(o.campaign)
  };
}

/**
 * Kampaniyanın hazırkı statusunu hesablayır — müddət büdcə/gündəlik tarifə görə
 * avtomatik təyin olunur. `isLive` yalnız pəncərə daxilində, aktiv və şəkilli olduqda true-dur.
 */
export function computeAdCampaignStatus(
  campaign: AdCampaign | undefined,
  now: Date = new Date()
): AdCampaignStatus {
  if (!campaign) {
    return {
      configured: false,
      durationDays: 0,
      startDate: todayIso(),
      endDate: null,
      daysRemaining: 0,
      isLive: false,
      state: "not_configured"
    };
  }

  const durationDays =
    campaign.dailyRateAzn > 0 ? Math.floor(campaign.budgetAzn / campaign.dailyRateAzn) : 0;
  const configured =
    Boolean(campaign.imageUrl) && campaign.budgetAzn > 0 && campaign.dailyRateAzn > 0 && durationDays > 0;

  const start = new Date(`${campaign.startDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);
  const endIso = durationDays > 0 ? end.toISOString().slice(0, 10) : null;

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = configured
    ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / msPerDay))
    : 0;

  let state: AdCampaignState;
  let isLive = false;
  if (!campaign.active) {
    state = "paused";
  } else if (!configured) {
    state = "not_configured";
  } else if (now.getTime() < start.getTime()) {
    state = "scheduled";
  } else if (now.getTime() >= end.getTime()) {
    state = "expired";
  } else {
    state = "live";
    isLive = true;
  }

  return { configured, durationDays, startDate: campaign.startDate, endDate: endIso, daysRemaining, isLive, state };
}

export function parseAdSlotsConfig(raw: unknown): AdSlotsConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_AD_SLOTS_CONFIG, slots: [...DEFAULT_AD_SLOTS] };
  const o = raw as Record<string, unknown>;
  const savedSlots = Array.isArray(o.slots) ? o.slots : [];
  const slotMap = new Map<string, AdSlotItem>();

  for (const fallback of DEFAULT_AD_SLOTS) {
    const saved = savedSlots.find(
      (s) => s && typeof s === "object" && (s as Record<string, unknown>).id === fallback.id
    );
    slotMap.set(fallback.id, parseSlotItem(saved, fallback));
  }

  for (const saved of savedSlots) {
    const parsed = parseSlotItem(saved, DEFAULT_AD_SLOTS[0]);
    if (!slotMap.has(parsed.id)) slotMap.set(parsed.id, parsed);
  }

  return {
    slots: Array.from(slotMap.values()),
    pricingNotes: String(o.pricingNotes ?? DEFAULT_AD_SLOTS_CONFIG.pricingNotes),
    contactEmail: String(o.contactEmail ?? DEFAULT_AD_SLOTS_CONFIG.contactEmail),
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined
  };
}

export function getAdSlotById(config: AdSlotsConfig, id: string): AdSlotItem | undefined {
  return config.slots.find((s) => s.id === id);
}
