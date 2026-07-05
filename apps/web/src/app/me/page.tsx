import Link from "next/link";
import { redirect } from "next/navigation";
import { BoostListingButton } from "@/components/listings/boost-listing-button";
import { DraftListingActions } from "@/components/listings/draft-listing-actions";
import { ListingPlanExpiryCounter } from "@/components/listings/listing-plan-expiry-counter";
import { OwnerEditListingButton } from "@/components/listings/owner-edit-listing-button";
import { OwnerEditPartListingButton } from "@/components/listings/owner-edit-part-listing-button";
import { ContactActionButton } from "@/components/support/contact-action-button";
import { PrivacyControls } from "@/components/user/privacy-controls";
import { ProfileEditForm } from "@/components/user/profile-edit-form";
import { getServerSessionUser } from "@/lib/auth";
import { listListingsForUser } from "@/server/listing-store";
import { getLatestPendingPaymentForListing } from "@/server/payment-store";
import { listAuctionNotificationsForUser } from "@/server/auction-notification-store";
import { getUserProfile, listSavedSearches, listUserFavorites } from "@/server/user-store";
import { getUserKycProfile } from "@/server/user-kyc-store";
import { listPendingDefenseReportsForUser } from "@/server/user-report-store";
import { listInvoicesForUser, countInvoicesForUser } from "@/server/invoice-store";
import { INVOICE_PAYMENT_TYPE_LABELS } from "@/lib/invoice-labels";
import { loadBusinessAccountSnapshot } from "@/server/business-access";
import { formatAccountTypeLabel } from "@/lib/business-account";
import { hasActiveBusinessSubscription } from "@/server/business-plan-store";
import type { PlanType } from "@/lib/listing-plans";
import { BusinessAccountStatus } from "@/components/business/business-account-status";

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/me");

  const params = await searchParams;
  const welcome = params.welcome;

  const [profile, favorites, savedSearches, myListings, deepKyc, auctionNotifications, invoices, invoiceCount, pendingReports, businessSnapshot, isStore] =
    await Promise.all([
    getUserProfile(user.id),
    listUserFavorites(user.id),
    listSavedSearches(user.id),
    listListingsForUser(user.id),
    getUserKycProfile(user.id),
    listAuctionNotificationsForUser(user.id, 8),
    listInvoicesForUser(user.id, 10),
    countInvoicesForUser(user.id),
    listPendingDefenseReportsForUser(user.id),
    loadBusinessAccountSnapshot(user),
    hasActiveBusinessSubscription(user.id, "parts_store")
  ]);
  const hasNonActiveListings = myListings.some((item) => item.status !== "active");

  // Load pending payment IDs for draft listings so users can resume payment
  const draftListings = myListings.filter((item) => item.status === "draft");
  const draftPaymentMap = new Map<string, string | undefined>();
  await Promise.all(
    draftListings.map(async (item) => {
      const payment = await getLatestPendingPaymentForListing(item.id, user.id);
      draftPaymentMap.set(item.id, payment?.id);
    })
  );

  const statusMeta: Record<string, { label: string; cls: string }> = {
    active: { label: "Aktiv", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25" },
    pending_review: { label: "Yoxlamada", cls: "bg-amber-500/15 text-amber-700 border-amber-500/25" },
    draft: { label: "Qaralama", cls: "bg-white/63 text-slate-600 border-slate-900/10" },
    sold: { label: "Satılıb", cls: "bg-[#0057FF]/10 text-[#0057FF] border-brand-200" },
    rejected: { label: "Rədd edilib", cls: "bg-red-500/15 text-red-700 border-red-500/25" },
    archived: { label: "Arxiv", cls: "bg-white/63 text-slate-500 border-slate-900/10" },
    inactive: { label: "Deaktiv", cls: "bg-white/63 text-slate-500 border-slate-900/10" }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Welcome banners after registration */}
      {welcome === "business" && (
        <div className="mb-6 rounded-2xl border border-[#0057FF]/30 bg-[#0057FF]/5 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[#0057FF]">Biznes hesabı üçün növbəti addım</p>
              <p className="mt-1 text-sm text-slate-600">
                Salon və mağaza eyni hesabda, ayrı planlarla aktivləşir. Aşağıdakı bölmədən uyğun müraciəti seçin.
              </p>
            </div>
            <Link href="/me" className="btn-secondary text-sm shrink-0">Başa düşdüm</Link>
          </div>
        </div>
      )}
      {welcome === "salon" && (
        <div className="mb-6 rounded-2xl border border-[#0057FF]/30 bg-[#0057FF]/5 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[#0057FF]">Avtomobil salonu üçün müraciət</p>
              <p className="mt-1 text-sm text-slate-600">
                Salon müraciəti göndərin, admin təsdiqindən sonra salon planını aktivləşdirin.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href="/dealer/apply" className="btn-primary text-sm">Salon müraciəti</Link>
              <Link href="/me" className="btn-secondary text-sm">Sonraya qoy</Link>
            </div>
          </div>
        </div>
      )}
      {welcome === "magaza" && (
        <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-violet-900">Ehtiyat hissə mağazası üçün müraciət</p>
              <p className="mt-1 text-sm text-violet-800">
                Mağaza planı salon hesabından asılı deyil — eyni hesabla ayrıca aktivləşir.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href="/parts/apply" className="btn-primary text-sm bg-violet-700 hover:bg-violet-800 border-violet-700">Mağaza müraciəti</Link>
              <Link href="/me" className="btn-secondary text-sm">Sonraya qoy</Link>
            </div>
          </div>
        </div>
      )}
      {welcome === "service" && (
        <div className="mb-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-emerald-700">Servis profili üçün müraciət</p>
              <p className="mt-1 text-sm text-emerald-700">
                Bu hesabla eyni zamanda elan yerləşdirə bilərsiniz. Servis profili üçün aşağıdakı ünvana müraciət edin.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <ContactActionButton intent="service" className="btn-primary text-sm bg-emerald-600 hover:bg-emerald-700 border-emerald-600" />
              <Link href="/me" className="btn-secondary text-sm">Sonraya qoy</Link>
            </div>
          </div>
        </div>
      )}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mənim profilim</h1>
          <p className="mt-2 text-slate-500">{profile?.email} • {profile?.city || "Şəhər qeyd olunmayıb"}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/me/payments" className="btn-secondary">Ödənişlər</Link>
          <Link href="/me/privacy" className="btn-secondary">Məxfilik hüquqları</Link>
          {pendingReports.length > 0 && (
            <Link href="/me/report-responses" className="btn-secondary">
              Şikayət cavabları ({pendingReports.length})
            </Link>
          )}
          <Link href="/favorites" className="btn-secondary">Favorilər</Link>
          <Link href="/publish" className="btn-primary">Yeni elan</Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Profil məlumatları</h2>
            </div>

            {/* Editable profile section */}
            <div className="mb-5 rounded-xl border border-slate-900/8 bg-slate-50/60 p-4">
              <ProfileEditForm
                initialData={{
                  fullName: profile?.fullName,
                  city: profile?.city,
                  bio: profile?.bio,
                  avatarUrl: profile?.avatarUrl,
                  storeName: profile?.storeName,
                  storeLogoUrl: profile?.storeLogoUrl,
                  storeCoverUrl: profile?.storeCoverUrl,
                  storeDescription: profile?.storeDescription
                }}
                userId={user.id}
                isStore={isStore}
                publicProfileUrl={`/sellers/${user.id}`}
              />
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">Hesab növü</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {formatAccountTypeLabel(user.role, businessSnapshot)}
                </dd>
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
                <dt className="text-xs uppercase tracking-wider text-slate-400">Dərin identifikasiya</dt>
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
              <div className="flex flex-wrap gap-2">
                <Link href="/me/kyc" className="btn-secondary text-sm">
                  Dərin identifikasiya səhifəsi
                </Link>
                <Link href="/me/privacy" className="btn-secondary text-sm">
                  Məlumat hüquqları
                </Link>
              </div>
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">Ödənişlər və invoyslar</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {invoiceCount > 0
                    ? `${invoiceCount} ödəniş qeydi — hər uğurlu ödəniş üçün invoys avtomatik yaradılır`
                    : "Ödəniş etdikdən sonra invoyslarınız burada görünəcək"}
                </p>
              </div>
              {invoiceCount > 0 && (
                <Link href="/me/payments" className="btn-secondary text-sm shrink-0">
                  Hamısı ({invoiceCount})
                </Link>
              )}
            </div>
            {invoices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                <p className="text-sm text-slate-500">Hələ ödəniş invoysu yoxdur</p>
                <Link href="/pricing" className="mt-3 inline-block text-sm font-medium text-[#0057FF] hover:underline">
                  Planları kəşf et →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/me/invoices/${inv.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-900/10 p-4 transition hover:border-[#0057FF]/25 hover:bg-[#0057FF]/5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-800">{inv.invoiceNumber}</span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {INVOICE_PAYMENT_TYPE_LABELS[inv.paymentType] ?? inv.paymentType}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-600">{inv.description}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(inv.issuedAt).toLocaleDateString("az-AZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-bold text-slate-900">{inv.amountAzn.toFixed(2)} ₼</p>
                      {inv.vatAmountAzn > 0 && (
                        <p className="text-[10px] text-slate-400">ƏDV daxil</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Auksion yenilikləri</h2>
              <Link href="/auction" className="btn-secondary text-sm">Auksiona keç</Link>
            </div>
            {auctionNotifications.length === 0 ? (
              <p className="text-sm text-slate-500">Hələ auksion bildirişi yoxdur.</p>
            ) : (
              <div className="space-y-3">
                {auctionNotifications.map((item) => (
                  <div key={item.id} className={`rounded-xl border p-4 ${item.isRead ? "border-slate-900/10" : "border-[#0057FF]/25 bg-[#0057FF]/5"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                        <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                        <div className="mt-2 text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleString("az-AZ")}
                        </div>
                      </div>
                      {!item.isRead && <span className="badge-verified">Yeni</span>}
                    </div>
                    {item.ctaHref && (
                      <div className="mt-3">
                        <Link href={item.ctaHref} className="text-sm font-medium text-[#0057FF] hover:underline">
                          Aç →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Mənim elanlarım</h2>
              <Link href="/publish" className="btn-secondary text-sm">Yeni elan</Link>
            </div>
            {hasNonActiveListings && (
              <div className="mb-4 rounded-xl alert-warning border px-3 py-2 text-xs text-amber-700">
                Yeni elanlar əvvəlcə yoxlamaya düşür. Statusu &quot;Yoxlamada&quot; olan elanlar təsdiqdən sonra ümumi axtarışda görünəcək.
              </div>
            )}
            {myListings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-900/10 py-8 text-center">
                <p className="text-sm text-slate-500">Hələ elanınız yoxdur.</p>
                <Link href="/publish" className="btn-primary mt-3 inline-flex text-sm">İlk elanı yerlə</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myListings.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-xl border border-slate-900/10 bg-white/60">
                    <div className="flex items-start gap-4 p-4">
                      {/* Cover image */}
                      {item.imageUrl && (
                        <Link href={`/listings/${item.id}`} className="shrink-0">
                          <div className="h-20 w-28 overflow-hidden rounded-lg bg-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </Link>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/listings/${item.id}`} className="font-semibold text-slate-900 hover:text-[#0057FF]">
                            {item.title}
                          </Link>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusMeta[item.status]?.cls ?? "bg-white/63 text-slate-600 border-slate-900/10"}`}>
                            {statusMeta[item.status]?.label ?? item.status}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.city} · {item.year} · {item.priceAzn.toLocaleString()} ₼
                        </div>
                        <div className="mt-1.5 text-xs text-slate-400">
                          Etibar xalı: <span className="font-medium text-slate-600">{item.trustScore}/100</span>
                        </div>
                        {item.status === "active" && item.planExpiresAt && (
                          <div className="mt-2">
                            <ListingPlanExpiryCounter
                              planExpiresAt={item.planExpiresAt}
                              planType={(item.planType ?? "free") as PlanType}
                              variant="compact"
                            />
                          </div>
                        )}
                        {item.status === "draft" && (
                          <DraftListingActions
                            listingId={item.id}
                            pendingPaymentId={draftPaymentMap.get(item.id)}
                          />
                        )}
                        {item.status === "rejected" && item.rejectionNote && (
                          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                            <span className="font-semibold">Rədd səbəbi: </span>{item.rejectionNote}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        <BoostListingButton listingId={item.id} currentPlan={item.planType ?? "free"} listingPriceAzn={item.priceAzn} variant="compact" />
                      </div>
                    </div>
                    {/* Trust progress bar */}
                    <div className="h-1 bg-slate-100">
                      <div className="h-1 bg-[#0057FF]/50 transition-all" style={{ width: `${Math.min(item.trustScore, 100)}%` }} />
                    </div>
                    {/* Action row */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-900/5 bg-white/40 px-4 py-2.5">
                      <Link
                        href={`/listings/${item.id}`}
                        className="text-xs font-medium text-[#0057FF] hover:underline"
                      >
                        Elana bax →
                      </Link>
                      <span className="text-slate-300">|</span>
                      {item.listingKind === "part" ? (
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
                      ) : (
                        <OwnerEditListingButton
                          variant="inline"
                          listingId={item.id}
                          title={item.title}
                          description={item.description}
                          make={item.make}
                          model={item.model}
                          year={item.year}
                          mileageKm={item.mileageKm}
                          city={item.city}
                          priceAzn={item.priceAzn}
                          vin={item.vin}
                          fuelType={item.fuelType}
                          engineType={item.engineType}
                          transmission={item.transmission}
                          bodyType={item.bodyType}
                          driveType={item.driveType}
                          color={item.color}
                          condition={item.condition}
                          engineVolumeCc={item.engineVolumeCc}
                          interiorMaterial={item.interiorMaterial}
                          hasSunroof={item.hasSunroof}
                          creditAvailable={item.creditAvailable}
                          barterAvailable={item.barterAvailable}
                          seatHeating={item.seatHeating}
                          seatCooling={item.seatCooling}
                          camera360={item.camera360}
                          parkingSensors={item.parkingSensors}
                          adaptiveCruise={item.adaptiveCruise}
                          laneAssist={item.laneAssist}
                          ownersCount={item.ownersCount}
                          hasServiceBook={item.hasServiceBook}
                          hasRepairHistory={item.hasRepairHistory}
                          vinInfoUrl={item.vinInfoUrl}
                          vinDocumentRef={item.vinDocumentRef}
                          serviceHistoryUrl={item.serviceHistoryUrl}
                          serviceHistoryDocumentRef={item.serviceHistoryDocumentRef}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="space-y-6">
          <BusinessAccountStatus snapshot={businessSnapshot} />

          <div className="card p-6">
            <h2 className="font-semibold text-slate-900">Profil qısa statistikası</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/60 p-4">
                <div className="text-2xl font-bold text-[#0057FF]">{favorites.length}</div>
                <div className="text-xs text-slate-500">Favori elan</div>
              </div>
              <div className="rounded-2xl bg-white/60 p-4">
                <div className="text-2xl font-bold text-[#0057FF]">{savedSearches.length}</div>
                <div className="text-xs text-slate-500">Yadda saxlanmış axtarış</div>
              </div>
              <div className="rounded-2xl bg-white/60 p-4 col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-[#0057FF]">{invoiceCount}</div>
                    <div className="text-xs text-slate-500">Ödəniş invoysu</div>
                  </div>
                  <Link href="/me/payments" className="text-xs font-medium text-[#0057FF] hover:underline">
                    Hamısına bax →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <PrivacyControls variant="compact" />
          </div>

          {user.role === "viewer" && (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-900">Hesabı yüksəlt</h2>
              <p className="mt-2 text-xs text-slate-500">
                Salon və mağaza ayrıca aktivləşir — eyni hesab, fərqli planlar.
              </p>
              <div className="mt-4">
                <BusinessAccountStatus snapshot={businessSnapshot} compact />
              </div>
              <div className="mt-4 rounded-xl border border-slate-900/10 p-4">
                <p className="text-sm font-medium text-slate-900">🔧 Servis / Usta profili</p>
                <p className="mt-1 text-xs text-slate-500">Bu hesabla həm elan yerləşdirə, həm servis profili aça bilərsiniz</p>
                <ContactActionButton intent="service" variant="link" className="mt-2 inline-block text-xs font-medium text-[#0057FF] hover:underline" />
              </div>
            </div>
          )}

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
                    <div key={search.id} className="rounded-xl border border-slate-900/10 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium text-slate-900">{search.name || "Axtarış"}</div>
                        <Link href={searchHref} className="shrink-0 text-xs text-[#0057FF] hover:underline">
                          Aç →
                        </Link>
                      </div>
                      {parts.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {parts.map((p) => (
                            <span key={p} className="rounded-md bg-white/63 px-2 py-0.5 text-xs text-slate-500">
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
