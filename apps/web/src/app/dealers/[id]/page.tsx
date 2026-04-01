import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicDealerProfile } from "@/server/dealer-store";
import { ListingCard } from "@/components/listings/listing-card";

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      Təsdiqlənmiş salon
    </span>
  );
}

function SlaLabel({ minutes }: { minutes: number }) {
  if (minutes <= 15)
    return <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-medium border border-emerald-200">Cavab: ≤{minutes} dəq</span>;
  if (minutes <= 60)
    return <span className="rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-xs font-medium border border-amber-200">Cavab: ≤{minutes} dəq</span>;
  return <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-medium">Cavab: ≤{minutes} dəq</span>;
}

function formatYear(iso: string | null): string {
  if (!iso) return "Məlum deyil";
  return new Date(iso).getFullYear().toString();
}

export default async function PublicDealerPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getPublicDealerProfile(id);
  if (!profile) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-5">
              {/* Avatar — brand initials */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0891B2] text-2xl font-bold text-white shadow-sm">
                {profile.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {profile.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {profile.verified && <VerifiedBadge />}
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {profile.city}
                  </span>
                  <SlaLabel minutes={profile.responseSlaMinutes} />
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="flex gap-6 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{profile.activeListingCount}</p>
                <p className="text-xs text-slate-400">Aktiv elan</p>
              </div>
              <div className="border-l border-slate-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{formatYear(profile.memberSince)}</p>
                <p className="text-xs text-slate-400">Üzv oldu</p>
              </div>
              <div className="border-l border-slate-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-[#0891B2]">≤{profile.responseSlaMinutes}</p>
                <p className="text-xs text-slate-400">Cavab (dəq)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Inventory ────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Aktiv elanlar
            <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-medium text-slate-500">
              {profile.activeListingCount}
            </span>
          </h2>
          <Link href={`/listings?sellerType=dealer`} className="text-sm text-[#0891B2] hover:underline">
            Bütün diler elanları →
          </Link>
        </div>

        {profile.inventory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <p className="text-slate-400">Aktiv elan yoxdur</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {profile.inventory.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
