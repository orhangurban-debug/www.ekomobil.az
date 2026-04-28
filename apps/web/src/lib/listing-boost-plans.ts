/**
 * EkoMobil — Elan Boost (İrəlilətmə) Xidmətləri
 *
 * Turbo.az təcrübəsinə əsaslanır: boost elan planından AYRIDA satılır.
 * İstifadəçi istənilən planlı elanına boost əlavə edə bilər.
 *
 * ── Xidmət növləri ──────────────────────────────────────────────────────
 *  1. "İrəli çək"  — elanı ən yeni kimi göstərir, birdəfəlik/çoxdəfəlik
 *  2. "VIP"        — axtarış nəticəsinin VIP blokunda görünür
 *  3. "Premium"    — ana səhifənin Premium blokunda görünür (ən güclü)
 *
 * Hər boost növünün öz müddəti və bonusları var.
 */

export type BoostType = "bump" | "vip" | "premium";

export interface BoostPackage {
  id: string;
  type: BoostType;
  nameAz: string;
  descriptionAz: string;
  priceAzn: number;
  /** Xidmətin aktiv qalacağı gün sayı (null = birdəfəlik) */
  durationDays: number | null;
  /** Elanın gündə neçə dəfə irəli çəkiləcəyi */
  bumpsPerDay: number;
  /** Bu xidmətə daxil olan bonus xidmətlər */
  includedBonuses: string[];
  isPopular?: boolean;
}

export const BUMP_PACKAGES: BoostPackage[] = [
  {
    id: "bump-1",
    type: "bump",
    nameAz: "1 dəfə irəli çək",
    descriptionAz: "Elanı ən yeni kimi göstərir, bütün pulsuz elanlardan yuxarıya qaldırır.",
    priceAzn: 2,
    durationDays: null,
    bumpsPerDay: 0,
    includedBonuses: []
  },
  {
    id: "bump-3",
    type: "bump",
    nameAz: "3 dəfə irəli çək",
    descriptionAz: "24 saatda 1 dəfə olmaqla, 3 gün avtomatik irəli çəkilir.",
    priceAzn: 5,
    durationDays: 3,
    bumpsPerDay: 1,
    includedBonuses: []
  },
  {
    id: "bump-5",
    type: "bump",
    nameAz: "5 dəfə irəli çək",
    descriptionAz: "24 saatda 1 dəfə olmaqla, 5 gün avtomatik irəli çəkilir.",
    priceAzn: 8,
    durationDays: 5,
    bumpsPerDay: 1,
    includedBonuses: [],
    isPopular: true
  },
  {
    id: "bump-10",
    type: "bump",
    nameAz: "10 dəfə irəli çək",
    descriptionAz: "24 saatda 1 dəfə olmaqla, 10 gün avtomatik irəli çəkilir.",
    priceAzn: 12,
    durationDays: 10,
    bumpsPerDay: 1,
    includedBonuses: []
  }
];

export const VIP_PACKAGES: BoostPackage[] = [
  {
    id: "vip-1",
    type: "vip",
    nameAz: "VIP — 1 gün",
    descriptionAz: "Axtarış nəticəsinin yuxarısındakı VIP blokunda görünür. Kart üzərində 'V' işarəsi.",
    priceAzn: 4,
    durationDays: 1,
    bumpsPerDay: 2,
    includedBonuses: ["Gündə 2 dəfə irəli çək (8 saatdan bir)"]
  },
  {
    id: "vip-5",
    type: "vip",
    nameAz: "VIP — 5 gün",
    descriptionAz: "5 gün VIP blokda görünür.",
    priceAzn: 13,
    durationDays: 5,
    bumpsPerDay: 1,
    includedBonuses: ["Hər gün 1 dəfə irəli çək"],
    isPopular: true
  },
  {
    id: "vip-15",
    type: "vip",
    nameAz: "VIP — 15 gün",
    descriptionAz: "15 gün VIP blokda görünür.",
    priceAzn: 22,
    durationDays: 15,
    bumpsPerDay: 1,
    includedBonuses: ["Hər gün 1 dəfə irəli çək"]
  },
  {
    id: "vip-30",
    type: "vip",
    nameAz: "VIP — 30 gün",
    descriptionAz: "30 gün tam VIP blok — bütün elan müddəti boyunca üstün mövqe.",
    priceAzn: 36,
    durationDays: 30,
    bumpsPerDay: 1,
    includedBonuses: ["Hər gün 1 dəfə irəli çək"]
  }
];

export const PREMIUM_PACKAGES: BoostPackage[] = [
  {
    id: "premium-1",
    type: "premium",
    nameAz: "Premium — 1 gün",
    descriptionAz: "Ana səhifənin Premium blokunda görünür. Kart üzərində tac işarəsi.",
    priceAzn: 6,
    durationDays: 1,
    bumpsPerDay: 3,
    includedBonuses: ["Gündə 3 dəfə irəli çək (8 saatdan bir)", "VIP 1 gün daxildir"]
  },
  {
    id: "premium-5",
    type: "premium",
    nameAz: "Premium — 5 gün",
    descriptionAz: "5 gün ana səhifə Premium blokunda.",
    priceAzn: 17,
    durationDays: 5,
    bumpsPerDay: 1,
    includedBonuses: ["Hər gün 1 dəfə irəli çək", "VIP 5 gün daxildir"],
    isPopular: true
  },
  {
    id: "premium-15",
    type: "premium",
    nameAz: "Premium — 15 gün",
    descriptionAz: "15 gün ana səhifədə və axtarışda ən yüksək mövqe.",
    priceAzn: 38,
    durationDays: 15,
    bumpsPerDay: 1,
    includedBonuses: ["Hər gün 1 dəfə irəli çək", "VIP 15 gün daxildir"]
  },
  {
    id: "premium-30",
    type: "premium",
    nameAz: "Premium — 30 gün",
    descriptionAz: "30 gün ana səhifə + VIP + irəli çək — tam elan müddəti boyunca maksimum mövqe.",
    priceAzn: 55,
    durationDays: 30,
    bumpsPerDay: 1,
    includedBonuses: ["Hər gün 1 dəfə irəli çək", "VIP 30 gün daxildir"]
  }
];

export const ALL_BOOST_PACKAGES = [
  ...BUMP_PACKAGES,
  ...VIP_PACKAGES,
  ...PREMIUM_PACKAGES
];

/** Boost növünün Azərbaycan dilindəki adı */
export function getBoostTypeName(type: BoostType): string {
  return { bump: "İrəli çək", vip: "VIP", premium: "Premium" }[type];
}

/** Boost növünün rəng sxemi (Tailwind classları) */
export function getBoostTypeColor(type: BoostType): {
  bg: string;
  text: string;
  border: string;
} {
  return {
    bump: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
    vip: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300" },
    premium: { bg: "bg-[#0891B2]/10", text: "text-[#0891B2]", border: "border-[#0891B2]/30" }
  }[type];
}
