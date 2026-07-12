import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicDealerProfile } from "@/server/dealer-store";
import { ListingCard } from "@/components/listings/listing-card";
import { computeTrustBadges } from "@/lib/seller-trust";
import { buildBusinessLocations } from "@/components/business/business-branches-display";
import { PublicProfileShell } from "@/components/seller/public-profile-shell";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicDealerProfile(id).catch(() => null);
  if (!profile) return { title: "Salon profili" };

  return {
    title: `${profile.name} | Salon — ${profile.city}`,
    description:
      profile.description?.trim() ||
      `${profile.name} — EkoMobil təsdiqlənmiş avtosalon, ${profile.city}`
  };
}

export default async function PublicDealerPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getPublicDealerProfile(id);
  if (!profile) notFound();

  const trustBadges = computeTrustBadges({
    dealerVerified: profile.verified,
    dealerVoen: profile.voen,
    hasSalonPlan: true,
    hasAvatar: !!profile.logoUrl,
    hasCity: !!profile.city,
    hasName: !!profile.name,
    memberSince: profile.memberSince ?? undefined,
    activeListingCount: profile.activeListingCount,
    phoneSet: !!profile.whatsappPhone,
    profileKind: "dealer"
  });

  const locations = buildBusinessLocations({
    primaryCity: profile.city,
    primaryLabel: profile.name,
    primaryAddress: profile.address,
    primaryMapUrl: profile.mapUrl,
    primaryPhone: profile.whatsappPhone,
    primaryWorkingHours: profile.workingHours,
    branches: profile.branches
  });

  const slaMinutes = profile.responseSlaMinutes;

  return (
    <PublicProfileShell
      name={profile.name}
      profileKind="dealer"
      verified={profile.verified}
      city={profile.city}
      memberSince={profile.memberSince}
      coverUrl={profile.coverUrl}
      logoUrl={profile.logoUrl}
      description={profile.description}
      phone={profile.whatsappPhone}
      whatsappPhone={profile.whatsappPhone}
      websiteUrl={profile.websiteUrl}
      showWhatsapp={profile.showWhatsapp}
      showWebsite={profile.showWebsite}
      workingHours={profile.workingHours}
      address={profile.address}
      mapUrl={profile.mapUrl}
      locations={locations}
      trustBadges={trustBadges}
      listingCount={profile.activeListingCount}
      metaChips={
        <span
          className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
            slaMinutes <= 15
              ? "bg-emerald-50 text-emerald-700"
              : slaMinutes <= 60
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          Cavab: ≤{slaMinutes} dəq
        </span>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Aktiv avtomobil elanları
          <span className="ml-2 text-sm font-medium text-slate-500">
            {profile.activeListingCount}
          </span>
        </h2>
        <Link href="/listings?sellerType=dealer" className="text-sm font-medium text-[#0057FF] hover:underline">
          Bütün salon elanları
        </Link>
      </div>

      {profile.inventory.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <p className="text-slate-400">Aktiv elan yoxdur</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {profile.inventory.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </PublicProfileShell>
  );
}
