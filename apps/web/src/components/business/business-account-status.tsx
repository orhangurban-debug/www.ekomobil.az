import Link from "next/link";
import type { BusinessAccountSnapshot } from "@/server/business-plan-store";
import { magazaStatusLabel, salonStatusLabel } from "@/lib/business-account";
import type { ServiceListingRecord } from "@/lib/services-marketplace";

function daysLeft(iso?: string): number | null {
  if (!iso) return null;
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  return d;
}

function ExpiryBadge({ expiresAt, isTrial }: { expiresAt?: string; isTrial?: boolean }) {
  const days = daysLeft(expiresAt);
  if (days === null) return null;
  const label = expiresAt
    ? new Date(expiresAt).toLocaleDateString("az-AZ", { day: "numeric", month: "short" })
    : null;
  const isExpiringSoon = days <= 7;
  return (
    <div className={`mt-2 rounded-lg px-2.5 py-1.5 text-xs ${
      isExpiringSoon
        ? "border border-amber-200 bg-amber-50 text-amber-700"
        : "border border-emerald-200 bg-emerald-50 text-emerald-700"
    }`}>
      {isTrial && <span className="mr-1 font-semibold">Sınaq planı —</span>}
      {days > 0
        ? <>{label} tarixinə qədər (<span className="font-semibold">{days} gün qalıb</span>)</>
        : <span className="font-semibold">Müddəti bitib</span>
      }
    </div>
  );
}

export function BusinessAccountStatus({
  snapshot,
  compact = false,
  sidebar = false,
  serviceListings = []
}: {
  snapshot: BusinessAccountSnapshot;
  compact?: boolean;
  /** sidebar=true: iki item şaquli sıralanır — dar kontekst üçün */
  sidebar?: boolean;
  serviceListings?: ServiceListingRecord[];
}) {
  const salonActive = snapshot.salonRoleApproved && snapshot.salonSubscriptionActive;
  const magazaActive = snapshot.magazaSubscriptionActive;

  // Partition service listings:
  // inspection_company → "Ekspertiza mərkəzi"
  // everything else    → "Servis / Usta profili"
  const servisListings  = serviceListings.filter((s) => s.providerType !== "inspection_company");
  const ekspertListings = serviceListings.filter((s) => s.providerType === "inspection_company");

  if (compact) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <StatusTile
          title="Salon"
          status={salonStatusLabel(snapshot)}
          active={salonActive}
          href={salonActive ? "/dealer" : "/dealer/apply"}
          actionLabel={salonActive ? "Panel" : "Yarat"}
          expiresAt={snapshot.salonSubscriptionExpiresAt}
          isTrial={snapshot.salonIsTrial}
        />
        <StatusTile
          title="Mağaza"
          status={magazaStatusLabel(snapshot)}
          active={magazaActive}
          href={magazaActive ? "/parts/store" : "/parts/apply"}
          actionLabel={magazaActive ? "Panel" : "Yarat"}
          expiresAt={snapshot.magazaSubscriptionExpiresAt}
          isTrial={snapshot.magazaIsTrial}
        />
      </div>
    );
  }

  if (sidebar) {
    return (
      <div className="space-y-2.5">
        <SidebarRow
          emoji="🚗"
          title="Avtomobil salonu"
          status={salonStatusLabel(snapshot)}
          active={salonActive}
          primaryHref={salonActive ? "/dealer" : "/dealer/apply"}
          primaryLabel={salonActive ? "Salon paneli" : "Yarat"}
          secondaryHref="/pricing#dealer"
          expiresAt={snapshot.salonSubscriptionExpiresAt}
          isTrial={snapshot.salonIsTrial}
        />
        <SidebarRow
          emoji="📦"
          title="Ehtiyat hissə mağazası"
          status={magazaStatusLabel(snapshot)}
          active={magazaActive}
          primaryHref={magazaActive ? "/parts/store" : "/parts/apply"}
          primaryLabel={magazaActive ? "Mağaza paneli" : "Yarat"}
          secondaryHref="/pricing#parts-store"
          expiresAt={snapshot.magazaSubscriptionExpiresAt}
          isTrial={snapshot.magazaIsTrial}
        />
        <ServiceRow
          emoji="🔧"
          title="Servis / Usta profili"
          createHref="/partners/inspection"
          dashboardHref="/partners/my-services"
          listings={servisListings}
        />
        <ServiceRow
          emoji="🔍"
          title="Ekspertiza mərkəzi"
          createHref="/partners/inspection?type=inspection_company"
          dashboardHref="/partners/my-services"
          listings={ekspertListings}
        />
        <Link href="/pricing" className="mt-1 block text-center text-xs text-slate-400 hover:text-[#0057FF] transition">
          Bütün planları gör →
        </Link>
      </div>
    );
  }

  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Biznes hesabları</h2>
          <p className="mt-1 text-sm text-slate-500">
            Eyni hesabda salon və mağaza ayrıca aktivləşir — biri olmaq digərini tələb etmir.
          </p>
        </div>
        <Link href="/pricing" className="btn-secondary text-sm shrink-0">
          Planlar
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <VerticalCard
          emoji="🚗"
          title="Avtomobil salonu"
          description="Avtomobil inventarı, salon paneli, müştəri sorğuları, CSV idxalı."
          status={salonStatusLabel(snapshot)}
          active={salonActive}
          primaryHref={salonActive ? "/dealer" : "/dealer/apply"}
          primaryLabel={salonActive ? "Salon paneli" : "Yarat"}
          secondaryHref="/pricing#dealer"
          secondaryLabel="Salon planları"
          expiresAt={snapshot.salonSubscriptionExpiresAt}
          isTrial={snapshot.salonIsTrial}
        />
        <VerticalCard
          emoji="📦"
          title="Ehtiyat hissə mağazası"
          description="SKU kataloqu, toplu yükləmə, mağaza analitikası."
          status={magazaStatusLabel(snapshot)}
          active={magazaActive}
          primaryHref={magazaActive ? "/parts/store" : "/parts/apply"}
          primaryLabel={magazaActive ? "Mağaza paneli" : "Yarat"}
          secondaryHref="/pricing#parts-store"
          secondaryLabel="Mağaza planları"
          expiresAt={snapshot.magazaSubscriptionExpiresAt}
          isTrial={snapshot.magazaIsTrial}
        />
      </div>
    </section>
  );
}

function ServiceRow({
  emoji,
  title,
  createHref,
  dashboardHref,
  listings = []
}: {
  emoji: string;
  title: string;
  createHref: string;
  dashboardHref: string;
  listings?: ServiceListingRecord[];
}) {
  const approvedListings = listings.filter((l) => l.status === "approved");
  const pendingListings  = listings.filter((l) => l.status === "pending");
  const hasActive = approvedListings.length > 0;
  const hasPending = pendingListings.length > 0;

  return (
    <div className={`rounded-xl border px-3.5 py-3 ${
      hasActive
        ? "border-emerald-200 bg-emerald-50/40"
        : hasPending
        ? "border-amber-200 bg-amber-50/40"
        : "border-slate-200 bg-slate-50"
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0">{emoji}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
              {hasActive && (
                <span className="shrink-0 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">Aktiv</span>
              )}
              {!hasActive && hasPending && (
                <span className="shrink-0 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-white">Gözləmədə</span>
              )}
            </div>
            {hasActive ? (
              <p className="text-xs text-emerald-700">{approvedListings.length} aktiv profil</p>
            ) : hasPending ? (
              <p className="text-xs text-amber-700">Profil yoxlanılır</p>
            ) : (
              <p className="text-xs text-slate-500">Profil yarat · Ani aktiv olur</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {hasActive ? (
            <>
              <Link
                href={`/services/${approvedListings[0].slug}`}
                className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Profilə bax
              </Link>
              <Link
                href={dashboardHref}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:text-[#0057FF]"
              >
                İdarə et
              </Link>
            </>
          ) : hasPending ? (
            <>
              <Link
                href={dashboardHref}
                className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
              >
                Profillərim
              </Link>
              <Link
                href={createHref}
                className="rounded-lg border border-[#0057FF]/20 bg-[#0057FF]/5 px-2.5 py-1 text-xs font-semibold text-[#0057FF] transition hover:bg-[#0057FF]/10"
              >
                + Yeni
              </Link>
            </>
          ) : (
            <>
              <Link
                href={dashboardHref}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:text-[#0057FF]"
              >
                Profillərim
              </Link>
              <Link
                href={createHref}
                className="rounded-lg border border-[#0057FF]/20 bg-[#0057FF]/5 px-2.5 py-1 text-xs font-semibold text-[#0057FF] transition hover:bg-[#0057FF]/10"
              >
                Yarat
              </Link>
            </>
          )}
        </div>
      </div>
      {/* show multiple active profiles if user has more than one */}
      {approvedListings.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {approvedListings.map((l) => (
            <Link
              key={l.id}
              href={`/services/${l.slug}`}
              className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
            >
              {l.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarRow({
  emoji,
  title,
  status,
  active,
  primaryHref,
  primaryLabel,
  secondaryHref,
  expiresAt,
  isTrial
}: {
  emoji: string;
  title: string;
  status: string;
  active: boolean;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  expiresAt?: string;
  isTrial?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3.5 ${active ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0">{emoji}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
            <p className={`text-xs ${active ? "text-emerald-700 font-medium" : "text-slate-500"}`}>{status}</p>
          </div>
        </div>
        <Link
          href={primaryHref}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            active
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-[#0057FF] text-white hover:bg-[#004ADF]"
          }`}
        >
          {primaryLabel}
        </Link>
      </div>
      {active && expiresAt && (
        <ExpiryBadge expiresAt={expiresAt} isTrial={isTrial} />
      )}
      {!active && (
        <Link href={secondaryHref} className="mt-2 block text-xs text-slate-400 hover:text-[#0057FF] transition">
          Planları gör →
        </Link>
      )}
    </div>
  );
}

function StatusTile({
  title,
  status,
  active,
  href,
  actionLabel,
  expiresAt,
  isTrial
}: {
  title: string;
  status: string;
  active: boolean;
  href: string;
  actionLabel: string;
  expiresAt?: string;
  isTrial?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${active ? "border-emerald-500/25 bg-emerald-500/10" : "border-slate-900/10"}`}>
      <div className="text-sm font-medium text-slate-900">{title}</div>
      <div className={`mt-1 text-xs ${active ? "text-emerald-700" : "text-slate-500"}`}>{status}</div>
      {active && <ExpiryBadge expiresAt={expiresAt} isTrial={isTrial} />}
      <Link href={href} className="mt-2 inline-block text-xs font-medium text-[#0057FF] hover:underline">
        {actionLabel} →
      </Link>
    </div>
  );
}

function VerticalCard({
  emoji,
  title,
  description,
  status,
  active,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  expiresAt,
  isTrial
}: {
  emoji: string;
  title: string;
  description: string;
  status: string;
  active: boolean;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  expiresAt?: string;
  isTrial?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${active ? "border-emerald-500/25 bg-emerald-500/10" : "border-slate-900/10"}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">{emoji}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
          <p className={`mt-2 text-xs font-medium ${active ? "text-emerald-700" : "text-slate-500"}`}>{status}</p>
          {active && <ExpiryBadge expiresAt={expiresAt} isTrial={isTrial} />}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={primaryHref} className="btn-primary text-xs">
          {primaryLabel}
        </Link>
        <Link href={secondaryHref} className="btn-secondary text-xs">
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}
