import Link from "next/link";
import type { Metadata } from "next";
import { Package } from "lucide-react";
import { ListingCard } from "@/components/listings/listing-card";
import { NativeAdCard, AdBanner } from "@/components/ads/ad-banner";
import { PartsFiltersPanel } from "@/components/parts/parts-filters-panel";
import { PageHero } from "@/components/ui/page-hero";
import { listListings } from "@/server/listing-store";
import { getAdSlotsConfig } from "@/server/system-settings-store";
import { getAdSlotById } from "@/lib/ad-slots-config";
import { PART_AUTHENTICITY_OPTIONS, PART_CONDITIONS } from "@/lib/parts-catalog";
import { getServerSessionUser } from "@/lib/auth";
import { hasActiveBusinessSubscription, getEffectivePartsPlan } from "@/server/business-plan-store";

export const metadata: Metadata = {
  title: "Mağaza elanları",
  description: "Ehtiyat hissə, təkər, yağ və aksesuar elanlarını filter və axtarışla tapın.",
  alternates: {
    canonical: "/parts"
  }
};

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
  const hasStorePlan = sessionUser
    ? sessionUser.role === "admin" || (await hasActiveBusinessSubscription(sessionUser.id, "parts_store"))
    : false;
  const currentPartsPlan = hasStorePlan && sessionUser
    ? await getEffectivePartsPlan(sessionUser.id)
    : null;
  const canSeePartsAnalytics = currentPartsPlan?.analyticsEnabled ?? false;
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
  const [result, adSlotsConfig] = await Promise.all([listListings(query), getAdSlotsConfig()]);
  const partsInlineAd = getAdSlotById(adSlotsConfig, "parts-inline");
  const partsBottomAd = getAdSlotById(adSlotsConfig, "parts-bottom");
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
    query.sellerType ? { label: query.sellerType === "dealer" ? "Salon" : "Fərdi", href: chipHref(params, "sellerType") } : null,
    query.sellerVerified ? { label: "Satıcı doğrulanmış", href: chipHref(params, "sellerVerified") } : null,
    query.inStock ? { label: "Stokda var", href: chipHref(params, "inStock") } : null
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  return (
    <div>
      <PageHero
        icon={Package}
        title="Mağaza elanları"
        subtitle={`${result.total} hissə və aksesuar elanı tapıldı`}
        actions={
          <>
            {canSeePartsAnalytics && (
              <Link href="/parts/analytics" className="btn-secondary text-sm">
                Analitika
              </Link>
            )}
            <Link href="/parts/publish/bulk" className="btn-secondary text-sm">
              Toplu yükləmə
            </Link>
          </>
        }
      />

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      {currentPartsPlan && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-900/10 bg-white/60 px-6 py-4">
          <div>
            <p className="text-sm font-medium text-slate-900">
              Aktiv plan: <span className="font-semibold text-[#0057FF]">{currentPartsPlan.nameAz}</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Plan yüksəltmə, aylıq yeniləmə və tam qiymət cədvəli üçün Qiymətlər səhifəsinə keçin.
            </p>
          </div>
          <Link href="/pricing#parts-store" className="shrink-0 rounded-xl border border-[#0057FF]/30 bg-[#0057FF]/5 px-4 py-2 text-sm font-semibold text-[#0057FF] transition hover:bg-[#0057FF]/10">
            Planları gör →
          </Link>
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
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-900/10 py-20 text-center">
              <p className="font-medium text-slate-700">
                {activeChips.length > 0 ? "Bu filterə uyğun elan tapılmadı" : "Hələ mağaza elanı yoxdur"}
              </p>
              <p className="text-sm text-slate-400">
                {activeChips.length > 0 ? "Filterləri dəyişin və ya sıfırlayın." : "İlk hissə elanınızı yerləşdirin."}
              </p>
              {activeChips.length > 0 && (
                <Link href="/parts" className="btn-secondary text-sm">Filterləri sıfırla</Link>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((listing, idx) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
              {result.items.map((_listing, idx) =>
                (idx + 1) % 6 === 0 && idx < result.items.length - 1 && partsInlineAd?.enabled ? (
                  <NativeAdCard key={`ad-${idx}`} slotConfig={partsInlineAd} />
                ) : null
              )}
            </div>
          )}

          {result.items.length > 0 && partsBottomAd?.enabled && (
            <div className="mt-8">
              <AdBanner size="leaderboard" slotConfig={partsBottomAd} />
            </div>
          )}

          {result.total > 0 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Link
                href={query.page > 1 ? pageHref(params, query.page - 1) : "#"}
                className={`btn-secondary px-4 py-2 text-sm ${query.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
              >
                ← Əvvəlki
              </Link>
              <span className="px-4 py-2 text-sm font-semibold text-[#0057FF] bg-[#0057FF]/10 rounded-lg">{result.page}</span>
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
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
