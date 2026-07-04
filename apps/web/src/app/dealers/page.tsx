import Link from "next/link";
import { Building2 } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { listPublicDealers } from "@/server/dealer-store";
import { DealersFiltersPanel } from "@/components/dealer/dealers-filters-panel";

function DealerJoinBanner() {
  return (
    <div className="rounded-2xl border border-[#0057FF]/20 bg-[#0057FF]/5 px-6 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-900">Siz salon sahibisinizsə — platforma üzərindən satın</p>
          <p className="mt-1 text-sm text-slate-500">
            Turbo.az-da olduğu kimi: şirkət profili, bütün elanlar bir yerdə, doğrulanmış satıcı etiketi.
            Müraciət 1-2 iş günü ərzində nəzərdən keçirilir.
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>✓ Salon profil səhifəsi</span>
            <span>✓ Bütün elanlar bir yerdə</span>
            <span>✓ Doğrulanmış satıcı etiketi</span>
            <span>✓ İlk 30 gün pulsuz</span>
          </div>
        </div>
        <Link
          href="/dealer/apply"
          className="shrink-0 rounded-xl bg-[#0057FF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0046CC]"
        >
          Salon müraciəti →
        </Link>
      </div>
    </div>
  );
}

function DealerAvatar({ name, logoUrl }: { name: string; logoUrl?: string }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className="h-14 w-14 shrink-0 rounded-2xl border glass-panel border-slate-900/10 object-cover shadow-sm"
      />
    );
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0057FF] text-xl font-bold text-white shadow-sm">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export const metadata = {
  title: "Salonlar | EkoMobil",
  description: "Azərbaycanda avtomobil salonları və salon profillərini kəşf edin."
};

export default async function DealersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const city = typeof params.city === "string" ? params.city : undefined;
  const verified = params.verified === "1" ? true : undefined;
  const dealers = await listPublicDealers({ city, verified, limit: 50 });

  return (
    <div className="min-h-screen bg-white/60">
      <PageHero
        icon={Building2}
        title="Avtomobil salonları"
        subtitle="EkoMobil platformasında təsdiqlənmiş avtomobil satış salonları"
        actions={
          <Link href="/dealer/apply" className="btn-primary text-sm">
            Salon ol →
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <DealersFiltersPanel initialCity={city} initialVerified={verified} />

        {dealers.length === 0 ? (
          <div className="space-y-6">
            <div className="rounded-3xl border glass-panel border-slate-900/10 p-12 text-center">
              <div className="icon-tile icon-tile-amber mx-auto mb-4 h-16 w-16 rounded-2xl">
                <Building2 className="h-8 w-8" strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                {city || verified ? "Bu filtrə uyğun salon tapılmadı" : "Hələ salon yoxdur"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {city || verified
                  ? "Filtrləri dəyişərək yenidən yoxlayın."
                  : "Salonlar tədricən platformaya qoşulur. Kataloq yenilənir."}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/listings" className="btn-primary">Fərdi elanlara bax</Link>
              </div>
            </div>

            {/* Join CTA — always shown */}
            <DealerJoinBanner />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dealers.map((dealer) => (
                <Link
                  key={dealer.id}
                  href={`/dealers/${dealer.id}`}
                  className="group rounded-2xl border glass-panel border-slate-900/10 p-5 transition hover:border-[#0057FF]/50 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <DealerAvatar name={dealer.name} logoUrl={dealer.logoUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold text-slate-900 group-hover:text-[#0057FF]">
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
                  <div className="mt-4 flex items-center justify-between border-t border-slate-900/10 pt-3 text-xs text-slate-500">
                    <span>{dealer.activeListingCount} aktiv elan</span>
                    <span className="text-[#0057FF] group-hover:underline">Profilə bax →</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Join CTA at bottom of listings */}
            <DealerJoinBanner />
          </div>
        )}
      </div>
    </div>
  );
}
