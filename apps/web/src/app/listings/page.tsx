import Link from "next/link";
import type { Metadata } from "next";
import { CarFront } from "lucide-react";
import { ListingCard } from "@/components/listings/listing-card";
import { NativeAdCard, AdBanner } from "@/components/ads/ad-banner";
import { ListingsFiltersPanel } from "@/components/listings/listings-filters-panel";
import { PageHero } from "@/components/ui/page-hero";
import { listListings } from "@/server/listing-store";
import { getAdSlotsConfig } from "@/server/system-settings-store";
import { getAdSlotById } from "@/lib/ad-slots-config";

export const metadata: Metadata = {
  title: "Bütün elanlar",
  description: "Azərbaycanda satılan avtomobilləri filtr və axtarışla tapın. VIN mövcudluğu, qiymət və şəhər üzrə elanları müqayisə edin.",
  alternates: {
    canonical: "/listings"
  }
};

const sortOptions: Array<{
  value: "trust_desc" | "price_asc" | "price_desc" | "year_desc" | "mileage_asc" | "recent";
  label: string;
}> = [
  { value: "trust_desc", label: "Etibar: yüksəkdən aşağı" },
  { value: "price_asc", label: "Qiymət: ucuzdan bahalıya" },
  { value: "price_desc", label: "Qiymət: bahalıdan ucuza" },
  { value: "year_desc", label: "İl: yenidən köhnəyə" },
  { value: "mileage_asc", label: "Yürüş: azdan çoxa" },
  { value: "recent", label: "Ən yenilər" }
];

function chipHref(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
  value?: string
): string {
  const params = new URLSearchParams();
  for (const [k, rawValue] of Object.entries(searchParams)) {
    if (k === key || rawValue === undefined) continue;
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) params.append(k, item);
    } else {
      params.set(k, rawValue);
    }
  }
  if (value) params.set(key, value);
  const query = params.toString();
  return query ? `/listings?${query}` : "/listings";
}

function pageHref(searchParams: Record<string, string | string[] | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [k, rawValue] of Object.entries(searchParams)) {
    if (k === "page" || rawValue === undefined) continue;
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) params.append(k, item);
    } else {
      params.set(k, rawValue);
    }
  }
  params.set("page", String(page));
  return `/listings?${params.toString()}`;
}

export default async function ListingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = {
    city: typeof params.city === "string" ? params.city : undefined,
    make: typeof params.make === "string" ? params.make : undefined,
    model: typeof params.model === "string" ? params.model : undefined,
    search: typeof params.q === "string" ? params.q : undefined,
    minPrice: typeof params.minPrice === "string" ? Number(params.minPrice) : undefined,
    maxPrice: typeof params.maxPrice === "string" ? Number(params.maxPrice) : undefined,
    minYear: typeof params.minYear === "string" ? Number(params.minYear) : undefined,
    maxYear: typeof params.maxYear === "string" ? Number(params.maxYear) : undefined,
    minMileage: typeof params.minMileage === "string" ? Number(params.minMileage) : undefined,
    maxMileage: typeof params.maxMileage === "string" ? Number(params.maxMileage) : undefined,
    fuelType: typeof params.fuelType === "string" ? params.fuelType : undefined,
    engineType: typeof params.engineType === "string" ? params.engineType : undefined,
    transmission: typeof params.transmission === "string" ? params.transmission : undefined,
    bodyType: typeof params.bodyType === "string" ? params.bodyType : undefined,
    driveType: typeof params.driveType === "string" ? params.driveType : undefined,
    color: typeof params.color === "string" ? params.color : undefined,
    condition: typeof params.condition === "string" ? params.condition : undefined,
    minEngineVolumeCc: typeof params.minEngineVolumeCc === "string" ? Number(params.minEngineVolumeCc) : undefined,
    maxEngineVolumeCc: typeof params.maxEngineVolumeCc === "string" ? Number(params.maxEngineVolumeCc) : undefined,
    interiorMaterial: typeof params.interiorMaterial === "string" ? params.interiorMaterial : undefined,
    hasSunroof: params.hasSunroof === "1" ? true : undefined,
    creditAvailable: params.creditAvailable === "1" ? true : undefined,
    barterAvailable: params.barterAvailable === "1" ? true : undefined,
    vinProvided: params.vinProvided === "1" ? true : undefined,
    seatHeating: params.seatHeating === "1" ? true : undefined,
    seatCooling: params.seatCooling === "1" ? true : undefined,
    camera360: params.camera360 === "1" ? true : undefined,
    parkingSensors: params.parkingSensors === "1" ? true : undefined,
    adaptiveCruise: params.adaptiveCruise === "1" ? true : undefined,
    laneAssist: params.laneAssist === "1" ? true : undefined,
    maxOwnersCount: typeof params.maxOwnersCount === "string" ? Number(params.maxOwnersCount) : undefined,
    hasServiceBook: params.hasServiceBook === "1" ? true : undefined,
    hasRepairHistory: params.hasRepairHistory === "1" ? true : undefined,
    sellerType: (typeof params.sellerType === "string" ? params.sellerType : undefined) as "private" | "dealer" | undefined,
    vinVerified: params.vinVerified === "1" ? true : undefined,
    sellerVerified: params.sellerVerified === "1" ? true : undefined,
    listingKind: "vehicle" as const,
    sort: (typeof params.sort === "string" ? params.sort : "recent") as
      | "trust_desc"
      | "price_asc"
      | "price_desc"
      | "year_desc"
      | "mileage_asc"
      | "recent",
    page: typeof params.page === "string" ? Number(params.page) : 1,
    pageSize: 9
  };
  const [result, adSlotsConfig] = await Promise.all([listListings(query), getAdSlotsConfig()]);
  const listingsInlineAd = getAdSlotById(adSlotsConfig, "listings-inline");
  const listingsBottomAd = getAdSlotById(adSlotsConfig, "listings-bottom");
  const activeChips = [
    query.city && query.city !== "Hamısı" ? { label: query.city, href: chipHref(params, "city") } : null,
    query.make && query.make !== "Hamısı" ? { label: query.make, href: chipHref(params, "make") } : null,
    query.model && query.model !== "Hamısı" ? { label: query.model, href: chipHref(params, "model") } : null,
    query.bodyType ? { label: query.bodyType, href: chipHref(params, "bodyType") } : null,
    query.fuelType ? { label: query.fuelType, href: chipHref(params, "fuelType") } : null,
    query.engineType ? { label: `Mühərrik: ${query.engineType}`, href: chipHref(params, "engineType") } : null,
    query.interiorMaterial ? { label: query.interiorMaterial, href: chipHref(params, "interiorMaterial") } : null,
    query.hasSunroof ? { label: "Lyuk", href: chipHref(params, "hasSunroof") } : null,
    query.creditAvailable ? { label: "Kredit", href: chipHref(params, "creditAvailable") } : null,
    query.barterAvailable ? { label: "Barter", href: chipHref(params, "barterAvailable") } : null,
    query.vinProvided ? { label: "VIN daxil edilib", href: chipHref(params, "vinProvided") } : null,
    query.seatHeating ? { label: "Oturacaq isidilməsi", href: chipHref(params, "seatHeating") } : null,
    query.seatCooling ? { label: "Oturacaq soyudulması", href: chipHref(params, "seatCooling") } : null,
    query.camera360 ? { label: "360 kamera", href: chipHref(params, "camera360") } : null,
    query.parkingSensors ? { label: "Park sensoru", href: chipHref(params, "parkingSensors") } : null,
    query.adaptiveCruise ? { label: "Adaptiv kruiz", href: chipHref(params, "adaptiveCruise") } : null,
    query.laneAssist ? { label: "Zolaq köməkçisi", href: chipHref(params, "laneAssist") } : null,
    query.maxOwnersCount ? { label: `Sahib ≤ ${query.maxOwnersCount}`, href: chipHref(params, "maxOwnersCount") } : null,
    query.hasServiceBook ? { label: "Servis kitabçası", href: chipHref(params, "hasServiceBook") } : null,
    query.hasRepairHistory ? { label: "Təmir tarixçəsi", href: chipHref(params, "hasRepairHistory") } : null,
    query.sellerType ? { label: query.sellerType === "dealer" ? "Salon" : "Fərdi", href: chipHref(params, "sellerType") } : null,
    query.vinVerified ? { label: "VIN doğrulanmış", href: chipHref(params, "vinVerified") } : null,
    query.sellerVerified ? { label: "Satıcı doğrulanmış", href: chipHref(params, "sellerVerified") } : null
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  return (
    <div>
      <PageHero
        icon={CarFront}
        title="Bütün elanlar"
        subtitle={`${result.total} avtomobil elanı tapıldı`}
        variant="dark"
      />

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar filters */}
        <aside className="w-full shrink-0 lg:w-72">
          <ListingsFiltersPanel initialQuery={query} sortOptions={sortOptions} basePath="/listings" />
        </aside>

        {/* Listings grid */}
        <div className="flex-1">
          {/* Sort bar */}
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {activeChips.length > 0 ? (
                activeChips.map((chip) => (
                  <Link key={chip.label} href={chip.href} className="badge-verified">
                    {chip.label} ×
                  </Link>
                ))
              ) : null}
            </div>
          </div>

          {result.items.length === 0 ? (
            <div className="glass-panel flex flex-col items-center justify-center gap-4 py-20 text-center">
              <svg className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div>
                <p className="font-medium text-slate-700">Heç bir elan tapılmadı</p>
                <p className="mt-1 text-sm text-slate-400">Filterləri dəyişdirin və ya axtarışı genişləndirin.</p>
              </div>
              <Link href="/listings" className="btn-secondary text-sm">Bütün elanlara bax</Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((listing, idx) => (
                <>
                  <ListingCard key={listing.id} listing={listing} variant="premium" />
                  {/* Hər 6 kartdan sonra native ad */}
                  {(idx + 1) % 6 === 0 && idx < result.items.length - 1 && listingsInlineAd?.enabled && (
                    <NativeAdCard key={`ad-${idx}`} slotConfig={listingsInlineAd} />
                  )}
                </>
              ))}
            </div>
          )}

          {/* Leaderboard banner — pagination üstü */}
          {result.items.length > 0 && listingsBottomAd?.enabled && (
            <div className="mt-8">
              <AdBanner size="leaderboard" slotConfig={listingsBottomAd} />
            </div>
          )}

          {/* Pagination placeholder */}
          <div className="mt-10 flex items-center justify-center gap-2">
            <Link
              href={query.page > 1 ? pageHref(params, query.page - 1) : "#"}
              className={`btn-secondary px-4 py-2 text-sm ${query.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
            >
              ← Əvvəlki
            </Link>
            <span className="rounded-lg bg-[#0057FF]/15 px-4 py-2 text-sm font-semibold text-[#93c5fd]">{result.page}</span>
            <Link
              href={
                result.total > result.page * result.pageSize
                  ? pageHref(params, result.page + 1)
                  : "#"
              }
              className={`btn-secondary px-4 py-2 text-sm ${
                result.total <= result.page * result.pageSize ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Növbəti →
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
