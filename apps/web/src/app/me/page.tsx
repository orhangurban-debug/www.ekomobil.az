import Link from "next/link";
import { redirect } from "next/navigation";
import { BoostListingButton } from "@/components/listings/boost-listing-button";
import { getServerSessionUser } from "@/lib/auth";
import { listListingsForUser } from "@/server/listing-store";
import { getUserProfile, listSavedSearches, listUserFavorites } from "@/server/user-store";
import { getUserKycProfile } from "@/server/user-kyc-store";

export default async function ProfilePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/me");

  const profile = await getUserProfile(user.id);
  const favorites = await listUserFavorites(user.id);
  const savedSearches = await listSavedSearches(user.id);
  const myListings = await listListingsForUser(user.id);
  const deepKyc = await getUserKycProfile(user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mənim profilim</h1>
          <p className="mt-2 text-slate-500">{profile?.email} • {profile?.city || "Şəhər qeyd olunmayıb"}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/favorites" className="btn-secondary">Favorilər</Link>
          <Link href="/publish" className="btn-primary">Yeni elan</Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-semibold text-slate-900">Profil məlumatları</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">Ad</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{profile?.fullName || "Qeyd olunmayıb"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">Rol</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{profile?.role}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">Email statusu</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {profile?.emailVerified ? "Təsdiqlənib" : "Təsdiqlənməyib"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">Telefon</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{profile?.phone || "Qeyd olunmayıb"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">Deep KYC</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {deepKyc?.status === "approved"
                    ? "Təsdiqlənib"
                    : deepKyc?.status === "submitted"
                      ? "Yoxlamada"
                      : deepKyc?.status === "rejected"
                        ? "Rədd edilib"
                        : "Göndərilməyib"}
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <Link href="/me/kyc" className="btn-secondary text-sm">
                Deep KYC səhifəsi
              </Link>
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Mənim elanlarım</h2>
              <Link href="/publish" className="btn-secondary text-sm">Yeni elan</Link>
            </div>
            {myListings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                <p className="text-sm text-slate-500">Hələ elanınız yoxdur.</p>
                <Link href="/publish" className="btn-primary mt-3 inline-flex text-sm">İlk elanı yerlə</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myListings.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <Link href={`/listings/${item.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                          {item.title}
                        </Link>
                        <div className="mt-1 text-xs text-slate-500">{item.city} • {item.year}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <BoostListingButton listingId={item.id} currentPlan={item.planType ?? "free"} variant="compact" />
                        <div className="text-right">
                          <div className="text-sm font-semibold text-brand-700">{item.priceAzn.toLocaleString()} ₼</div>
                          <div className="mt-1 text-xs text-slate-500">Trust {item.trustScore}/100</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-brand-600" style={{ width: `${Math.min(item.trustScore, 100)}%` }} />
                    </div>
                  </div>
                ))}
                {myListings.length > 4 && (
                  <Link href="/listings" className="flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-500 hover:border-brand-300 hover:text-brand-600">
                    Daha {myListings.length - 4} elan var →
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>

        <section className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900">Profil qısa statistikası</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-2xl font-bold text-brand-700">{favorites.length}</div>
                <div className="text-xs text-slate-500">Favori elan</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-2xl font-bold text-brand-700">{savedSearches.length}</div>
                <div className="text-xs text-slate-500">Yadda saxlanmış axtarış</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-slate-900">Yadda saxlanmış axtarışlar</h2>
            <div className="mt-4 space-y-3">
              {savedSearches.length === 0 ? (
                <p className="text-sm text-slate-500">Hələ saxlanmış axtarış yoxdur.</p>
              ) : (
                savedSearches.map((search) => {
                  const qp = search.queryParams as Record<string, unknown>;
                  const parts = Object.entries(qp)
                    .filter(([, v]) => v !== undefined && v !== null && v !== "")
                    .map(([k, v]) => `${k}: ${String(v)}`);
                  const searchHref = `/listings?${new URLSearchParams(
                    Object.fromEntries(
                      Object.entries(qp)
                        .filter(([, v]) => v !== undefined && v !== null && v !== "")
                        .map(([k, v]) => [k, String(v)])
                    )
                  ).toString()}`;
                  return (
                    <div key={search.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium text-slate-900">{search.name || "Axtarış"}</div>
                        <Link href={searchHref} className="shrink-0 text-xs text-brand-600 hover:underline">
                          Aç →
                        </Link>
                      </div>
                      {parts.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {parts.map((p) => (
                            <span key={p} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
