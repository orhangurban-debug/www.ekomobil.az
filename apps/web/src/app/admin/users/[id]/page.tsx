import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminUserEditPanel } from "@/components/admin/admin-user-edit-panel";
import { REQUEST_TYPE_LABELS, STATUS_LABELS } from "@/lib/support-contact";
import { hasCapability, resolveEffectivePermissions } from "@/lib/admin-permissions";
import { getServerSessionUser } from "@/lib/auth";
import { getAdminGrantForUser, getAdminUserMembershipProfile } from "@/server/admin-store";

const ROLE_LABELS: Record<string, string> = {
  viewer: "Fərdi istifadəçi",
  dealer: "Salon (dealer rolü)",
  support: "Dəstək",
  admin: "Admin"
};

const LISTING_STATUS: Record<string, string> = {
  active: "Aktiv",
  pending_review: "Yoxlamada",
  rejected: "Rədd edilib",
  archived: "Arxiv",
  inactive: "Deaktiv",
  draft: "Qaralama"
};

const PLAN_LABELS: Record<string, string> = {
  free: "Pulsuz",
  standard: "Standart",
  premium: "Premium",
  vip: "VIP"
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default async function AdminUserMembershipPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const fromSupport = query.from === "support";
  const requestId = typeof query.requestId === "string" ? query.requestId : undefined;
  const highlightListingId = typeof query.listingId === "string" ? query.listingId : undefined;

  const profile = await getAdminUserMembershipProfile(id);
  if (!profile) notFound();

  const sessionUser = await getServerSessionUser();
  const actorGrant = sessionUser ? await getAdminGrantForUser(sessionUser.id) : null;
  const actorPermissions = sessionUser
    ? resolveEffectivePermissions({
        role: sessionUser.role,
        staffType: actorGrant?.staffType ?? null,
        permissions: actorGrant?.permissions ?? null
      })
    : [];
  const canEditRoles = hasCapability(actorPermissions, "users.assign_staff");
  const canDelete =
    hasCapability(actorPermissions, "users.delete") &&
    !profile.user.email.includes("@anonymized.ekomobil.local");

  const displayName = profile.user.fullName?.trim() || profile.user.email;
  const membershipLabel =
    profile.dealerProfile
      ? "Salon üzvü (dealer)"
      : profile.stats.partListings > 0 && profile.stats.vehicleListings === 0
        ? "Mağaza satıcısı"
        : profile.stats.vehicleListings > 0
          ? "Elan verən"
          : "Platforma istifadəçisi";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {fromSupport && (
            <Link
              href={requestId ? `/admin/support-requests?q=${encodeURIComponent(profile.user.email)}` : "/admin/support-requests"}
              className="text-sm font-medium text-[#0891B2] hover:underline"
            >
              ← Müraciət inbox-a qayıt
            </Link>
          )}
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{displayName}</h2>
          <p className="mt-1 text-sm text-slate-500">{profile.user.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{membershipLabel}</span>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">{ROLE_LABELS[profile.user.role] ?? profile.user.role}</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{profile.user.userAccountStatus}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <p className="text-xs text-slate-400">İstifadəçi ID</p>
            <p className="font-mono text-xs text-slate-700">{profile.user.id}</p>
          </div>
          <a
            href={`/api/admin/users/${profile.user.id}/investigation-export`}
            className="btn-secondary inline-flex w-full justify-center text-xs"
            target="_blank"
            rel="noreferrer"
          >
            Araşdırma exportu (JSON)
          </a>
        </div>
      </div>

      {highlightListingId && (
        <div className="rounded-xl border border-[#0891B2]/30 bg-[#0891B2]/5 px-4 py-3 text-sm text-[#0e7490]">
          Müraciətə bağlı elan: <span className="font-mono font-semibold">{highlightListingId.slice(0, 8)}…</span> — aşağıda vurğulanıb.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Elanlar", value: profile.stats.totalListings },
          { label: "Aktiv elan", value: profile.stats.activeListings },
          { label: "Nəqliyyat", value: profile.stats.vehicleListings },
          { label: "Ehtiyat hissə", value: profile.stats.partListings },
          { label: "Müraciətlər", value: profile.stats.supportRequestCount }
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="text-2xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <AdminUserEditPanel
        user={{
          id: profile.user.id,
          email: profile.user.email,
          role: profile.user.role,
          userAccountStatus: profile.user.userAccountStatus,
          penaltyBalanceAzn: profile.user.penaltyBalanceAzn,
          fullName: profile.user.fullName,
          city: profile.user.city,
          phone: profile.user.phone,
          staffType: profile.user.staffType,
          permissions: profile.user.permissions
        }}
        canEditRoles={canEditRoles}
        canDelete={canDelete}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profil məlumatları</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div><dt className="text-xs text-slate-400">Ad</dt><dd className="font-medium">{profile.user.fullName ?? "—"}</dd></div>
            <div><dt className="text-xs text-slate-400">Telefon</dt><dd className="font-medium">{profile.user.phone ?? "—"}</dd></div>
            <div><dt className="text-xs text-slate-400">Şəhər</dt><dd className="font-medium">{profile.user.city ?? "—"}</dd></div>
            <div><dt className="text-xs text-slate-400">Email təsdiqi</dt><dd className="font-medium">{profile.user.emailVerified ? "Təsdiqlənib" : "Gözləyir"}</dd></div>
            <div><dt className="text-xs text-slate-400">Kimlik təsdiqi</dt><dd className="font-medium">{profile.user.isIdentityVerified ? "Bəli" : "Xeyr"}</dd></div>
            <div><dt className="text-xs text-slate-400">Cərimə balansı</dt><dd className="font-medium">{profile.user.penaltyBalanceAzn} ₼</dd></div>
            <div><dt className="text-xs text-slate-400">Qeydiyyat</dt><dd className="font-medium">{formatWhen(profile.user.createdAt)}</dd></div>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Biznes üzvlüyü</h3>
          {profile.dealerProfile ? (
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-semibold text-slate-900">{profile.dealerProfile.name}</p>
              <p className="text-slate-600">{profile.dealerProfile.city} · {profile.dealerProfile.verified ? "Təsdiqlənib" : "Təsdiq gözləyir"}</p>
              <Link href={`/admin/salon-profiles?q=${encodeURIComponent(profile.dealerProfile.name)}`} className="inline-flex text-[#0891B2] hover:underline">
                Salon profilinə bax →
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Salon/mağaza profili yoxdur.</p>
          )}
          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Abunəliklər / planlar</p>
            {profile.subscriptions.length === 0 ? (
              <p className="text-sm text-slate-500">Aktiv biznes planı yoxdur.</p>
            ) : (
              profile.subscriptions.map((sub) => (
                <div key={sub.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-900">{sub.businessType === "dealer" ? "Avtosalon" : "Mağaza"} · {sub.planId}</p>
                  <p className="text-xs text-slate-500">
                    {sub.status}
                    {sub.expiresAt ? ` · bitir: ${formatWhen(sub.expiresAt)}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Elanlar və plan statusu</h3>
          <p className="mt-1 text-xs text-slate-400">Ödəniş planı problemlərini buradan dəqiqləşdirin.</p>
        </div>
        {profile.listings.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">Bu istifadəçinin elanı yoxdur.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Elan</th>
                  <th className="px-4 py-3 text-left">Növ</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Qiymət</th>
                  <th className="px-4 py-3 text-left">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profile.listings.map((listing) => {
                  const highlighted = listing.id === highlightListingId;
                  return (
                    <tr key={listing.id} className={highlighted ? "bg-[#0891B2]/5" : undefined}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{listing.title}</p>
                        <p className="font-mono text-[11px] text-slate-400">{listing.id.slice(0, 8)} · {listing.city}</p>
                      </td>
                      <td className="px-4 py-3">{listing.listingKind === "part" ? "Ehtiyat hissə" : "Nəqliyyat"}</td>
                      <td className="px-4 py-3">
                        <p>{PLAN_LABELS[listing.planType ?? "free"] ?? listing.planType ?? "Pulsuz"}</p>
                        {listing.planExpiresAt && (
                          <p className="text-xs text-slate-400">Bitir: {formatWhen(listing.planExpiresAt)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">{LISTING_STATUS[listing.status] ?? listing.status}</td>
                      <td className="px-4 py-3 font-medium">{listing.priceAzn.toLocaleString("az-AZ")} ₼</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/listings/${listing.id}`} className="text-xs font-medium text-[#0891B2] hover:underline">Saytda bax</Link>
                          <Link href={`/admin/listings?q=${listing.id}`} className="text-xs font-medium text-slate-600 hover:underline">Admin</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Son ödənişlər / fakturalar</h3>
          {profile.invoices.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Faktura qeydi yoxdur.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {profile.invoices.map((invoice) => (
                <li key={invoice.id} className="rounded-xl border border-slate-100 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-900">{invoice.description}</p>
                  <p className="text-xs text-slate-500">
                    {invoice.invoiceNumber} · {invoice.amountAzn.toLocaleString("az-AZ")} ₼ · {formatWhen(invoice.issuedAt)}
                  </p>
                  <Link href={`/admin/invoices?q=${encodeURIComponent(invoice.invoiceNumber)}`} className="text-xs text-[#0891B2] hover:underline">Fakturaya bax</Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Müraciət tarixçəsi</h3>
          {profile.supportRequests.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Müraciət qeydi yoxdur.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {profile.supportRequests.map((req) => (
                <li key={req.id} className="rounded-xl border border-slate-100 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-900">{req.subject}</p>
                  <p className="text-xs text-slate-500">
                    {REQUEST_TYPE_LABELS[req.requestType] ?? req.requestType} · {STATUS_LABELS[req.status] ?? req.status} · {formatWhen(req.createdAt)}
                  </p>
                  <Link href={`/admin/support-requests?q=${encodeURIComponent(req.id.slice(0, 8))}`} className="text-xs text-[#0891B2] hover:underline">Inbox-da aç</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
