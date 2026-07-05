import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/auth";
import { getUserProfile } from "@/server/user-store";
import { listListingsForUser } from "@/server/listing-store";
import { hasActiveBusinessSubscription, getEffectivePartsPlan, getBusinessAccountSnapshot } from "@/server/business-plan-store";
import { OwnerEditPartListingButton } from "@/components/listings/owner-edit-part-listing-button";
import { BoostListingButton } from "@/components/listings/boost-listing-button";
import { ListingPlanExpiryCounter } from "@/components/listings/listing-plan-expiry-counter";
import { StoreProfileEditForm } from "@/components/user/store-profile-edit-form";
import type { PlanType } from "@/lib/listing-plans";

const STATUS_META: Record<string, { label: string; dot: string; cls: string }> = {
  active:         { label: "Aktiv",      dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending_review: { label: "Yoxlamada", dot: "bg-amber-500",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  draft:          { label: "Qaralama",   dot: "bg-slate-400",   cls: "bg-slate-50 text-slate-600 border-slate-200" },
  sold:           { label: "Satılıb",    dot: "bg-[#0057FF]",   cls: "bg-blue-50 text-[#0057FF] border-blue-200" },
  rejected:       { label: "Rədd edilib",dot: "bg-red-500",     cls: "bg-red-50 text-red-700 border-red-200" },
  archived:       { label: "Arxiv",      dot: "bg-slate-300",   cls: "bg-slate-50 text-slate-500 border-slate-200" }
};

export default async function StorePortalPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/parts/store");

  const isStore = await hasActiveBusinessSubscription(user.id, "parts_store");
  if (!isStore && user.role !== "admin") {
    redirect("/parts/setup");
  }

  const [profile, allListings, partsPlan, snapshot] = await Promise.all([
    getUserProfile(user.id),
    listListingsForUser(user.id),
    getEffectivePartsPlan(user.id),
    getBusinessAccountSnapshot(user.id, user.role)
  ]);

  const partsListings = allListings.filter(l => l.listingKind === "part");
  const activeCount = partsListings.filter(l => l.status === "active").length;
  const pendingCount = partsListings.filter(l => l.status === "pending_review").length;
  const totalCount = partsListings.length;

  const storeName = profile?.storeName || profile?.fullName || "Mağazam";
  const daysLeft = snapshot.magazaSubscriptionExpiresAt
    ? Math.ceil((new Date(snapshot.magazaSubscriptionExpiresAt).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="min-h-screen bg-slate-50/40">
      {/* ── Store Header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            {/* Store identity */}
            <div className="flex items-center gap-4">
              {profile?.storeLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.storeLogoUrl}
                  alt={storeName}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-slate-100 shadow"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 text-2xl font-bold text-white shadow">
                  {storeName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{storeName}</h1>
                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700 border border-violet-200">
                    📦 Mağaza
                  </span>
                </div>
                {profile?.city && (
                  <p className="mt-0.5 text-sm text-slate-500">{profile.city}</p>
                )}
                {profile?.storeDescription && (
                  <p className="mt-1 line-clamp-1 text-xs text-slate-400 italic">{profile.storeDescription}</p>
                )}

                {/* Plan badge */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                    {partsPlan.nameAz}
                  </span>
                  {daysLeft !== null && daysLeft > 0 && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      daysLeft <= 7
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}>
                      {snapshot.magazaIsTrial ? "Sınaq — " : ""}{daysLeft} gün qalıb
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Link href="/parts/analytics" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                Analitika
              </Link>
              <Link href={`/sellers/${user.id}`} target="_blank" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                İctimai profil ↗
              </Link>
              <Link href="/parts/publish" className="rounded-xl bg-[#0057FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004ADF]">
                + Hissə elanı
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 flex flex-wrap gap-3">
            {[
              { label: "Aktiv elan", value: activeCount, color: "text-emerald-600" },
              { label: "Yoxlamada", value: pendingCount, color: "text-amber-600" },
              { label: "Cəmi elan", value: totalCount, color: "text-slate-700" }
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                <span className={`text-lg font-bold ${color}`}>{value}</span>
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
            <Link
              href="/parts/publish/bulk"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              📋 Toplu yükləmə
            </Link>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

          {/* ── LEFT: Listings ───────────────────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-slate-900">Hissə elanları</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {totalCount}
                </span>
              </div>
              <Link href="/parts/publish" className="rounded-lg bg-[#0057FF] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#004ADF]">
                + Yeni elan
              </Link>
            </div>

            {partsListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
                  <span className="text-2xl">📦</span>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Hələ elanınız yoxdur</p>
                  <p className="mt-1 text-sm text-slate-400">İlk hissə elanını dəqiqələr içində əlavə edin</p>
                </div>
                <Link href="/parts/publish" className="rounded-xl bg-[#0057FF] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#004ADF]">
                  İlk elanı əlavə et
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {partsListings.map((item) => {
                  const sm = STATUS_META[item.status] ?? STATUS_META["archived"];
                  return (
                    <div key={item.id} className="group">
                      <div className="flex items-start gap-4 px-5 py-4">
                        {/* Thumbnail */}
                        <Link href={`/listings/${item.id}`} className="shrink-0">
                          <div className="relative h-[60px] w-20 overflow-hidden rounded-xl bg-slate-100">
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg">📦</div>
                            )}
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/listings/${item.id}`} className="font-semibold text-sm text-slate-900 transition hover:text-[#0057FF] line-clamp-1">
                              {item.title}
                            </Link>
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${sm.cls}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`} />
                              {sm.label}
                            </span>
                          </div>

                          <p className="mt-1 text-sm font-bold text-[#0057FF]">
                            {item.priceAzn.toLocaleString("az-AZ")} ₼
                            {item.partCategory && (
                              <span className="ml-2 text-xs font-normal text-slate-400">{item.partCategory}</span>
                            )}
                          </p>

                          {item.partQuantity !== undefined && (
                            <p className={`mt-0.5 text-xs ${item.partQuantity > 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {item.partQuantity > 0 ? `Stokda: ${item.partQuantity} ədəd` : "Stokda yoxdur"}
                            </p>
                          )}

                          {item.status === "active" && item.planExpiresAt && (
                            <div className="mt-1.5">
                              <ListingPlanExpiryCounter
                                planExpiresAt={item.planExpiresAt}
                                planType={(item.planType ?? "free") as PlanType}
                                variant="compact"
                              />
                            </div>
                          )}

                          {item.status === "rejected" && item.rejectionNote && (
                            <div className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs text-red-700">
                              <span className="font-semibold">Rədd səbəbi: </span>{item.rejectionNote}
                            </div>
                          )}
                        </div>

                        {/* Boost */}
                        <div className="shrink-0">
                          <BoostListingButton
                            listingId={item.id}
                            currentPlan={item.planType ?? "free"}
                            listingPriceAzn={item.priceAzn}
                            variant="compact"
                          />
                        </div>
                      </div>

                      {/* Action strip */}
                      <div className="flex flex-wrap items-center gap-3 border-t border-slate-50 bg-slate-50/60 px-5 py-2">
                        <Link href={`/listings/${item.id}`} className="text-xs font-medium text-[#0057FF] hover:underline">
                          Elana bax →
                        </Link>
                        <span className="text-slate-200">|</span>
                        <OwnerEditPartListingButton
                          variant="inline"
                          listingId={item.id}
                          title={item.title}
                          description={item.description}
                          city={item.city}
                          priceAzn={item.priceAzn}
                          partCategory={item.partCategory}
                          partSubcategory={item.partSubcategory}
                          partBrand={item.partBrand}
                          partCondition={item.partCondition}
                          partAuthenticity={item.partAuthenticity}
                          partOemCode={item.partOemCode}
                          partSku={item.partSku}
                          partQuantity={item.partQuantity}
                          partCompatibility={item.partCompatibility}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── RIGHT: Profile edit ───────────────────────────────────────────── */}
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-semibold text-slate-900">Mağaza profili</h2>
                <p className="mt-0.5 text-xs text-slate-400">İctimai profilinizin görünüşünü idarə edin</p>
              </div>
              <div className="p-5">
                <StoreProfileEditForm
                  initialData={{
                    storeName: profile?.storeName,
                    storeLogoUrl: profile?.storeLogoUrl,
                    storeCoverUrl: profile?.storeCoverUrl,
                    storeDescription: profile?.storeDescription,
                    city: profile?.city
                  }}
                  publicProfileUrl={`/sellers/${user.id}`}
                />
              </div>
            </section>

            {/* Quick links */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-semibold text-slate-900">Sürətli keçidlər</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { href: "/parts/publish", label: "+ Hissə elanı əlavə et", icon: "📦" },
                  { href: "/parts/publish/bulk", label: "Toplu yükləmə", icon: "📋" },
                  { href: "/parts/analytics", label: "Analitika və statistika", icon: "📊" },
                  { href: `/sellers/${user.id}`, label: "İctimai mağaza profili", icon: "🔗", external: true },
                  { href: "/me", label: "Şəxsi hesaba qayıt", icon: "👤" }
                ].map(({ href, label, icon, external }) => (
                  <Link
                    key={href}
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-center gap-3 px-5 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <span className="text-base">{icon}</span>
                    <span>{label}</span>
                    <svg className="ml-auto h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>

            {/* Plan info */}
            <section className="overflow-hidden rounded-2xl border border-violet-200 bg-violet-50 shadow-sm">
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Aktiv plan</p>
                    <p className="mt-1 text-base font-bold text-violet-900">{partsPlan.nameAz}</p>
                    {daysLeft !== null && (
                      <p className={`mt-0.5 text-xs font-medium ${daysLeft <= 7 ? "text-amber-700" : "text-violet-700"}`}>
                        {snapshot.magazaIsTrial && "Sınaq — "}
                        {daysLeft > 0 ? `${daysLeft} gün qalıb` : "Müddəti bitib"}
                      </p>
                    )}
                  </div>
                  <Link href="/pricing#parts-store" className="rounded-xl border border-violet-300 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50">
                    Planları gör
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
