import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getPublicSellerProfile } from "@/server/user-store";
import { listListingsForUser } from "@/server/listing-store";
import { ListingCard } from "@/components/listings/listing-card";
import type { ListingSummary } from "@/lib/marketplace-types";
import { TrustBadgeRow, TrustScoreBar } from "@/components/seller/trust-badges";
import { computeTrustBadges } from "@/lib/seller-trust";

function formatMemberSince(iso: string | null): string {
  if (!iso) return "Məlum deyil";
  return new Date(iso).toLocaleDateString("az-AZ", { year: "numeric", month: "long" });
}

function SellerAvatar({
  name,
  avatarUrl,
  logoUrl,
  size = "lg"
}: {
  name: string;
  avatarUrl?: string | null;
  logoUrl?: string | null;
  size?: "sm" | "lg";
}) {
  const imgUrl = logoUrl ?? avatarUrl;
  const dim = size === "lg" ? "h-20 w-20 text-2xl" : "h-14 w-14 text-xl";
  const initials = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (imgUrl) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-2xl ${dim} ring-4 ring-white shadow-lg`}>
        <Image src={imgUrl} alt={name} fill className="object-cover" sizes="80px" />
      </div>
    );
  }

  return (
    <div className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0057FF] to-[#0046CC] font-bold text-white shadow-lg ring-4 ring-white ${dim}`}>
      {initials || "EK"}
    </div>
  );
}

function groupByCategory(listings: ListingSummary[]): { category: string; items: ListingSummary[] }[] {
  const parts = listings.filter((l) => l.listingKind === "part");
  const cars  = listings.filter((l) => l.listingKind !== "part");

  const groups: { category: string; items: ListingSummary[] }[] = [];

  if (cars.length > 0) {
    groups.push({ category: "Avtomobillər", items: cars });
  }

  if (parts.length > 0) {
    const byCategory = new Map<string, ListingSummary[]>();
    for (const p of parts) {
      const cat = p.partCategory ?? "Digər";
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(p);
    }
    for (const [cat, items] of byCategory) {
      groups.push({ category: cat, items });
    }
  }

  return groups;
}

export default async function PublicSellerPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [profile, listingsResult] = await Promise.all([
    getPublicSellerProfile(id),
    listListingsForUser(id).catch(() => [])
  ]);
  if (!profile) notFound();

  const activeListings = Array.isArray(listingsResult)
    ? listingsResult.filter((l) => l.status === "active")
    : [];

  const groups = groupByCategory(activeListings);
  const coverUrl = profile.storeCoverUrl;

  const trustBadges = computeTrustBadges({
    phoneSet:           !!profile.phone,
    emailVerified:      !!profile.emailVerified,
    kycApproved:        profile.kycApproved,
    dealerVerified:     !!profile.sellerVerified,
    hasAvatar:          !!profile.avatarUrl || !!profile.storeLogoUrl,
    hasCity:            !!profile.city,
    hasName:            !!profile.displayName,
    memberSince:        profile.memberSince ?? undefined,
    activeListingCount: activeListings.length,
    hasSalonPlan:       profile.isDealer,
    hasStorePlan:       profile.isStore,
  });

  return (
    <div className="min-h-screen bg-slate-50/60">
      {/* ── Cover band ──────────────────────────────────────────────────────── */}
      {coverUrl ? (
        <div className="relative h-44 w-full overflow-hidden sm:h-56">
          <Image src={coverUrl} alt="Cover" fill className="object-cover object-center" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      ) : (
        <div className={`relative h-36 w-full overflow-hidden ${profile.isStore ? "bg-gradient-to-r from-violet-700 to-violet-500" : "bg-gradient-to-r from-[#0057FF] to-[#00C4FF]"}`}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
        </div>
      )}

      {/* ── Profile header card ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
            {/* Avatar floats up over cover */}
            <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
              <SellerAvatar
                name={profile.displayName}
                avatarUrl={profile.avatarUrl}
                logoUrl={profile.storeLogoUrl}
                size="lg"
              />
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    {profile.displayName}
                  </h1>
                  {profile.isStore ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                      📦 Mağaza
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      Fərdi satıcı
                    </span>
                  )}
                  {profile.sellerVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Təsdiqlənmiş
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {profile.city && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {profile.city}
                    </span>
                  )}
                  <span className="text-slate-400">Üzv: {formatMemberSince(profile.memberSince)}</span>
                </div>
                {trustBadges.length > 0 && (
                  <div className="mt-2">
                    <TrustBadgeRow badges={trustBadges} max={5} />
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-5 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{profile.activeListingCount}</p>
                <p className="text-xs text-slate-400">Aktiv elan</p>
              </div>
              {trustBadges.length > 0 && (
                <div className="w-36 border-l border-slate-200 pl-5">
                  <TrustScoreBar badges={trustBadges} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── About / Bio ─────────────────────────────────────────────────────── */}
      {(profile.bio ?? profile.storeDescription) && (
        <div className="mx-auto max-w-5xl px-4 pt-5 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm leading-relaxed text-slate-600 shadow-sm">
            {profile.storeDescription ?? profile.bio}
          </div>
        </div>
      )}

      {/* ── Listings ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Disclaimer */}
        <div className="mb-5 rounded-xl border border-slate-100 bg-white/70 px-4 py-2.5 text-xs text-slate-400">
          EkoMobil platforması satıcı haqqında yalnız sistemdə mövcud olan məlumatları göstərir.
          Elan məzmununun düzgünlüyü satıcının məsuliyyətindədir.
        </div>

        {activeListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <p className="text-slate-400">Bu satıcının aktiv elanı yoxdur</p>
            <Link href="/listings" className="mt-4 inline-flex btn-secondary text-sm">
              Bütün elanlara bax
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map(({ category, items }) => (
              <div key={category}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-base font-semibold text-slate-900">{category}</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-medium text-slate-500">
                    {items.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
