import Link from "next/link";
import { Car } from "lucide-react";
import { ListingCard, ListingCardData } from "@/components/listings/listing-card";
import { AdBanner } from "@/components/ads/ad-banner";
import { LifestyleCategories } from "@/components/home/lifestyle-categories";
import { PremiumHero } from "@/components/home/premium-hero";
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
      <PremiumHero activeCount={activeCount} />

      <LifestyleCategories />

      <section id="featured" className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="section-title">Son elanlar</h2>
              <p className="section-subtitle">Premium seçilmiş avtomobillər</p>
            </div>
            <Link href="/listings" className="hidden text-sm font-medium text-[#0057FF] hover:underline sm:block">
              Hamısı →
            </Link>
          </div>

          {featuredCards.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCards.map((listing) => (
                <ListingCard key={listing.id} listing={listing} variant="premium" />
              ))}
            </div>
          ) : (
            <div className="glass-panel flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="icon-tile icon-tile-teal h-14 w-14 rounded-2xl">
                <Car className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
              </div>
              <p className="text-sm text-white/50">Hələ elan yoxdur</p>
              <Link href="/publish" className="btn-primary text-sm">Elan yerləşdir</Link>
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link href="/listings" className="btn-secondary text-sm">Hamısı</Link>
          </div>
        </div>
      </section>

      <div className="border-y border-white/10 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AdBanner size="leaderboard" slotLabel="home-after-listings" />
        </div>
      </div>
    </div>
  );
}
