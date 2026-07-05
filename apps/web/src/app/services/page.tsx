import Link from "next/link";
import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { ServicesFiltersPanel } from "@/components/services/services-filters-panel";
import { SERVICE_PROVIDER_TYPE_LABELS, type ServiceProviderType } from "@/lib/services-marketplace";
import { listApprovedServiceListings } from "@/server/service-listing-store";

export const metadata: Metadata = {
  title: "Servislər və ustalar | EkoMobil",
  description:
    "Ekspertiza, rəsmi servis, dəmirçi, elektrik və digər avtomobil xidmətləri. EkoMobil-də xidmət təminatçıları və ustalar."
};

export default async function ServicesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const providerType = typeof params.type === "string" ? (params.type as ServiceProviderType) : undefined;
  const city = typeof params.city === "string" ? params.city : undefined;
  const listings = await listApprovedServiceListings({ providerType, city });

  return (
    <div>
      <PageHero
        icon={Wrench}
        title="Servislər"
        subtitle={`${listings.length} təsdiqlənmiş servis və usta tapıldı`}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-64">
            <ServicesFiltersPanel initialQuery={{ providerType, city }} />
          </aside>

          <div className="flex-1">
            {listings.length === 0 ? (
              <div className="glass-panel flex flex-col items-center gap-3 p-10 text-center">
                <Wrench className="h-10 w-10 text-slate-300" strokeWidth={1.5} aria-hidden="true" />
                <p className="text-sm font-medium text-slate-700">Bu filtrə uyğun təsdiqlənmiş servis tapılmadı.</p>
                <p className="text-xs text-slate-500">Filtrləri dəyişərək yenidən axtarın.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {listings.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/services/${item.slug}`}
                    className="feature-card text-left transition hover:border-[#0057FF]/40 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/63 text-lg font-bold text-slate-500">
                        {item.name.charAt(0)}
                      </div>
                      <div className="rounded-lg bg-emerald-500/10 px-2 py-1 text-center">
                        <div className="text-sm font-bold text-emerald-700">{item.rating.toFixed(1)} ★</div>
                      </div>
                    </div>
                    <h3 className="mt-3 truncate font-semibold text-slate-900">{item.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {SERVICE_PROVIDER_TYPE_LABELS[item.providerType]} • {item.city}
                    </p>
                    {item.services.length > 0 && (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500">{item.services.slice(0, 4).join(", ")}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {/* Provider join — at the bottom, for service providers visiting the page */}
            <div className="mt-10 rounded-2xl border border-slate-900/10 bg-white/60 px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Siz servis və ya usta sahibisinizsə</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Profilinizi yerləşdirin — müştərilər birbaşa sizinlə əlaqə saxlasın.
                    Müraciət 1–2 iş günü ərzində nəzərdən keçirilir.
                  </p>
                </div>
                <Link
                  href="/partners/inspection"
                  className="shrink-0 rounded-xl border border-[#0057FF]/30 bg-[#0057FF]/5 px-5 py-2.5 text-sm font-semibold text-[#0057FF] transition hover:bg-[#0057FF]/10"
                >
                  Servis qeydiyyatı →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
