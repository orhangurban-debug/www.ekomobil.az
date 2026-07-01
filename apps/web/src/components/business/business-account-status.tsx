import Link from "next/link";
import type { BusinessAccountSnapshot } from "@/server/business-plan-store";
import { magazaStatusLabel, salonStatusLabel } from "@/lib/business-account";

export function BusinessAccountStatus({
  snapshot,
  compact = false
}: {
  snapshot: BusinessAccountSnapshot;
  compact?: boolean;
}) {
  const salonActive = snapshot.salonRoleApproved && snapshot.salonSubscriptionActive;
  const magazaActive = snapshot.magazaSubscriptionActive;

  if (compact) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <StatusTile
          title="Salon"
          status={salonStatusLabel(snapshot)}
          active={salonActive}
          href={salonActive ? "/dealer" : "/dealer/apply"}
          actionLabel={salonActive ? "Panel" : "Müraciət"}
        />
        <StatusTile
          title="Mağaza"
          status={magazaStatusLabel(snapshot)}
          active={magazaActive}
          href={magazaActive ? "/parts/publish" : "/parts/apply"}
          actionLabel={magazaActive ? "Elan ver" : "Aktiv et"}
        />
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
          primaryLabel={salonActive ? "Salon paneli" : "Salon müraciəti"}
          secondaryHref="/pricing#business"
          secondaryLabel="Salon planları"
        />
        <VerticalCard
          emoji="📦"
          title="Ehtiyat hissə mağazası"
          description="SKU kataloqu, toplu yükləmə, mağaza analitikası."
          status={magazaStatusLabel(snapshot)}
          active={magazaActive}
          primaryHref={magazaActive ? "/parts/publish" : "/parts/apply"}
          primaryLabel={magazaActive ? "Hissə elanı" : "Mağaza müraciəti"}
          secondaryHref="/pricing#parts-store"
          secondaryLabel="Mağaza planları"
        />
      </div>
    </section>
  );
}

function StatusTile({
  title,
  status,
  active,
  href,
  actionLabel
}: {
  title: string;
  status: string;
  active: boolean;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${active ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200"}`}>
      <div className="text-sm font-medium text-slate-900">{title}</div>
      <div className={`mt-1 text-xs ${active ? "text-emerald-700" : "text-slate-500"}`}>{status}</div>
      <Link href={href} className="mt-2 inline-block text-xs font-medium text-[#0891B2] hover:underline">
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
  secondaryLabel
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
}) {
  return (
    <div className={`rounded-2xl border p-5 ${active ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">{emoji}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
          <p className={`mt-2 text-xs font-medium ${active ? "text-emerald-700" : "text-slate-500"}`}>{status}</p>
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
