/**
 * EkoMobil — Elan Qiymət Planları və Yaddaş Limitləri
 *
 * ── Qiymətləndirmə modeli ────────────────────────────────────────────────
 *
 * İSTİFADƏÇİ (fərdi satıcı):
 *   • Hər elan ayrıca plan seçir: Pulsuz / Standart / VIP.
 *   • Eyni anda yalnız 1 aktiv PULSUZ elanı ola bilər.
 *     İkinci pulsuz elan yerləşdirmək üçün birinci elanın müddəti bitməlidir
 *     və ya Standart/VIP plana yüksəlməlidir.
 *   • Ödənişli planlar (Standart/VIP) isə limitsiz sayda eyni vaxtda aktiv
 *     ola bilər — hər biri ayrıca ödənir.
 *
 * SALON (dealer) — ayrıca DEALER_PLANS abunəliyi var:
 *   • Aylıq sabit abunə → N aktiv elan hüququ.
 *   • Hər elan Standart keyfiyyətdə (20 foto, video, 40 MB).
 *   • CSV toplu yükləmə imkanı (Pro/Enterprise).
 *   → bax: src/lib/dealer-plans.ts
 *
 * MAĞAZA (ehtiyat hissəsi) — ayrıca PARTS_STORE_PLANS abunəliyi var:
 *   → bax: src/lib/parts-store-plans.ts
 *
 * ── Şəkil emalı ─────────────────────────────────────────────────────────
 *   Hər yüklənən şəkil sistem tərəfindən avtomatik:
 *     • JPEG 85% keyfiyyəti ilə sıxılır
 *     • Maksimum 1280 px (uzun tərəf) ölçüsünə gətirilir
 *     • HEIC / PNG / WebP / BMP → JPEG-ə çevrilir
 *   Bu emal browser-da (Canvas API) baş verir, server yükünü azaldır.
 *   Sıxılmadan sonra plan limiti yoxlanılır.
 *   → bax: src/lib/image-processor.ts
 */

export type PlanType = "free" | "standard" | "vip";

/**
 * Eyni anda bir istifadəçinin sahib ola biləcəyi maksimum PULSUZ aktiv elan sayı.
 * Ödənişli elanların sayında limit yoxdur.
 */
export const FREE_LISTING_CONCURRENT_LIMIT = 1;

export interface ListingPlan {
  id: PlanType;
  name: string;
  nameAz: string;
  /** Elan başına ödəniş (bir dəfəlik) */
  priceAzn: number;
  /** Elanın aktiv qalacağı gün sayı */
  durationDays: number;
  priorityMultiplier: number;
  isHighlighted: boolean;
  featuredInHome: boolean;
  /** Maksimum şəkil sayı (sıxılmadan sonra) */
  maxImages: number;
  /**
   * Hər şəkil üçün maksimum fayl ölçüsü (KB) — sıxılmadan ƏVVƏL yoxlanılır.
   * Sıxılmadan sonra həcm daha kiçik olacaq.
   */
  maxImageSizeKb: number;
  /** Bir elan üçün ümumi şəkil saxlama həcmi (MB) — sıxılmadan sonra */
  storageMb: number;
  /** Video yükləmə imkanı */
  videoEnabled: boolean;
  maxVideos: number;
  maxVideoSizeMb: number;
  /** Müddət bitdikdən sonra yeniləmə "lütf müddəti" (gün) */
  renewGracePeriodDays: number;
}

export const LISTING_PLANS: ListingPlan[] = [
  {
    id: "free",
    name: "Free",
    nameAz: "Pulsuz",
    priceAzn: 0,
    durationDays: 30,
    priorityMultiplier: 1,
    isHighlighted: false,
    featuredInHome: false,
    maxImages: 8,
    maxImageSizeKb: 10240,     // 10 MB giriş — sıxılmadan sonra ~800 KB
    storageMb: 6,
    videoEnabled: false,
    maxVideos: 0,
    maxVideoSizeMb: 0,
    renewGracePeriodDays: 7
  },
  {
    id: "standard",
    name: "Standard",
    nameAz: "Standart",
    priceAzn: 9,
    durationDays: 60,
    priorityMultiplier: 2,
    isHighlighted: true,
    featuredInHome: false,
    maxImages: 20,
    maxImageSizeKb: 20480,     // 20 MB giriş — sıxılmadan sonra ~2 MB
    storageMb: 40,
    videoEnabled: true,
    maxVideos: 1,
    maxVideoSizeMb: 50,
    renewGracePeriodDays: 14
  },
  {
    id: "vip",
    name: "VIP",
    nameAz: "VIP",
    priceAzn: 19,
    durationDays: 90,
    priorityMultiplier: 4,
    isHighlighted: true,
    featuredInHome: true,
    maxImages: 40,
    maxImageSizeKb: 30720,     // 30 MB giriş — RAW/HEIC fayllar da qəbul olunur
    storageMb: 200,
    videoEnabled: true,
    maxVideos: 3,
    maxVideoSizeMb: 100,
    renewGracePeriodDays: 30
  }
];

export function getPlanById(id: PlanType): ListingPlan | undefined {
  return LISTING_PLANS.find((p) => p.id === id);
}

export function isPaidPlan(planType: PlanType): boolean {
  return planType !== "free";
}

export function calculatePlanExpiry(planType: PlanType): Date {
  const plan = getPlanById(planType);
  const days = plan?.durationDays ?? 30;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Şəkil faylının plan limitinə uyğun olub-olmadığını yoxlayır.
 * Browser-da upload başlamadan əvvəl çağırılır (sıxılmadan əvvəl ölçü yoxlaması).
 */
export function validateImageForPlan(
  planType: PlanType,
  currentCount: number,
  fileSizeBytes: number
): { ok: boolean; error?: string } {
  const plan = getPlanById(planType);
  if (!plan) return { ok: false, error: "Plan tapılmadı" };

  if (currentCount >= plan.maxImages) {
    return {
      ok: false,
      error: `Bu plan üçün maksimum ${plan.maxImages} şəkil əlavə etmək olar`
    };
  }

  const maxBytes = plan.maxImageSizeKb * 1024;
  if (fileSizeBytes > maxBytes) {
    const maxMb = (plan.maxImageSizeKb / 1024).toFixed(0);
    return {
      ok: false,
      error: `Seçilmiş fayl ${maxMb} MB limitini keçir. Daha kiçik fayl seçin.`
    };
  }

  return { ok: true };
}

/** Planın ümumi saxlama həcmi limiti (bytes) */
export function getPlanStorageLimitBytes(planType: PlanType): number {
  const plan = getPlanById(planType);
  return (plan?.storageMb ?? 6) * 1024 * 1024;
}

/**
 * Plan müddəti + lütf müddəti keçibsə arxivləmə lazımdır.
 */
export function shouldArchiveListing(
  planExpiresAt: string | Date,
  planType: PlanType
): boolean {
  const plan = getPlanById(planType);
  const grace = plan?.renewGracePeriodDays ?? 7;
  const expiry = new Date(planExpiresAt);
  const archiveAt = new Date(expiry);
  archiveAt.setDate(archiveAt.getDate() + grace);
  return new Date() > archiveAt;
}

/** Elanın neçə gün qaldığını qaytarır (mənfi = müddəti keçib) */
export function daysRemaining(planExpiresAt: string | Date): number {
  const expiry = new Date(planExpiresAt);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────────────────────────────────────────
// Dinamik qiymət cədvəli (avtomobil qiymətinə görə)
// Turbo.az modelindən ilham alınıb: qiymət nə qədər yüksəkdirsə,
// elan haqqı da bir az yüksəkdir — hər iki tərəf üçün ədalətli model.
// ─────────────────────────────────────────────────────────────────────────────

export interface PricingTier {
  /** Minimum avtomobil qiyməti (₼) — daxil */
  minPriceAzn: number;
  /** Maksimum avtomobil qiyməti (₼) — daxil. null = yuxarı limit yoxdur */
  maxPriceAzn: number | null;
  labelAz: string;
  /** Standart plan üçün ödəniş (₼) */
  standardPriceAzn: number;
  /** VIP plan üçün ödəniş (₼) */
  vipPriceAzn: number;
}

/**
 * Fərdi satıcı üçün avtomobil satış qiymətinə görə elan haqqı cədvəli.
 *
 * Niyə dinamik qiymət?
 *   • Ucuz avtomobil satan satıcıya yüksək elan haqqı ƏDALƏTSIZDIR.
 *   • Baha avtomobil satan satıcı daha çox şəkil, uzun müddət, prioritet istəyir
 *     — buna uyğun qiymət ŞƏFFAFDIR.
 *   • Pulsuz (Free) plan bu cədvəldən kənardır — həmişə 0 ₼.
 */
export const PRICING_TIERS: PricingTier[] = [
  {
    minPriceAzn: 0,
    maxPriceAzn: 5000,
    labelAz: "0 — 5 000 ₼",
    standardPriceAzn: 5,
    vipPriceAzn: 10
  },
  {
    minPriceAzn: 5001,
    maxPriceAzn: 15000,
    labelAz: "5 001 — 15 000 ₼",
    standardPriceAzn: 9,
    vipPriceAzn: 19
  },
  {
    minPriceAzn: 15001,
    maxPriceAzn: 30000,
    labelAz: "15 001 — 30 000 ₼",
    standardPriceAzn: 14,
    vipPriceAzn: 27
  },
  {
    minPriceAzn: 30001,
    maxPriceAzn: 60000,
    labelAz: "30 001 — 60 000 ₼",
    standardPriceAzn: 19,
    vipPriceAzn: 35
  },
  {
    minPriceAzn: 60001,
    maxPriceAzn: null,
    labelAz: "60 001 ₼ və yuxarı",
    standardPriceAzn: 25,
    vipPriceAzn: 45
  }
];

/**
 * Avtomobil satış qiymətinə görə düzgün qiymət dilimini qaytarır.
 * Pulsuz plan üçün istifadə olunmur — həmişə 0 ₼.
 */
export function getPricingTierForVehicle(vehiclePriceAzn: number): PricingTier {
  return (
    PRICING_TIERS.find(
      (t) =>
        vehiclePriceAzn >= t.minPriceAzn &&
        (t.maxPriceAzn === null || vehiclePriceAzn <= t.maxPriceAzn)
    ) ?? PRICING_TIERS[PRICING_TIERS.length - 1]
  );
}

/**
 * Müəyyən plan tipi və avtomobil qiyməti üçün ödənişi hesablayır.
 * Pulsuz plan həmişə 0 ₼ qaytarır.
 */
export function calculateListingFee(
  planType: PlanType,
  vehiclePriceAzn: number
): number {
  if (planType === "free") return 0;
  const tier = getPricingTierForVehicle(vehiclePriceAzn);
  return planType === "standard" ? tier.standardPriceAzn : tier.vipPriceAzn;
}
