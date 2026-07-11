import Link from "next/link";
import { redirect } from "next/navigation";
import { ContactActionButton } from "@/components/support/contact-action-button";
import { PrivacyControls } from "@/components/user/privacy-controls";
import { ProfileEditForm } from "@/components/user/profile-edit-form";
import { PhoneSetupForm } from "@/components/user/phone-setup-form";
import { getServerSessionUser } from "@/lib/auth";
import { listListingsForUser } from "@/server/listing-store";
import { getLatestPendingPaymentForListing } from "@/server/payment-store";
import { listAuctionNotificationsForUser } from "@/server/auction-notification-store";
import { getUserProfile, listSavedSearches, listUserFavorites } from "@/server/user-store";
import { getUserKycProfile } from "@/server/user-kyc-store";
import { listServiceListingsForUser } from "@/server/service-listing-store";
import { listPendingDefenseReportsForUser } from "@/server/user-report-store";
import { listInvoicesForUser, countInvoicesForUser } from "@/server/invoice-store";
import { INVOICE_PAYMENT_TYPE_LABELS } from "@/lib/invoice-labels";
import { loadBusinessAccountSnapshot } from "@/server/business-access";
import { formatAccountTypeLabel } from "@/lib/business-account";
import { hasActiveBusinessSubscription } from "@/server/business-plan-store";
import { BusinessAccountStatus } from "@/components/business/business-account-status";
import { MyListingsSection } from "@/components/user/my-listings-section";
import { TrustCompletenessPanel } from "@/components/seller/trust-badges";
import { computeTrustBadges, missingTrustItems } from "@/lib/seller-trust";

const STATUS_META: Record<string, { label: string; dot: string; cls: string }> = {
  active:         { label: "Aktiv",      dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending_review: { label: "Yoxlamada", dot: "bg-amber-500",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  draft:          { label: "Qaralama",   dot: "bg-slate-400",   cls: "bg-slate-50 text-slate-600 border-slate-200" },
  sold:           { label: "Satılıb",    dot: "bg-[#0057FF]",   cls: "bg-blue-50 text-[#0057FF] border-blue-200" },
  rejected:       { label: "Rədd edilib",dot: "bg-red-500",     cls: "bg-red-50 text-red-700 border-red-200" },
  archived:       { label: "Arxiv",      dot: "bg-slate-300",   cls: "bg-slate-50 text-slate-500 border-slate-200" },
  inactive:       { label: "Deaktiv",    dot: "bg-slate-300",   cls: "bg-slate-50 text-slate-500 border-slate-200" }
};

function WelcomeBanner({ welcome, pendingReports }: { welcome?: string; pendingReports: number }) {
  if (!welcome && pendingReports === 0) return null;
  return (
    <div className="mb-6 space-y-3">
      {pendingReports > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">
          <p className="text-sm font-medium text-amber-800">Cavablanmamış şikayət bildirişləriniz var ({pendingReports})</p>
          <Link href="/me/report-responses" className="shrink-0 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-800">
            Bax →
          </Link>
        </div>
      )}
      {welcome === "business" && (
        <div className="flex items-center justify-between rounded-2xl border border-[#0057FF]/20 bg-[#0057FF]/5 px-5 py-3">
          <div>
            <p className="font-semibold text-[#0057FF]">Biznes hesabı üçün növbəti addım</p>
            <p className="text-sm text-slate-600">Salon və mağaza eyni hesabda, ayrı planlarla aktivləşir.</p>
          </div>
          <Link href="/me" className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
            Başa düşdüm
          </Link>
        </div>
      )}
      {welcome === "salon" && (
        <div className="flex items-center justify-between rounded-2xl border border-[#0057FF]/20 bg-[#0057FF]/5 px-5 py-3">
          <p className="font-semibold text-[#0057FF]">Salon yaradın — qısa yoxlamadan sonra aktivləşəcək.</p>
          <div className="flex shrink-0 gap-2">
            <Link href="/dealer/apply" className="rounded-lg bg-[#0057FF] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#004ADF]">Yarat</Link>
            <Link href="/me" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Sonra</Link>
          </div>
        </div>
      )}
      {welcome === "magaza" && (
        <div className="flex items-center justify-between rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3">
          <p className="font-semibold text-violet-900">Mağaza yaradın — salon hesabından asılı deyil.</p>
          <div className="flex shrink-0 gap-2">
            <Link href="/parts/apply" className="rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-800">Yarat</Link>
            <Link href="/me" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Sonra</Link>
          </div>
        </div>
      )}
      {welcome === "service" && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
          <p className="font-semibold text-emerald-800">Servis profilinizi yaradın — ani aktiv olur.</p>
          <ContactActionButton intent="service" className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700" />
        </div>
      )}
    </div>
  );
}

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/me");

  const params = await searchParams;
  const welcome = params.welcome;

  const [profile, favorites, savedSearches, myListings, deepKyc, auctionNotifications, invoices, invoiceCount, pendingReports, businessSnapshot, isStore, myServiceListings] =
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
      hasActiveBusinessSubscription(user.id, "parts_store"),
      listServiceListingsForUser(user.id)
    ]);

  const draftListings = myListings.filter((item) => item.status === "draft");
  const draftPaymentMap = new Map<string, string | undefined>();
  await Promise.all(
    draftListings.map(async (item) => {
      const payment = await getLatestPendingPaymentForListing(item.id, user.id);
      draftPaymentMap.set(item.id, payment?.id);
    })
  );

  const activeListings = myListings.filter(l => l.status === "active").length;

  const trustInput = {
    phoneSet:           !!profile?.phone,
    emailVerified:      !!profile?.emailVerified,
    kycApproved:        deepKyc?.status === "approved",
    dealerVerified:     false, // set from dealer_profiles if available
    dealerVoen:         null,  // populated via dealer profile in future
    hasSalonPlan:       !!businessSnapshot?.salonSubscriptionActive,
    hasStorePlan:       isStore,
    hasAvatar:          !!profile?.avatarUrl,
    hasCity:            !!profile?.city,
    hasName:            !!profile?.fullName,
    memberSince:        undefined,
    activeListingCount: activeListings,
  };
  const trustBadges  = computeTrustBadges(trustInput);
  const trustMissing = missingTrustItems(trustBadges, trustInput);
  const unreadAuctions = auctionNotifications.filter(n => !n.isRead).length;
  const displayName = profile?.fullName || profile?.email?.split("@")[0] || "İstifadəçi";

  const kycLabel =
    deepKyc?.status === "approved" ? "Təsdiqlənib" :
    deepKyc?.status === "submitted" ? "Yoxlamada" :
    deepKyc?.status === "rejected" ? "Rədd edilib" : null;

  return (
    <div className="min-h-screen bg-slate-50/40">
      {/* ── Profile Hero ──────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-900/8 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <WelcomeBanner welcome={welcome} pendingReports={pendingReports.length} />

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            {/* Avatar + Identity */}
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0057FF] to-[#0040CC] text-2xl font-bold text-white shadow-md">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {formatAccountTypeLabel(user.role, businessSnapshot)}
                  </span>
                  {profile?.emailVerified && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Təsdiqlənmiş
                    </span>
                  )}
                  {kycLabel && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      KYC: {kycLabel}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-slate-400">{profile?.email}</p>
              </div>
            </div>

            {/* Stats + Actions */}
            <div className="flex flex-col items-start gap-4 sm:items-end">
              {/* Stat pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Elan", value: activeListings },
                  { label: "Favori", value: favorites.length },
                  { label: "Axtarış", value: savedSearches.length },
                  { label: "İnvoys", value: invoiceCount }
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <span className="text-base font-bold text-slate-900">{value}</span>
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                ))}
              </div>

              {/* Primary actions — "Elan ver" artıq nav-dadır, bura duplicate olmasın */}
              <div className="flex flex-wrap gap-2">
                <Link href="/favorites" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                  Favorilər
                </Link>
                <Link href={`/sellers/${user.id}`} target="_blank" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                  İctimai profil ↗
                </Link>
                {invoiceCount > 0 && (
                  <Link href="/me/payments" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                    {invoiceCount} İnvoys
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Elanlarım — tab + view switcher */}
            <MyListingsSection
              listings={myListings}
              draftPaymentMap={Object.fromEntries(draftPaymentMap)}
              hasStore={isStore}
              hasSalon={!!businessSnapshot?.salonSubscriptionActive}
            />


            {/* Auksion bildirişləri */}
            {auctionNotifications.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-slate-900">Auksion bildirişləri</h2>
                    {unreadAuctions > 0 && (
                      <span className="rounded-full bg-[#0057FF] px-2.5 py-0.5 text-xs font-bold text-white">
                        {unreadAuctions}
                      </span>
                    )}
                  </div>
                  <Link href="/auction" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
                    Auksiona keç →
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {auctionNotifications.map((item) => (
                    <div key={item.id} className={`px-5 py-3.5 ${!item.isRead ? "bg-[#0057FF]/3" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-slate-900">{item.title}</p>
                            {!item.isRead && (
                              <span className="h-2 w-2 rounded-full bg-[#0057FF] shrink-0" />
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{item.message}</p>
                          <p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString("az-AZ")}</p>
                          {item.ctaHref && (
                            <Link href={item.ctaHref} className="mt-1.5 inline-block text-xs font-medium text-[#0057FF] hover:underline">
                              Aç →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Profil redaktəsi */}
            <section id="profile" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm scroll-mt-24">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-semibold text-slate-900">Profil</h2>
              </div>
              <div className="p-5">
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

                {/* Account info pills */}
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <PhoneSetupForm initialPhone={profile?.phone} />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Dərin KYC</span>
                    <span className={`font-medium ${deepKyc?.status === "approved" ? "text-emerald-600" : deepKyc?.status === "submitted" ? "text-amber-600" : "text-slate-500"}`}>
                      {kycLabel ?? "Göndərilməyib"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/me/kyc" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
                    Dərin identifikasiya
                  </Link>
                  <Link href="/me/privacy" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
                    Məxfilik hüquqları
                  </Link>
                </div>
              </div>
            </section>

            {/* ── Ödənişlər (sidebar, sabit görünür) ─────────────── */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-slate-900">Ödənişlər</h2>
                  {invoiceCount > 0 && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                      {invoiceCount}
                    </span>
                  )}
                </div>
                <Link href="/me/payments" className="text-xs font-medium text-[#0057FF] hover:underline">
                  Hamısı →
                </Link>
              </div>
              {invoices.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-slate-500">Hələ ödəniş invoysu yoxdur</p>
                  <Link href="/pricing" className="mt-1.5 inline-block text-xs font-medium text-[#0057FF] hover:underline">
                    Planları kəşf et →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {invoices.slice(0, 5).map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/me/invoices/${inv.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-slate-800">{inv.invoiceNumber}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                            {INVOICE_PAYMENT_TYPE_LABELS[inv.paymentType] ?? inv.paymentType}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-400">{inv.description}</p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-slate-900">{inv.amountAzn.toFixed(2)} ₼</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Biznes hesabları */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-semibold text-slate-900">Biznes hesabları</h2>
              </div>
              <div className="p-5">
                <BusinessAccountStatus snapshot={businessSnapshot} sidebar serviceListings={myServiceListings} />
              </div>

            </section>

            {/* Profil etibarlılığı */}
            <TrustCompletenessPanel badges={trustBadges} missing={trustMissing} />

            {/* Yadda saxlanmış axtarışlar */}
            {savedSearches.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="font-semibold text-slate-900">Yadda saxlanmış axtarışlar</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {savedSearches.map((search) => {
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
                      <div key={search.id} className="px-5 py-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-slate-800">{search.name || "Axtarış"}</span>
                          <Link href={searchHref} className="shrink-0 text-xs font-medium text-[#0057FF] hover:underline">Aç →</Link>
                        </div>
                        {parts.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {parts.map((p) => (
                              <span key={p} className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500 border border-slate-100">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Məxfilik */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-semibold text-slate-900">Məxfilik</h2>
              </div>
              <div className="p-5">
                <PrivacyControls variant="compact" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
