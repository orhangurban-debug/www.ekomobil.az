/**
 * EkoMobil — Açılış kampaniyası (Launch Promo)
 *
 * Platforma yeni açıldığı üçün istifadəçiləri cəlb etmək məqsədilə bütün
 * elan/abunəlik planları müvəqqəti olaraq pulsuzdur: fərdi elan planları
 * (Standart/VIP), Salon abunəlikləri, Mağaza abunəlikləri və Servis/Ekspertiza/
 * Usta planları.
 *
 * Kampaniya admin panelindən (Ayarlar → Qiymət planları) kod dəyişikliyi
 * olmadan aktivləşdirilə, uzadıla və ya bağlana bilər — konfiqurasiya
 * `system_settings.pricing_plan_config` sütununda (`launchPromo` sahəsi)
 * saxlanılır, bax: src/lib/pricing-plan-config.ts.
 */

export interface LaunchPromoConfig {
  /** Kampaniya ümumiyyətlə aktivdir/deaktivdir (admin açar-bağlar). */
  enabled: boolean;
  /** ISO tarix. null = bitmə tarixi yoxdur, admin bağlayana qədər davam edir. */
  endsAt: string | null;
}

/**
 * Defolt: kampaniya aktiv, bitmə tarixi təyin olunmayıb (admin istənilən vaxt
 * bitmə tarixi qoya və ya kampaniyanı bağlaya bilər).
 */
export const DEFAULT_LAUNCH_PROMO_CONFIG: LaunchPromoConfig = {
  enabled: true,
  endsAt: null
};

export function isLaunchPromoActive(config: LaunchPromoConfig): boolean {
  if (!config.enabled) return false;
  if (!config.endsAt) return true;
  const end = new Date(config.endsAt);
  if (Number.isNaN(end.getTime())) return true;
  return new Date() < end;
}

/** Promo aktivdirsə 0 qaytarır, əks halda əsas qiyməti. */
export function applyLaunchPromoPrice(basePriceAzn: number, config: LaunchPromoConfig): number {
  return isLaunchPromoActive(config) ? 0 : basePriceAzn;
}

export function formatLaunchPromoEndDateAz(config: LaunchPromoConfig): string | null {
  if (!config.endsAt) return null;
  const end = new Date(config.endsAt);
  if (Number.isNaN(end.getTime())) return null;
  return end.toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" });
}

/** UI rozetkası üçün hazır mətn, promo aktiv deyilsə null. */
export function getLaunchPromoBadgeText(config: LaunchPromoConfig): string | null {
  if (!isLaunchPromoActive(config)) return null;
  const endLabel = formatLaunchPromoEndDateAz(config);
  return endLabel
    ? `Açılış kampaniyası — ${endLabel} tarixinə qədər pulsuz`
    : "Açılış kampaniyası — hazırda pulsuz";
}

export function parseLaunchPromoConfig(raw: unknown): LaunchPromoConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_LAUNCH_PROMO_CONFIG };
  const o = raw as Record<string, unknown>;
  return {
    enabled: typeof o.enabled === "boolean" ? o.enabled : DEFAULT_LAUNCH_PROMO_CONFIG.enabled,
    endsAt: typeof o.endsAt === "string" && o.endsAt.trim() ? o.endsAt : null
  };
}
