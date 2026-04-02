import Link from "next/link";
import { ListingCard } from "@/components/listings/listing-card";
import { NativeAdCard, AdBanner } from "@/components/ads/ad-banner";
import { ListingsFiltersPanel } from "@/components/listings/listings-filters-panel";
import { listListings } from "@/server/listing-store";

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
    transmission: typeof params.transmission === "string" ? params.transmission : undefined,
    bodyType: typeof params.bodyType === "string" ? params.bodyType : undefined,
    driveType: typeof params.driveType === "string" ? params.driveType : undefined,
    color: typeof params.color === "string" ? params.color : undefined,
    condition: typeof params.condition === "string" ? params.condition : undefined,
    sellerType: (typeof params.sellerType === "string" ? params.sellerType : undefined) as "private" | "dealer" | undefined,
    vinVerified: params.vinVerified === "1" ? true : undefined,
    sellerVerified: params.sellerVerified === "1" ? true : undefined,
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
  const result = await listListings(query);
  const activeChips = [
    query.city && query.city !== "Hamısı" ? { label: query.city, href: chipHref(params, "city") } : null,
    query.make && query.make !== "Hamısı" ? { label: query.make, href: chipHref(params, "make") } : null,
    query.model && query.model !== "Hamısı" ? { label: query.model, href: chipHref(params, "model") } : null,
    query.bodyType ? { label: query.bodyType, href: chipHref(params, "bodyType") } : null,
    query.fuelType ? { label: query.fuelType, href: chipHref(params, "fuelType") } : null,
    query.sellerType ? { label: query.sellerType === "dealer" ? "Diler" : "Fərdi", href: chipHref(params, "sellerType") } : null,
    query.vinVerified ? { label: "VIN mövcuddur", href: chipHref(params, "vinVerified") } : null,
    query.sellerVerified ? { label: "Satıcı doğrulanmış", href: chipHref(params, "sellerVerified") } : null
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="section-title">Bütün elanlar</h1>
        <p className="section-subtitle">{result.total} elan tapıldı</p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar filters */}
        <aside className="w-full shrink-0 lg:w-64">
          <ListingsFiltersPanel initialQuery={query} sortOptions={sortOptions} />
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
              ) : (
                <span className="text-sm text-slate-400">Aktiv filter yoxdur</span>
              )}
            </div>
            <div className="hidden lg:block text-sm text-slate-500">{result.total} elan</div>
          </div>

          {result.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 py-20 text-center">
              <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div>
                <p className="font-medium text-slate-700">Heç bir elan tapılmadı</p>
                <p className="mt-1 text-sm text-slate-400">Filterləri dəyişdirin və ya axtarışı genişləndirin.</p>
              </div>
              <Link href="/listings" className="btn-secondary text-sm">Bütün elanlara bax</Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((listing, idx) => (
                <>
                  <ListingCard key={listing.id} listing={listing} />
                  {/* Hər 6 kartdan sonra native ad */}
                  {(idx + 1) % 6 === 0 && idx < result.items.length - 1 && (
                    <NativeAdCard key={`ad-${idx}`} slotLabel={`listings-inline-${Math.floor(idx / 6)}`} />
                  )}
                </>
              ))}
            </div>
          )}

          {/* Leaderboard banner — pagination üstü */}
          {result.items.length > 0 && (
            <div className="mt-8">
              <AdBanner size="leaderboard" slotLabel="listings-bottom" />
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
            <span className="px-4 py-2 text-sm font-semibold text-brand-700 bg-brand-50 rounded-lg">{result.page}</span>
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
  );
}
