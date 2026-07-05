import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getPublicSellerProfile } from "@/server/user-store";
import { listListingsForUser } from "@/server/listing-store";
import { ListingCard } from "@/components/listings/listing-card";

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

  const coverUrl = profile.storeCoverUrl;
  const sellerLabel = profile.isStore ? "Mağaza" : "Fərdi satıcı";

  return (
    <div className="min-h-screen bg-slate-50/60">
      {/* ── Cover + Header ──────────────────────────────────────────────── */}
      <div className="relative">
        {/* Cover image or gradient band */}
        {coverUrl ? (
          <div className="relative h-44 w-full overflow-hidden sm:h-56">
            <Image src={coverUrl} alt="Cover" fill className="object-cover object-center" sizes="100vw" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        ) : (
          <div className={`h-36 w-full ${profile.isStore ? "bg-gradient-to-r from-[#0057FF] to-[#00C4FF]" : "bg-gradient-to-r from-slate-700 to-slate-900"}`}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
            />
          </div>
        )}

        {/* Profile card overlay */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between pb-6">
            <div className="flex items-end gap-4">
              <SellerAvatar
                name={profile.displayName}
                avatarUrl={profile.avatarUrl}
                logoUrl={profile.storeLogoUrl}
                size="lg"
              />
              <div className="mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    {profile.displayName}
                  </h1>
                  {profile.isStore && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#0057FF]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0057FF] border border-[#0057FF]/20">
                      🏪 Mağaza
                    </span>
                  )}
                  {profile.sellerVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-500/20">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Təsdiqlənmiş
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium">{sellerLabel}</span>
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
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 rounded-2xl border border-slate-900/10 bg-white/80 px-5 py-3 backdrop-blur-sm shadow-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{profile.activeListingCount}</p>
                <p className="text-xs text-slate-400">Aktiv elan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── About / Bio ─────────────────────────────────────────────────── */}
      {(profile.bio ?? profile.storeDescription) && (
        <div className="mx-auto max-w-5xl px-4 pb-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-900/10 bg-white/80 px-5 py-4 text-sm text-slate-600 leading-relaxed">
            {profile.storeDescription ?? profile.bio}
          </div>
        </div>
      )}

      {/* ── Listings ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Disclaimer */}
        <div className="mb-5 rounded-xl border border-slate-900/8 bg-white/60 px-4 py-2.5 text-xs text-slate-400">
          EkoMobil platforması satıcı haqqında yalnız sistemdə mövcud olan məlumatları göstərir.
          Elan məzmununun düzgünlüyü satıcının məsuliyyətindədir.
        </div>

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Aktiv elanlar
            <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-medium text-slate-500">
              {activeListings.length}
            </span>
          </h2>
        </div>

        {activeListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-900/10 bg-white/60 py-16 text-center">
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
