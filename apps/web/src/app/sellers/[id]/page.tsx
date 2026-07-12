import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicSellerProfile } from "@/server/user-store";
import { filterListingsForPublicSellerProfile, listListingsForUser } from "@/server/listing-store";
import { ListingCard } from "@/components/listings/listing-card";
import type { ListingSummary } from "@/lib/marketplace-types";
import { computeTrustBadges } from "@/lib/seller-trust";
import { buildBusinessLocations } from "@/components/business/business-branches-display";
import { PublicProfileShell } from "@/components/seller/public-profile-shell";

function groupByCategory(listings: ListingSummary[]): { category: string; items: ListingSummary[] }[] {
  const parts = listings.filter((l) => l.listingKind === "part");
  const cars = listings.filter((l) => l.listingKind !== "part");

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

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicSellerProfile(id).catch(() => null);
  if (!profile) return { title: "Satıcı profili" };

  const kindLabel = profile.isStore ? "Mağaza" : "Satıcı";
  const city = profile.city ? ` — ${profile.city}` : "";
  return {
    title: `${profile.displayName} | ${kindLabel}${city}`,
    description:
      profile.storeDescription?.trim() ||
      profile.bio?.trim() ||
      `${profile.displayName} — EkoMobil ${kindLabel.toLowerCase()} profili`
  };
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

  const activeListings = filterListingsForPublicSellerProfile(
    Array.isArray(listingsResult) ? listingsResult : [],
    { isStore: profile.isStore, isDealer: profile.isDealer }
  );

  const groups = groupByCategory(activeListings);
  const profileKind = profile.isStore ? "store" : "private";
  const siblingProfile =
    profile.isDealer && profile.dealerProfileId
      ? { label: "Salon profili →", href: `/dealers/${profile.dealerProfileId}` }
      : null;

  const storeLocations = profile.isStore
    ? buildBusinessLocations({
        primaryCity: profile.city ?? "",
        primaryLabel: profile.storeName ?? profile.displayName,
        primaryAddress: profile.storeAddress ?? undefined,
        primaryMapUrl: profile.storeMapUrl ?? undefined,
        primaryPhone: profile.phone ?? profile.storeWhatsappPhone ?? undefined,
        primaryWorkingHours: profile.storeWorkingHours ?? undefined,
        branches: profile.storeBranches
      })
    : [];

  // Never map email_verified → dealerVerified (that showed "Rəsmi salon" on stores).
  const trustBadges = computeTrustBadges({
    phoneSet: !!profile.phone,
    emailVerified: !!profile.emailVerified,
    kycApproved: profile.kycApproved,
    dealerVerified: false,
    hasAvatar: !!profile.avatarUrl || !!profile.storeLogoUrl,
    hasCity: !!profile.city,
    hasName: !!profile.displayName,
    memberSince: profile.memberSince ?? undefined,
    activeListingCount: activeListings.length,
    hasSalonPlan: profile.isDealer,
    hasStorePlan: profile.isStore,
    profileKind
  });

  const contactPhone = profile.phone ?? profile.storeWhatsappPhone;
  const whatsappPhone = profile.storeWhatsappPhone ?? profile.phone;

  return (
    <PublicProfileShell
      name={profile.displayName}
      profileKind={profileKind}
      verified={Boolean(profile.sellerVerified || profile.kycApproved)}
      city={profile.city}
      memberSince={profile.memberSince}
      coverUrl={profile.storeCoverUrl}
      logoUrl={profile.storeLogoUrl}
      avatarUrl={profile.avatarUrl}
      description={profile.storeDescription ?? profile.bio}
      phone={contactPhone}
      whatsappPhone={whatsappPhone}
      websiteUrl={profile.storeWebsiteUrl}
      showWhatsapp={profile.isStore && profile.showStoreWhatsapp}
      showWebsite={profile.isStore && profile.showStoreWebsite}
      workingHours={profile.isStore ? profile.storeWorkingHours : null}
      address={profile.isStore ? profile.storeAddress : null}
      mapUrl={profile.isStore ? profile.storeMapUrl : null}
      locations={storeLocations}
      trustBadges={trustBadges}
      listingCount={activeListings.length}
      siblingProfile={siblingProfile}
    >
      <p className="text-xs text-slate-400">
        EkoMobil platforması satıcı haqqında yalnız sistemdə mövcud olan məlumatları göstərir.
        Elan məzmununun düzgünlüyü satıcının məsuliyyətindədir.
      </p>

      {activeListings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <p className="text-slate-400">Bu satıcının aktiv elanı yoxdur</p>
          <Link href="/listings" className="mt-4 inline-flex btn-secondary text-sm">
            Bütün elanlara bax
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Aktiv elanlar</h2>
            <span className="text-sm text-slate-500">{activeListings.length}</span>
          </div>
          {groups.map(({ category, items }) => (
            <div key={category}>
              <div className="mb-4 flex items-center gap-3">
                <h3 className="text-sm font-semibold text-slate-800">{category}</h3>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
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
    </PublicProfileShell>
  );
}
