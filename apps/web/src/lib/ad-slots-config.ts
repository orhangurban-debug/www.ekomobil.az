import type { AdMode, AdSize } from "@/components/ads/ad-banner";

export interface AdSlotCustomContent {
  logoText: string;
  headline: string;
  sub: string;
  cta: string;
  href: string;
  accent: string;
}

export interface AdSlotItem {
  id: string;
  label: string;
  page: "home" | "listings" | "parts" | "global";
  size: AdSize;
  enabled: boolean;
  mode: AdMode | "custom";
  placeholderText: string;
  /** Aylıq qiymət (AZN) — admin paneldə göstərilir */
  priceAznPerMonth: number;
  priceNote: string;
  customContent?: AdSlotCustomContent;
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

function parseSlotItem(raw: unknown, fallback: AdSlotItem): AdSlotItem {
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  const mode = o.mode === "demo" || o.mode === "custom" ? o.mode : "placeholder";
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
    customContent
  };
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
