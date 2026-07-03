import Link from "next/link";
import { Fragment } from "react";
import { Car } from "lucide-react";
import { ListingCard, ListingCardData } from "@/components/listings/listing-card";
import { LifestyleCategories } from "@/components/home/lifestyle-categories";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { PlatformStatsBar } from "@/components/home/platform-stats-bar";
import { PlatformAudiences } from "@/components/home/platform-audiences";
import { HowItWorks } from "@/components/home/how-it-works";
import { TrustFeaturesSection } from "@/components/home/trust-features-section";
import {
  HomeTopAdSlot,
  HomeMidAdSlot,
  HomeListingsNativeAd,
  HomeBottomAdSlot
} from "@/components/home/home-ad-slots";
import { getActiveListingCount, listListings } from "@/server/listing-store";
import { getAdSlotsConfig, getHomeContentConfig } from "@/server/system-settings-store";

// Ana səhifə admin paneldən idarə olunur — hər dəfə DB-dən oxuyur ki,
// admin dəyişikliyi anında görünsün. `revalidatePath` ilə birlikdə bu
// həm sürəti, həm real-time yeniləməni təmin edir.
export const dynamic = "force-dynamic";

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
  const [listingsResult, activeCount, adSlotsConfig, homeContent] = await Promise.all([
    listListings({ page: 1, pageSize: 6, sort: "recent" }),
    getActiveListingCount(),
    getAdSlotsConfig(),
    getHomeContentConfig()
  ]);
  const featuredCards = listingsResult.items.map(toCardData);

  return (
    <div>
      <HeroCarousel activeCount={activeCount} slides={homeContent.slides} />
      <PlatformStatsBar activeCount={activeCount} />
      <HomeTopAdSlot config={adSlotsConfig} />
      <PlatformAudiences />
      <HowItWorks />
      <HomeMidAdSlot config={adSlotsConfig} />
      <TrustFeaturesSection />
      <LifestyleCategories categories={homeContent.categories} />

      <section id="featured" className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="section-title">{homeContent.featuredTitle}</h2>
              <p className="section-subtitle">{homeContent.featuredSubtitle}</p>
            </div>
            <Link href="/listings" className="hidden text-sm font-medium text-[#0057FF] hover:underline sm:block">
              Hamısı →
            </Link>
          </div>

          {featuredCards.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCards.map((listing, idx) => (
                <Fragment key={listing.id}>
                  <ListingCard listing={listing} variant="premium" />
                  {idx === 2 && <HomeListingsNativeAd config={adSlotsConfig} />}
                </Fragment>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="glass-panel flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="icon-tile icon-tile-teal h-14 w-14 rounded-2xl">
                  <Car className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
                </div>
                <p className="text-sm text-slate-500">Hələ elan yoxdur</p>
                <Link href="/publish" className="btn-primary text-sm">Elan yerləşdir</Link>
              </div>
              <div className="flex justify-center">
                <HomeListingsNativeAd config={adSlotsConfig} />
              </div>
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link href="/listings" className="btn-secondary text-sm">Hamısı</Link>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="publish-strip items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{homeContent.sellCtaTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">{homeContent.sellCtaText}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link href="/publish" className="btn-primary">Elan yerləşdir</Link>
              <Link href="/pricing" className="btn-secondary">Planları gör</Link>
            </div>
          </div>
        </div>
      </section>

      <HomeBottomAdSlot config={adSlotsConfig} />
    </div>
  );
}
