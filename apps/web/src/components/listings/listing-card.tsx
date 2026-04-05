import Link from "next/link";
import Image from "next/image";
import { AddToCompareButton } from "@/components/compare/add-to-compare-button";
import { FavoriteButton } from "@/components/user/favorite-button";

export interface ListingCardData {
  id: string;
  title: string;
  priceAzn: number;
  city: string;
  year: number;
  mileageKm: number;
  fuelType: string;
  transmission: string;
  imageUrl?: string;
  trustScore: number;
  vinVerified: boolean;
  sellerVerified: boolean;
  mediaComplete: boolean;
  mileageFlagSeverity?: "info" | "warning" | "high_risk";
  priceInsight?: "below_market" | "market_rate" | "above_market";
  planType?: "free" | "standard" | "vip";
  listingKind?: "vehicle" | "part";
  partCategory?: string;
  partBrand?: string;
  partCondition?: "new" | "used" | "refurbished";
  partQuantity?: number;
  partOemCode?: string;
  partSku?: string;
}

// Marka adına görə gradient xəritəsi
const MAKE_GRADIENTS: Record<string, [string, string]> = {
  toyota:       ["#EB0A1E", "#C40012"],
  lexus:        ["#1A1A1A", "#2D2D2D"],
  bmw:          ["#0066CC", "#004999"],
  "mercedes-benz": ["#1C1C1C", "#222"],
  mercedes:     ["#1C1C1C", "#222"],
  hyundai:      ["#002C5F", "#003575"],
  kia:          ["#BB162B", "#9A1123"],
  volkswagen:   ["#001E50", "#00214F"],
  audi:         ["#BB0A14", "#990A12"],
  honda:        ["#CC0000", "#AA0000"],
  nissan:       ["#C3002F", "#A00028"],
  chevrolet:    ["#D4A017", "#B8890F"],
  ford:         ["#003087", "#002566"],
  subaru:       ["#003399", "#002277"],
  mazda:        ["#910000", "#780000"],
  porsche:      ["#A50034", "#8A002C"],
  "land rover": ["#006A4E", "#005040"],
  jeep:         ["#2C5F2E", "#1F4220"],
  volvo:        ["#003057", "#002244"],
  renault:      ["#EFDF00", "#D4C600"],
  peugeot:      ["#0051A5", "#003F80"],
  skoda:        ["#4BA82E", "#3A8324"],
  mitsubishi:   ["#E0001B", "#C00017"],
  tesla:        ["#CC0000", "#AA0000"],
  infiniti:     ["#1A1A1A", "#333"],
  lada:         ["#003087", "#002566"],
};

function getGradient(title: string): [string, string] {
  const lower = title.toLowerCase();
  for (const [key, gradient] of Object.entries(MAKE_GRADIENTS)) {
    if (lower.startsWith(key) || lower.includes(` ${key} `)) return gradient;
  }
  return ["#475569", "#334155"]; // default slate
}

function CarPlaceholder({ title, year, fuelType }: { title: string; year: number; fuelType: string }) {
  const [from, to] = getGradient(title);
  const makeWord = title.split(" ")[0];
  const modelWord = title.split(" ")[1] ?? "";
  const isElectric = fuelType.toLowerCase().includes("elektrik") || fuelType.toLowerCase().includes("hibrid");

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2"
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      {/* Make + model initials badge */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
          <span className="text-xl font-black tracking-tight text-white/90 drop-shadow">
            {makeWord.slice(0, 1)}{modelWord.slice(0, 1) || makeWord.slice(1, 2)}
          </span>
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">{makeWord}</p>
          {modelWord && <p className="text-[10px] text-white/50">{modelWord}</p>}
        </div>
      </div>
      {/* year + fuel pills */}
      <div className="flex items-center gap-1.5">
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/60">
          {year}
        </span>
        {isElectric && (
          <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
            ⚡
          </span>
        )}
      </div>
    </div>
  );
}

function TrustRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "#16a34a" :
    score >= 60 ? "#d97706" : "#dc2626";
  const bg =
    score >= 80 ? "bg-emerald-500" :
    score >= 60 ? "bg-amber-500" : "bg-red-500";

  return (
    <div
      className={`absolute top-3 right-3 flex h-9 w-9 flex-col items-center justify-center rounded-full ${bg} shadow-lg ring-2 ring-white/40`}
      title={`Etibar xalı: ${score}/100`}
    >
      <span className="text-[11px] font-bold leading-none text-white">{score}</span>
    </div>
  );
}

function DealBadge({ insight }: { insight: ListingCardData["priceInsight"] }) {
  if (!insight || insight === "market_rate") return null;
  if (insight === "below_market") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        Bazar altı
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 shadow-sm">
      Bazar üstü
    </span>
  );
}

function PlanRibbon({ planType }: { planType?: "free" | "standard" | "vip" }) {
  if (!planType || planType === "free") return null;
  if (planType === "vip") {
    return (
      <div className="absolute left-0 top-4 flex items-center gap-1 rounded-r-full bg-gradient-to-r from-amber-500 to-yellow-400 pl-3 pr-3 py-1 text-[11px] font-bold text-amber-900 shadow">
        ★ VIP
      </div>
    );
  }
  return (
    <div className="absolute left-0 top-4 flex items-center gap-1 rounded-r-full bg-[#0891B2] pl-3 pr-3 py-1 text-[11px] font-bold text-white shadow">
      ↑ Standart
    </div>
  );
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const isPromoted = listing.planType === "vip" || listing.planType === "standard";
  const isPart = listing.listingKind === "part";
  const partConditionLabel =
    listing.partCondition === "new"
      ? "Yeni"
      : listing.partCondition === "used"
        ? "İşlənmiş"
        : listing.partCondition === "refurbished"
          ? "Bərpa olunmuş"
          : null;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl bg-white border transition duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
        isPromoted
          ? "border-[#0891B2]/30 shadow-[0_0_0_1px_rgba(8,145,178,0.15),0_2px_12px_rgba(8,145,178,0.1)]"
          : "border-slate-200 shadow-sm hover:border-slate-300"
      }`}
    >
      {/* Image — 16:9 aspect ratio */}
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <CarPlaceholder title={listing.title} year={listing.year} fuelType={listing.fuelType} />
        )}

        <TrustRing score={listing.trustScore} />

        <div className="absolute top-3 left-3">
          <FavoriteButton listingId={listing.id} />
        </div>

        <PlanRibbon planType={listing.planType} />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title + price */}
        <div>
          <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-[#0891B2] transition-colors">
            {listing.title}
          </h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#0891B2]">
              {listing.priceAzn.toLocaleString("az-AZ")} ₼
            </span>
            <DealBadge insight={listing.priceInsight} />
          </div>
        </div>

        {/* Specs row */}
        {isPart ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {listing.partCategory && <span className="badge-neutral">{listing.partCategory}</span>}
            {listing.partBrand && <span>{listing.partBrand}</span>}
            {partConditionLabel && <span>{partConditionLabel}</span>}
            {listing.partQuantity !== undefined && (
              <span className={listing.partQuantity > 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                {listing.partQuantity > 0 ? `Stok: ${listing.partQuantity}` : "Stokda yoxdur"}
              </span>
            )}
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {listing.city}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {listing.year}
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {(listing.mileageKm / 1000).toFixed(0)}k km
            </span>
            <span>{listing.fuelType}</span>
            <span>{listing.transmission}</span>
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {listing.city}
            </span>
          </div>
        )}

        {/* Trust badges */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          {listing.vinVerified && (
            <span className="badge-verified" title="VIN nömrəsi satıcı tərəfindən daxil edilib">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              VIN
            </span>
          )}
          {listing.sellerVerified && (
            <span className="badge-verified">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Satıcı
            </span>
          )}
          {listing.mileageFlagSeverity === "warning" && (
            <span className="badge-warning">Yürüş fərqi</span>
          )}
          {listing.mileageFlagSeverity === "high_risk" && (
            <span className="badge-danger">Yüksək risk</span>
          )}
          {!isPart && (
            <div className="ml-auto">
              <AddToCompareButton listingId={listing.id} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
