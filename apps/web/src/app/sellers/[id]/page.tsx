import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicSellerProfile } from "@/server/user-store";
import { listListingsForUser } from "@/server/listing-store";
import { ListingCard } from "@/components/listings/listing-card";

function formatMemberSince(iso: string | null): string {
  if (!iso) return "Məlum deyil";
  return new Date(iso).toLocaleDateString("az-AZ", { year: "numeric", month: "long" });
}

function SellerAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0891B2] to-[#0e7490] text-xl font-bold text-white shadow">
      {initials || "EK"}
    </div>
  );
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <SellerAvatar name={profile.displayName} />
              <div>
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {profile.displayName}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  {profile.city && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {profile.city}
                    </span>
                  )}
                  <span>Üzv: {formatMemberSince(profile.memberSince)}</span>
                  {profile.sellerVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Emaili Təsdiqlənmiş
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{profile.activeListingCount}</p>
                <p className="text-xs text-slate-400">Aktiv elan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Listings ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Seller disclaimer */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          EkoMobil platforması satıcı haqqında yalnız sistemdə mövcud olan məlumatları göstərir.
          Elan məzmununun düzgünlüyü satıcının məsuliyyətindədir.
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Aktiv elanlar
            <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-medium text-slate-500">
              {activeListings.length}
            </span>
          </h2>
        </div>

        {activeListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <p className="text-slate-400">Bu satıcının aktiv elanı yoxdur</p>
            <Link href="/listings" className="mt-4 inline-flex btn-secondary text-sm">
              Bütün elanlara bax
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
