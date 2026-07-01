import Link from "next/link";
import { Building2, Store } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { PagePublishStrip } from "@/components/ui/page-publish-strip";
import { listPublicDealers } from "@/server/dealer-store";

function DealerAvatar({ name, logoUrl }: { name: string; logoUrl?: string }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className="h-14 w-14 shrink-0 rounded-2xl border border-slate-200 bg-white object-cover shadow-sm"
      />
    );
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0891B2] text-xl font-bold text-white shadow-sm">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export const metadata = {
  title: "Salonlar | EkoMobil",
  description: "Azərbaycanda avtomobil salonları və diler profillərini kəşf edin."
};

export default async function DealersPage() {
  const dealers = await listPublicDealers();

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        icon={Building2}
        title="Salonlar"
        subtitle="EkoMobil platformasında qeydiyyatdan keçmiş avtomobil satış salonları"
      />

      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <PagePublishStrip
          icon={Store}
          tone="amber"
          title="Salon sahibisiniz?"
          description="Biznes planı ilə panel, CRM və geniş elan imkanlarından yararlanın."
          primaryLabel="Salon müraciəti"
          primaryHref="/dealer/apply"
          secondaryLabel="Biznes planları"
          secondaryHref="/pricing#business"
        />

        {dealers.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <div className="icon-tile icon-tile-amber mx-auto mb-4 h-16 w-16 rounded-2xl">
              <Building2 className="h-8 w-8" strokeWidth={2} aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Hələ salon yoxdur</h2>
            <p className="mt-2 text-sm text-slate-500">
              Salonlar platforma tərəfindən mərhələli şəkildə əlavə olunur. Tezliklə burada salon profilləri görünəcək.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/listings" className="btn-primary">Elanlara bax</Link>
              <Link href="/pricing#business" className="btn-secondary">Salon planları</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dealers.map((dealer) => (
              <Link
                key={dealer.id}
                href={`/dealers/${dealer.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0891B2]/50 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <DealerAvatar name={dealer.name} logoUrl={dealer.logoUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-slate-900 group-hover:text-[#0891B2]">
                        {dealer.name}
                      </h3>
                      {dealer.verified && (
                        <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{dealer.city}</p>
                    {dealer.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{dealer.description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>{dealer.activeListingCount} aktiv elan</span>
                  <span className="text-[#0891B2] group-hover:underline">Profilə bax →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
