export interface BrandImageAsset {
  id: string;
  label: string;
  url: string;
  kind: "logo" | "banner" | "social" | "other";
}

export interface BrandSettings {
  logoUrl: string;
  logoSquareUrl: string;
  faviconUrl: string;
  primaryColor: string;
  primaryHoverColor: string;
  deepBaseColor: string;
  softBrownColor: string;
  softBrownBorderColor: string;
  canvasColor: string;
  gallery: BrandImageAsset[];
}

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  logoUrl: "/brand/ekomobil-logo.png",
  logoSquareUrl: "/brand/ekomobil-logo.png",
  faviconUrl: "/brand/ekomobil-logo.png",
  primaryColor: "#0891B2",
  primaryHoverColor: "#0E7490",
  deepBaseColor: "#3E2F28",
  softBrownColor: "#E5D3B3",
  softBrownBorderColor: "#D4C4A8",
  canvasColor: "#FFFFFF",
  gallery: [
    {
      id: "default-main-logo",
      label: "Əsas loqo (PNG)",
      url: "/brand/ekomobil-logo.png",
      kind: "logo"
    }
  ]
};

function normalizeHex(input: string, fallback: string): string {
  const value = input.trim();
  if (/^#([0-9A-Fa-f]{6})$/.test(value)) return value.toUpperCase();
  return fallback;
}

function normalizeUrl(input: string, fallback: string): string {
  const value = input.trim();
  if (!value) return fallback;
  if (value.startsWith("/")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return fallback;
}

export function parseBrandSettings(raw: unknown): BrandSettings {
  const candidate = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const galleryInput = Array.isArray(candidate.gallery) ? candidate.gallery : [];
  const gallery = galleryInput
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const label = typeof o.label === "string" && o.label.trim() ? o.label.trim() : `Şəkil ${index + 1}`;
      const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : `asset-${index + 1}`;
      const urlRaw = typeof o.url === "string" ? o.url : "";
      const kind = o.kind === "logo" || o.kind === "banner" || o.kind === "social" || o.kind === "other" ? o.kind : "other";
      const url = normalizeUrl(urlRaw, "");
      if (!url) return null;
      return { id, label, url, kind } as BrandImageAsset;
    })
    .filter((x): x is BrandImageAsset => Boolean(x));

  return {
    logoUrl: normalizeUrl(String(candidate.logoUrl ?? ""), DEFAULT_BRAND_SETTINGS.logoUrl),
    logoSquareUrl: normalizeUrl(String(candidate.logoSquareUrl ?? ""), DEFAULT_BRAND_SETTINGS.logoSquareUrl),
    faviconUrl: normalizeUrl(String(candidate.faviconUrl ?? ""), DEFAULT_BRAND_SETTINGS.faviconUrl),
    primaryColor: normalizeHex(String(candidate.primaryColor ?? ""), DEFAULT_BRAND_SETTINGS.primaryColor),
    primaryHoverColor: normalizeHex(String(candidate.primaryHoverColor ?? ""), DEFAULT_BRAND_SETTINGS.primaryHoverColor),
    deepBaseColor: normalizeHex(String(candidate.deepBaseColor ?? ""), DEFAULT_BRAND_SETTINGS.deepBaseColor),
    softBrownColor: normalizeHex(String(candidate.softBrownColor ?? ""), DEFAULT_BRAND_SETTINGS.softBrownColor),
    softBrownBorderColor: normalizeHex(String(candidate.softBrownBorderColor ?? ""), DEFAULT_BRAND_SETTINGS.softBrownBorderColor),
    canvasColor: normalizeHex(String(candidate.canvasColor ?? ""), DEFAULT_BRAND_SETTINGS.canvasColor),
    gallery: gallery.length > 0 ? gallery : [...DEFAULT_BRAND_SETTINGS.gallery]
  };
}
