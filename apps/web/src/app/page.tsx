import Link from "next/link";
import { Car, Search } from "lucide-react";
import { ListingCard, ListingCardData } from "@/components/listings/listing-card";
import { AdBanner } from "@/components/ads/ad-banner";
import { LifestyleCategories } from "@/components/home/lifestyle-categories";
import { getActiveListingCount, listListings } from "@/server/listing-store";

function toCardData(item: {
  id: string; title: string; priceAzn: number; city: string; year: number;
  mileageKm: number; fuelType: string; transmission: string; trustScore: number;
  vinVerified: boolean; sellerVerified: boolean; mediaComplete: boolean;
  imageUrl?: string;
  vinProvided?: boolean; creditAvailable?: boolean; barterAvailable?: boolean;
  priceInsight?: string; mileageFlagSeverity?: string; planType?: "free" | "standard" | "vip"
}): ListingCardData {
  return {
    id: item.id, title: item.title, priceAzn: item.priceAzn, city: item.city,
    year: item.year, mileageKm: item.mileageKm, fuelType: item.fuelType,
    transmission: item.transmission, trustScore: item.trustScore,
    vinVerified: item.vinVerified, sellerVerified: item.sellerVerified,
    imageUrl: item.imageUrl,
    vinProvided: item.vinProvided,
    mediaComplete: item.mediaComplete,
    creditAvailable: item.creditAvailable,
    barterAvailable: item.barterAvailable,
    priceInsight: (item.priceInsight as ListingCardData["priceInsight"]) ?? "market_rate",
    mileageFlagSeverity: item.mileageFlagSeverity as ListingCardData["mileageFlagSeverity"],
    planType: item.planType
  };
}

export default async function HomePage() {
  const [listingsResult, activeCount] = await Promise.all([
    listListings({ page: 1, pageSize: 6, sort: "recent" }),
    getActiveListingCount()
  ]);
  const featuredCards = listingsResult.items.map(toCardData);

  return (
    <div>
      <section className="relative overflow-hidden bg-[#0c1a2e] pb-20 pt-16 sm:pt-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              Avtomobil alarkən{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-teal-200 bg-clip-text text-transparent">
                hər şeyi bilin
              </span>
            </h1>

            <p className="mt-4 text-base text-white/55 sm:text-lg">
              VIN, etibar skoru, qiymət analizi.
            </p>

            <form action="/listings" method="GET" className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-0 sm:rounded-2xl sm:bg-white sm:p-1.5 sm:shadow-xl sm:ring-1 sm:ring-black/5">
              <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-3 sm:rounded-xl sm:bg-transparent sm:px-3">
                <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                <input
                  type="text"
                  name="q"
                  placeholder="Marka, model, VIN..."
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>
              <button type="submit" className="btn-primary px-8 py-3">
                Axtar
              </button>
            </form>

            {activeCount > 0 && (
              <p className="mt-5 text-sm text-white/40">
                {activeCount.toLocaleString()} aktiv elan
              </p>
            )}
          </div>
        </div>
      </section>

      <LifestyleCategories />

      <section className="py-14 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="section-title">Son elanlar</h2>
            <Link href="/listings" className="hidden text-sm font-medium text-brand-600 hover:underline sm:block">
              Hamısı →
            </Link>
          </div>

          {featuredCards.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCards.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 py-16 text-center">
              <div className="icon-tile icon-tile-teal h-14 w-14 rounded-2xl">
                <Car className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
              </div>
              <p className="text-sm text-slate-500">Hələ elan yoxdur</p>
              <Link href="/publish" className="btn-primary text-sm">Elan yerləşdir</Link>
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link href="/listings" className="btn-secondary text-sm">Hamısı</Link>
          </div>
        </div>
      </section>

      <div className="border-y border-slate-100 bg-slate-50 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AdBanner size="leaderboard" slotLabel="home-after-listings" />
        </div>
      </div>
    </div>
  );
}
