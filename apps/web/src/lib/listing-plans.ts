/**
 * EkoMobil — Elan Qiymət Planları və Yaddaş Limitləri
 *
 * Referans: Turbo.az, OLX, mobile.de plan strukturları
 * Şəkil sıxılması: JPEG 85%, max 1280px — front-end tərəfindən tətbiq olunur.
 * Saxlama: Vercel Blob (yaxud S3-uyğun xidmət)
 */

export type PlanType = "free" | "standard" | "vip";

export interface ListingPlan {
  id: PlanType;
  name: string;
  nameAz: string;
  priceAzn: number;
  /** Elanın aktiv qalacağı gün sayı */
  durationDays: number;
  priorityMultiplier: number;
  isHighlighted: boolean;
  featuredInHome: boolean;
  /** Maksimum şəkil sayı */
  maxImages: number;
  /** Hər şəkil üçün maksimum fayl ölçüsü (KB) */
  maxImageSizeKb: number;
  /** Bir elan üçün ümumi şəkil saxlama həcmi (MB) */
  storageMb: number;
  /** Video yükləmə imkanı */
  videoEnabled: boolean;
  /** Maksimum video sayı */
  maxVideos: number;
  /** Hər video üçün maksimum ölçü (MB) */
  maxVideoSizeMb: number;
  /** Elanın yenidən aktivləşdirilə biləcəyi gün sayı (müddəti bitdikdən sonra) */
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
    maxImageSizeKb: 800,        // 800 KB/şəkil
    storageMb: 6,               // ~6 MB ümumi
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
    durationDays: 60,           // 60 gün (pulsuzdan 2x)
    priorityMultiplier: 2,
    isHighlighted: true,
    featuredInHome: false,
    maxImages: 20,
    maxImageSizeKb: 2048,       // 2 MB/şəkil
    storageMb: 40,              // ~40 MB ümumi
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
    durationDays: 90,           // 90 gün
    priorityMultiplier: 4,
    isHighlighted: true,
    featuredInHome: true,
    maxImages: 40,
    maxImageSizeKb: 5120,       // 5 MB/şəkil (yüksək keyfiyyət)
    storageMb: 200,             // ~200 MB ümumi
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
 * Front-end validasiyası — upload başlamadan əvvəl çağırılır.
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
      error: `Bu plan üçün maksimum ${plan.maxImages} şəkil yükləmək olar`
    };
  }

  const maxBytes = plan.maxImageSizeKb * 1024;
  if (fileSizeBytes > maxBytes) {
    const maxMb = (plan.maxImageSizeKb / 1024).toFixed(1);
    return {
      ok: false,
      error: `Şəkil ölçüsü ${maxMb} MB-dan böyük ola bilməz (bu plan üçün)`
    };
  }

  return { ok: true };
}

/**
 * Planın ümumi saxlama həcmi limiti (bytes)
 */
export function getPlanStorageLimitBytes(planType: PlanType): number {
  const plan = getPlanById(planType);
  return (plan?.storageMb ?? 6) * 1024 * 1024;
}

/**
 * Plan müddəti bitdikdən sonra "lütf müddəti" keçibsə arxivlənmə lazımdır
 */
export function shouldArchiveListing(planExpiresAt: string | Date, planType: PlanType): boolean {
  const plan = getPlanById(planType);
  const grace = plan?.renewGracePeriodDays ?? 7;
  const expiry = new Date(planExpiresAt);
  const archiveAt = new Date(expiry);
  archiveAt.setDate(archiveAt.getDate() + grace);
  return new Date() > archiveAt;
}

/**
 * Elanın neçə gün qaldığını qaytarır (mənfi = müddəti keçib)
 */
export function daysRemaining(planExpiresAt: string | Date): number {
  const expiry = new Date(planExpiresAt);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
