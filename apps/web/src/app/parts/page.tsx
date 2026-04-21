import Link from "next/link";
import type { Metadata } from "next";
import { ListingCard } from "@/components/listings/listing-card";
import { NativeAdCard, AdBanner } from "@/components/ads/ad-banner";
import { PartsFiltersPanel } from "@/components/parts/parts-filters-panel";
import { listListings } from "@/server/listing-store";
import { PART_AUTHENTICITY_OPTIONS, PART_CONDITIONS } from "@/lib/parts-catalog";
import { getServerSessionUser } from "@/lib/auth";
import { getEffectivePartsPlan } from "@/server/business-plan-store";
import { PARTS_STORE_PLANS } from "@/lib/parts-store-plans";
import { BusinessPlanCheckoutButton } from "@/components/business/business-plan-checkout-button";

export const metadata: Metadata = {
  title: "Mağaza elanları",
  description: "Ehtiyat hissə, təkər, yağ və aksesuar elanlarını filter və axtarışla tapın.",
  alternates: {
    canonical: "/parts"
  }
};

const quickPartsPills: Array<{ label: string; href: string }> = [
  { label: "Mühərrik yağları", href: "/parts?partCategory=Ya%C4%9Flar%20v%C9%99%20kimya" },
  { label: "Şinlər", href: "/parts?partCategory=T%C9%99k%C9%99r%20v%C9%99%20disk" },
  { label: "Akkumulyator", href: "/parts?partCategory=Elektrik%20v%C9%99%20akumulyator" },
  { label: "Orijinal hissələr", href: "/parts?partAuthenticity=original" },
  { label: "OEM/Firma", href: "/parts?partAuthenticity=oem" },
  { label: "Stokda olanlar", href: "/parts?inStock=1" },
  { label: "Doğrulanmış satıcılar", href: "/parts?sellerVerified=1" }
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
  return query ? `/parts?${query}` : "/parts";
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
  return `/parts?${params.toString()}`;
}

export default async function PartsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sessionUser = await getServerSessionUser();
  const currentPartsPlan = sessionUser && ["dealer", "admin"].includes(sessionUser.role)
    ? await getEffectivePartsPlan(sessionUser.id)
    : null;
  const canSeePartsAnalytics = currentPartsPlan?.analyticsEnabled ?? false;
  const purchasablePartsPlans = currentPartsPlan
    ? PARTS_STORE_PLANS.filter((plan) => plan.id !== currentPartsPlan.id)
    : [];
  const query = {
    city: typeof params.city === "string" ? params.city : undefined,
    search: typeof params.q === "string" ? params.q : undefined,
    minPrice: typeof params.minPrice === "string" ? Number(params.minPrice) : undefined,
    maxPrice: typeof params.maxPrice === "string" ? Number(params.maxPrice) : undefined,
    sellerType: (typeof params.sellerType === "string" ? params.sellerType : undefined) as "private" | "dealer" | undefined,
    sellerVerified: params.sellerVerified === "1" ? true : undefined,
    partCategory: typeof params.partCategory === "string" ? params.partCategory : undefined,
    partSubcategory: typeof params.partSubcategory === "string" ? params.partSubcategory : undefined,
    partBrand: typeof params.partBrand === "string" ? params.partBrand : undefined,
    partCondition:
      (typeof params.partCondition === "string" ? params.partCondition : undefined) as "new" | "used" | "refurbished" | undefined,
    partAuthenticity:
      (typeof params.partAuthenticity === "string" ? params.partAuthenticity : undefined) as "original" | "oem" | "aftermarket" | undefined,
    inStock: params.inStock === "1" ? true : undefined,
    listingKind: "part" as const,
    sort: (typeof params.sort === "string" ? params.sort : "recent") as
      | "trust_desc"
      | "price_asc"
      | "price_desc"
      | "recent",
    page: typeof params.page === "string" ? Number(params.page) : 1,
    pageSize: 9
  };
  const result = await listListings(query);
  const activeChips = [
    query.city && query.city !== "Hamısı" ? { label: query.city, href: chipHref(params, "city") } : null,
    query.partCategory ? { label: query.partCategory, href: chipHref(params, "partCategory") } : null,
    query.partSubcategory ? { label: query.partSubcategory, href: chipHref(params, "partSubcategory") } : null,
    query.partBrand ? { label: query.partBrand, href: chipHref(params, "partBrand") } : null,
    query.partCondition
      ? { label: PART_CONDITIONS.find((item) => item.value === query.partCondition)?.label ?? query.partCondition, href: chipHref(params, "partCondition") }
      : null,
    query.partAuthenticity
      ? {
          label: PART_AUTHENTICITY_OPTIONS.find((item) => item.value === query.partAuthenticity)?.label ?? query.partAuthenticity,
          href: chipHref(params, "partAuthenticity")
        }
      : null,
    query.sellerType ? { label: query.sellerType === "dealer" ? "Diler" : "Fərdi", href: chipHref(params, "sellerType") } : null,
    query.sellerVerified ? { label: "Satıcı doğrulanmış", href: chipHref(params, "sellerVerified") } : null,
    query.inStock ? { label: "Stokda var", href: chipHref(params, "inStock") } : null
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="section-title">Mağaza elanları</h1>
            <p className="section-subtitle">{result.total} hissə və aksesuar elanı tapıldı</p>
          </div>
          <div className="flex gap-2">
            {canSeePartsAnalytics && (
              <Link href="/parts/analytics" className="btn-secondary text-sm">
                Analitika
              </Link>
            )}
            <Link href="/parts/publish" className="btn-primary text-sm">
              + Hissə elanı yerləşdir
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto">
        <div className="flex min-w-max gap-2 pb-1">
          {quickPartsPills.map((pill) => (
            <Link
              key={pill.label}
              href={pill.href}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#0891B2]/40 hover:text-[#0891B2]"
            >
              {pill.label}
            </Link>
          ))}
        </div>
      </div>

      {currentPartsPlan && (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Mağaza abunə ödənişi</h2>
              <p className="mt-1 text-sm text-slate-500">
                Aktiv plan: <strong>{currentPartsPlan.nameAz}</strong>. Aylıq yeniləmə və plan yüksəltmə checkout-u buradadır.
              </p>
            </div>
            <Link href="/pricing#parts-store" className="btn-secondary">Bütün planlar</Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {purchasablePartsPlans.map((plan) => (
              <div key={plan.id} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">{plan.nameAz}</p>
                <p className="mt-1 text-xs text-slate-500">{plan.priceAzn} ₼ / ay</p>
                <div className="mt-3">
                  <BusinessPlanCheckoutButton
                    businessType="parts_store"
                    planId={plan.id}
                    label={`${plan.nameAz} planını al`}
                    className="btn-primary w-full justify-center"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-64">
          <PartsFiltersPanel initialQuery={query} />
        </aside>

        <div className="flex-1">
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
              <p className="font-medium text-slate-700">Hələ mağaza elanı yoxdur</p>
              <p className="mt-1 text-sm text-slate-400">Axtarışı genişləndirin və ya filterləri dəyişin.</p>
              <Link href="/parts" className="btn-secondary text-sm">Bütün mağaza elanlarına bax</Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((listing, idx) => (
                <>
                  <ListingCard key={listing.id} listing={listing} />
                  {(idx + 1) % 6 === 0 && idx < result.items.length - 1 && (
                    <NativeAdCard key={`ad-${idx}`} slotLabel={`parts-inline-${Math.floor(idx / 6)}`} />
                  )}
                </>
              ))}
            </div>
          )}

          {result.items.length > 0 && (
            <div className="mt-8">
              <AdBanner size="leaderboard" slotLabel="parts-bottom" />
            </div>
          )}

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
                  ? pageHref(params, query.page + 1)
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
