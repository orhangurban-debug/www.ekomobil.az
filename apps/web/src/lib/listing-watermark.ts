/** Paylaşılan elan şəkillərində istifadə olunan EkoMobil wordmark watermark parametrləri. */
export const LISTING_WATERMARK = {
  /** Public URL — kart və qalereya overlay */
  publicSrc: "/brand/ekomobil-watermark.png",
  /** Server tərəfində fayl adları (public/brand altında) */
  fileNames: ["ekomobil-watermark.png", "ekomobil-logo.png", "ekomobil-mark.png"],
  /** Loqo şəffaflığı (0–1) */
  opacity: 0.58,
  /** Şəkil eninə nisbətən wordmark genişliyi */
  widthRatio: 0.2,
  /** Minimum / maksimum wordmark eni (px) */
  minWidthPx: 96,
  maxWidthPx: 240,
  /** Kənar boşluq — qısa tərəfə nisbətən */
  marginRatio: 0.022,
  minMarginPx: 10,
  /** Arxa fon lövhəsi — oxunaqlılıq üçün */
  backdropOpacity: 0.22,
  backdropPaddingRatio: 0.35
} as const;

export function listingWatermarkOverlayClassName(): string {
  return "pointer-events-none absolute bottom-2 right-2 z-10 sm:bottom-3 sm:right-3";
}
