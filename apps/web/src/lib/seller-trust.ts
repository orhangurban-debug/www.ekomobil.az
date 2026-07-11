/**
 * Seller trust badge system.
 *
 * Trust signals are additive — each one earns a badge and raises the overall
 * score. None of them are hard gates; they simply increase seller credibility
 * and visibility.
 */

export type TrustBadgeKey =
  | "phone_verified"       // confirmed phone number
  | "email_verified"       // confirmed email
  | "identity_verified"    // deep KYC approved
  | "registered_business"  // VÖEN provided (dealer / store)
  | "dealer_verified"      // admin manually verified dealer
  | "active_subscriber"    // has active plan (salon / store)
  | "profile_complete"     // avatar + bio + city all filled
  | "experienced"          // member for 90+ days with active listings

export interface TrustBadge {
  key: TrustBadgeKey;
  label: string;
  icon: string;
  /** Short description shown on hover / in completeness panel */
  description: string;
  /** Weight used for overall score (0-100 scale) */
  weight: number;
}

const BADGE_META: Record<TrustBadgeKey, Omit<TrustBadge, "key">> = {
  phone_verified:      { label: "Telefon",           icon: "📱", description: "Telefon nömrəsi əlavə edilib",                weight: 10 },
  email_verified:      { label: "E-poçt",             icon: "📧", description: "E-poçt ünvanı təsdiqlənib",                 weight: 8  },
  identity_verified:   { label: "Şəxsiyyət",          icon: "🪪", description: "Dərin şəxsiyyət yoxlaması keçirilib",       weight: 25 },
  registered_business: { label: "Qeydiyyatlı biznes", icon: "🏢", description: "VÖEN ilə qeydiyyatlı şirkət",              weight: 20 },
  dealer_verified:     { label: "Rəsmi salon",         icon: "✅", description: "EkoMobil tərəfindən yoxlanılmış salon",    weight: 20 },
  active_subscriber:   { label: "Aktiv plan",          icon: "⭐", description: "Aktiv salon və ya mağaza planı var",       weight: 10 },
  profile_complete:    { label: "Profil dolu",         icon: "👤", description: "Şəkil, şəhər, ad doldurulub",             weight: 7  },
  experienced:         { label: "Təcrübəli",           icon: "🏅", description: "90+ gün fəaliyyət + aktiv elan",          weight: 10 },
};

export function getBadge(key: TrustBadgeKey): TrustBadge {
  return { key, ...BADGE_META[key] };
}

export interface SellerTrustInput {
  /** users table */
  phoneSet?: boolean;
  emailVerified?: boolean;
  memberSince?: string; // ISO date

  /** deepKyc */
  kycApproved?: boolean;

  /** dealer_profiles */
  dealerVerified?: boolean;
  dealerVoen?: string | null;

  /** business subscriptions */
  hasSalonPlan?: boolean;
  hasStorePlan?: boolean;

  /** user_profiles completeness */
  hasAvatar?: boolean;
  hasCity?: boolean;
  hasName?: boolean;

  /** listing activity */
  activeListingCount?: number;
}

/** Compute earned trust badges from available seller data */
export function computeTrustBadges(input: SellerTrustInput): TrustBadge[] {
  const badges: TrustBadge[] = [];

  if (input.phoneSet)                                           badges.push(getBadge("phone_verified"));
  if (input.emailVerified)                                      badges.push(getBadge("email_verified"));
  if (input.kycApproved)                                        badges.push(getBadge("identity_verified"));
  if (input.dealerVoen?.trim())                                 badges.push(getBadge("registered_business"));
  if (input.dealerVerified)                                     badges.push(getBadge("dealer_verified"));
  if (input.hasSalonPlan || input.hasStorePlan)                 badges.push(getBadge("active_subscriber"));
  if (input.hasAvatar && input.hasCity && input.hasName)        badges.push(getBadge("profile_complete"));

  if (
    input.memberSince &&
    (Date.now() - new Date(input.memberSince).getTime()) > 90 * 86400000 &&
    (input.activeListingCount ?? 0) > 0
  ) {
    badges.push(getBadge("experienced"));
  }

  return badges;
}

/** Overall trust score 0-100 */
export function computeTrustScore(badges: TrustBadge[]): number {
  const total = badges.reduce((sum, b) => sum + b.weight, 0);
  return Math.min(100, total);
}

/** Human-readable tier label */
export function trustTierLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "Yüksək etibar",  color: "emerald" };
  if (score >= 40) return { label: "Orta etibar",    color: "amber"   };
  return              { label: "Başlanğıc",           color: "slate"   };
}

/** Items the seller can still add to improve their trust score */
export function missingTrustItems(
  badges: TrustBadge[],
  input: SellerTrustInput
): { label: string; href: string; icon: string }[] {
  const earned = new Set(badges.map((b) => b.key));
  const items: { label: string; href: string; icon: string }[] = [];

  if (!earned.has("phone_verified"))
    items.push({ icon: "📱", label: "Telefon nömrəsi əlavə et",        href: "/me#profile" });
  if (!earned.has("identity_verified"))
    items.push({ icon: "🪪", label: "Şəxsiyyəti təsdiqlə (KYC)",       href: "/me/kyc"    });
  if (!earned.has("registered_business") && (input.hasSalonPlan || input.hasStorePlan))
    items.push({ icon: "🏢", label: "VÖEN əlavə et (qeydiyyatlı biznes)", href: "/me#profile" });
  if (!earned.has("profile_complete"))
    items.push({ icon: "👤", label: "Profili tamamla (şəkil, şəhər)",  href: "/me#profile" });
  if (!earned.has("active_subscriber"))
    items.push({ icon: "⭐", label: "Salon və ya mağaza planı aktiv et", href: "/pricing#dealer" });

  return items;
}
