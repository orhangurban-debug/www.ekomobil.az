/**
 * EkoMobil — Elan Qiymət Planları və Yaddaş Limitləri
 *
 * ── Qiymətləndirmə modeli ────────────────────────────────────────────────
 *
 * İSTİFADƏÇİ (fərdi satıcı):
 *   • Hər elan ayrıca plan seçir: Pulsuz / Standart / VIP.
 *   • Eyni anda yalnız 1 aktiv və ya yoxlamada olan PULSUZ elanı ola bilər.
 *     İkinci pulsuz elan yerləşdirmək üçün birinci elanın müddəti bitməlidir
 *     və ya Standart/VIP plana yüksəlməlidir.
 *   • Ödənişli planlar (Standart/VIP) isə limitsiz sayda eyni vaxtda aktiv
 *     ola bilər — hər biri ayrıca ödənir.
 *   • Aktivlik müddətləri: Pulsuz 30 gün · Standart 60 gün · VIP 90 gün
 *     (lütf müddəti bitdikdən sonra arxiv).
 *
 * SALON (dealer) — ayrıca DEALER_PLANS abunəliyi var:
 *   • Aylıq sabit abunə → N aktiv elan hüququ (slot).
 *   • Elan başına şəkil limiti abunə paketindən gəlir (Əsas 15, Peşəkar 20, Korporativ 25).
 *   • Minimum 3 şəkil + ana şəkil istiqaməti; digər rakurslar tövsiyədir.
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
 * Eyni anda bir istifadəçinin sahib ola biləcəyi maksimum PULSUZ aktiv/yoxlamada elan sayı.
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

/**
 * Şəkil sayı prinsipləri (reallığa əsaslanan):
 *
 * Bir avtomobil üçün REAL fotoçəkim planı:
 *   Xarici (4 bucaqdan + ön + arxa)           → 6 şəkil
 *   Daxili (tabló, sükan, ön oturacaqlar,
 *           arxa oturacaqlar, baqaj)           → 5 şəkil
 *   Texniki (mühərrik, caqul/disk, odometr)   → 3 şəkil
 *   Əlavə detallar (çatlaq, cızmaq, xüsusi
 *           avadanlıq)                        → 2-4 şəkil
 *   CƏMI: 16-18 "mükəmməl" şəkil. 20 üst hədd.
 *
 * 40 şəkil = axtarış motorlarının robotları üçün yaxşı, alıcı üçün qeyri-mütənasib.
 * 3+ video = tək bir köhnə avtomobil üçün heç vaxt lazım deyil.
 *
 * Video sayı prinsipləri:
 *   1 video = walk-around (1-2 dəq) → alıcı üçün kifayətdir.
 *   2+ video = yalnız premium/ekzotik avtomobillər üçün məntiqlidir.
 */
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
    maxImages: 15,
    maxImageSizeKb: 10240,     // 10 MB giriş → ~800 KB çıxış
    storageMb: 15,
    videoEnabled: false,
    maxVideos: 0,
    maxVideoSizeMb: 0,
    renewGracePeriodDays: 7
  },
  {
    id: "standard",
    name: "Standard",
    nameAz: "Standart",
    /** Fallback minimum; real ödəniş calculateListingFee() ilə hesablanır. */
    priceAzn: 4,
    durationDays: 60,
    priorityMultiplier: 2,
    isHighlighted: true,
    featuredInHome: false,
    maxImages: 15,
    maxImageSizeKb: 20480,     // 20 MB giriş → ~1.5 MB çıxış
    storageMb: 25,             // 15 şəkil × ~1.5 MB ≈ 22 MB + ehtiyat
    videoEnabled: true,
    maxVideos: 1,
    maxVideoSizeMb: 50,
    renewGracePeriodDays: 14
  },
  {
    id: "vip",
    name: "VIP",
    nameAz: "VIP",
    /** Fallback minimum; real ödəniş calculateListingFee() ilə hesablanır. */
    priceAzn: 8,
    durationDays: 90,
    priorityMultiplier: 4,
    isHighlighted: true,
    featuredInHome: true,
    maxImages: 20,             // 40→20: 20 şəkil əsl peşəkar fotoçəkim üçün tam kifayətdir
    maxImageSizeKb: 30720,     // 30 MB giriş — HEIC/RAW fayllar da qəbul olunur
    storageMb: 40,             // 20 şəkil × ~1.8 MB + 1 video ≈ 36 MB + ehtiyat
    videoEnabled: true,
    maxVideos: 1,              // 3→1: walk-around video hər avtomobil üçün kifayətdir
    maxVideoSizeMb: 200,       // Daha uzun/keyfiyyətli video üçün yer var
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

/** Elan yayımlanarkən şəkil sayının plan limitinə uyğunluğu */
export function validateListingImageCount(
  planType: PlanType,
  imageCount: number
): { ok: boolean; error?: string } {
  const plan = getPlanById(planType);
  if (!plan) return { ok: false, error: "Plan tapılmadı" };

  if (imageCount > plan.maxImages) {
    return {
      ok: false,
      error: `«${plan.nameAz}» planı üçün maksimum ${plan.maxImages} şəkil əlavə etmək olar.`
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

export type PlanExpiryDisplayState = "active" | "expiring_soon" | "expired";

export interface PlanExpiryDisplay {
  state: PlanExpiryDisplayState;
  daysLeft: number;
  durationDays: number;
  progressPercent: number;
  expiresLabel: string;
}

/** Aktiv elanlar üçün plan müddəti sayğacı (yalnız plan_expires_at olduqda). */
export function getPlanExpiryDisplay(
  planExpiresAt: string | Date,
  planType: PlanType
): PlanExpiryDisplay {
  const plan = getPlanById(planType);
  const durationDays = plan?.durationDays ?? 30;
  const expiry = new Date(planExpiresAt);
  const start = new Date(expiry);
  start.setDate(start.getDate() - durationDays);

  const now = Date.now();
  const totalMs = Math.max(expiry.getTime() - start.getTime(), 1);
  const elapsedMs = Math.min(Math.max(now - start.getTime(), 0), totalMs);
  const progressPercent = Math.round((elapsedMs / totalMs) * 100);
  const daysLeft = daysRemaining(planExpiresAt);

  const expiresLabel = expiry.toLocaleDateString("az-AZ", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  let state: PlanExpiryDisplayState = "active";
  if (daysLeft <= 0) {
    state = "expired";
  } else if (daysLeft <= 3) {
    state = "expiring_soon";
  }

  return { state, daysLeft, durationDays, progressPercent, expiresLabel };
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
/**
 * Rəqib müqayisəsi:
 *   Turbo.az fərdi elan haqqı: ~8–30 ₼ (vahid qiymət, plan ayrımı yoxdur).
 *   EkoMobil Standart hər zaman Turbo.az-dan AŞAĞI qalır.
 *   EkoMobil VIP Turbo.az-ın maksimumunu keçmir (30 ₼ üst hədd).
 *
 * Rentabellik:
 *   Standart planın minimum gəlir həddi ~4 ₼-dır (hosting + CDN + moderasiya xərci).
 *   VIP planın minimum gəlir həddi ~7 ₼-dır (əlavə öncelik + analytics + story storage).
 */
export const PRICING_TIERS: PricingTier[] = [
  {
    minPriceAzn: 0,
    maxPriceAzn: 5000,
    labelAz: "0 — 5 000 ₼",
    standardPriceAzn: 4,
    vipPriceAzn: 8
  },
  {
    minPriceAzn: 5001,
    maxPriceAzn: 15000,
    labelAz: "5 001 — 15 000 ₼",
    standardPriceAzn: 7,
    vipPriceAzn: 14
  },
  {
    minPriceAzn: 15001,
    maxPriceAzn: 30000,
    labelAz: "15 001 — 30 000 ₼",
    standardPriceAzn: 10,
    vipPriceAzn: 19
  },
  {
    minPriceAzn: 30001,
    maxPriceAzn: 60000,
    labelAz: "30 001 — 60 000 ₼",
    standardPriceAzn: 14,
    vipPriceAzn: 24
  },
  {
    minPriceAzn: 60001,
    maxPriceAzn: null,
    labelAz: "60 001 ₼ və yuxarı",
    standardPriceAzn: 19,
    vipPriceAzn: 30
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

/** UI və ödəniş öncəsi göstərim üçün plan haqqı mətni. */
export function formatListingPlanPrice(planType: PlanType, itemPriceAzn?: number): string {
  if (planType === "free") return "Pulsuz";
  if (itemPriceAzn && itemPriceAzn > 0) {
    return `${calculateListingFee(planType, itemPriceAzn)} ₼`;
  }
  const plan = getPlanById(planType);
  return `${plan?.priceAzn ?? 0} ₼-dən`;
}

export function listingPlanMinFee(planType: PlanType): number {
  if (planType === "free") return 0;
  const plan = getPlanById(planType);
  return plan?.priceAzn ?? 0;
}

export function listingPlanMaxFee(planType: PlanType): number {
  if (planType === "free") return 0;
  const lastTier = PRICING_TIERS[PRICING_TIERS.length - 1];
  return planType === "standard" ? lastTier.standardPriceAzn : lastTier.vipPriceAzn;
}

/** Qiymət aralığı (pricing səhifəsi və plan kartları üçün). */
export function formatListingPlanPriceRange(planType: PlanType): string {
  if (planType === "free") return "Pulsuz";
  return `${listingPlanMinFee(planType)}–${listingPlanMaxFee(planType)} ₼`;
}

export function getListingPlanDurationDays(planType: PlanType): number {
  return getPlanById(planType)?.durationDays ?? 30;
}

export function formatListingPlanDuration(planType: PlanType): string {
  return `${getListingPlanDurationDays(planType)} gün aktiv`;
}
