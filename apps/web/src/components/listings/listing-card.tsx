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
          <div className="flex h-full items-center justify-center">
            <svg className="h-14 w-14 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h1l1-4h12l1 4h1a1 1 0 010 2h-.5M3 10a1 1 0 000 2h.5M6 14a2 2 0 104 0m4 0a2 2 0 104 0" />
            </svg>
          </div>
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

        {/* Trust badges */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          {listing.vinVerified && (
            <span className="badge-verified">
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
          <div className="ml-auto">
            <AddToCompareButton listingId={listing.id} />
          </div>
        </div>
      </div>
    </Link>
  );
}
