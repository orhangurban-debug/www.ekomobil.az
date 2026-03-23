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

function TrustScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-emerald-500" :
    score >= 60 ? "bg-amber-500" :
    "bg-red-500";

  return (
    <div className={`absolute top-3 right-3 flex h-10 w-10 flex-col items-center justify-center rounded-full ${color} shadow-lg`}>
      <span className="text-xs font-bold leading-none text-white">{score}</span>
    </div>
  );
}

function PriceInsightBadge({ insight }: { insight: ListingCardData["priceInsight"] }) {
  if (!insight) return null;
  const map = {
    below_market: { label: "Bazar altı", cls: "badge-verified" },
    market_rate: { label: "Bazar qiyməti", cls: "badge-neutral" },
    above_market: { label: "Bazar üstü", cls: "badge-warning" }
  };
  const { label, cls } = map[insight];
  return <span className={cls}>{label}</span>;
}

function PlanBadge({ planType }: { planType?: "free" | "standard" | "vip" }) {
  if (!planType || planType === "free") return null;
  const map = {
    standard: { label: "Standart", cls: "bg-brand-100 text-brand-700" },
    vip: { label: "VIP", cls: "bg-amber-100 text-amber-800" }
  };
  const { label, cls } = map[planType];
  return (
    <span className={`absolute bottom-3 left-3 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`card group flex flex-col overflow-hidden ${listing.planType === "vip" || listing.planType === "standard" ? "ring-1 ring-brand-200" : ""}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h1l1-4h12l1 4h1a1 1 0 010 2h-.5M3 10a1 1 0 000 2h.5M6 14a2 2 0 104 0m4 0a2 2 0 104 0" />
            </svg>
          </div>
        )}
        <TrustScoreBadge score={listing.trustScore} />
        <div className="absolute top-3 left-3">
          <FavoriteButton listingId={listing.id} />
        </div>
        <PlanBadge planType={listing.planType} />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold text-slate-900 group-hover:text-ocean-teal-600 transition line-clamp-1">
            {listing.title}
          </h3>
          <p className="mt-0.5 text-xl font-bold text-ocean-teal-600">
            {listing.priceAzn.toLocaleString("az-AZ")} ₼
          </p>
        </div>

        {/* Specs */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>{listing.year}</span>
          <span>{(listing.mileageKm / 1000).toFixed(0)}k km</span>
          <span>{listing.fuelType}</span>
          <span>{listing.transmission}</span>
          <span>{listing.city}</span>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
          {listing.vinVerified && (
            <span className="badge-verified">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              VIN
            </span>
          )}
          {listing.sellerVerified && (
            <span className="badge-verified">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
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
          <PriceInsightBadge insight={listing.priceInsight} />
        </div>

        <div className="flex items-center justify-between pt-2">
          <AddToCompareButton listingId={listing.id} />
          <span className="text-xs text-slate-400">Trust {listing.trustScore}/100</span>
        </div>
      </div>
    </Link>
  );
}
