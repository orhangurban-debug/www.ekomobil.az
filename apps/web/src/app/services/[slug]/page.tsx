import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SERVICE_PROVIDER_TYPE_LABELS } from "@/lib/services-marketplace";
import { getApprovedServiceListingBySlug } from "@/server/service-listing-store";
import { ServiceInquiryForm } from "@/components/partners/service-inquiry-form";
import { ServiceStatsTracker } from "@/components/partners/service-stats-tracker";
import { ServiceContactActions } from "@/components/partners/service-contact-actions";
import { buildBusinessLocations } from "@/components/business/business-branches-display";
import { PublicProfileShell } from "@/components/seller/public-profile-shell";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getApprovedServiceListingBySlug(slug);
  if (!item) {
    return { title: "Servis profili tapılmadı | EkoMobil" };
  }
  const kindLabel =
    item.providerType === "inspection_company" ? "Ekspertiza" : "Servis";
  return {
    title: `${item.name} | ${kindLabel} profili · EkoMobil`,
    description: `${item.name} (${item.city}) — ${item.about}`
  };
}

export default async function ServiceProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const item = await getApprovedServiceListingBySlug(slug);
  if (!item) notFound();

  const isInspection = item.providerType === "inspection_company";
  const locations = buildBusinessLocations({
    primaryCity: item.city,
    primaryLabel: item.name,
    primaryAddress: item.address,
    primaryMapUrl: item.mapUrl,
    primaryPhone: item.phone,
    branches: item.branches
  });

  return (
    <>
      <ServiceStatsTracker slug={slug} />
      <PublicProfileShell
        name={item.name}
        profileKind={isInspection ? "inspection" : "service"}
        verified
        city={item.city}
        coverUrl={null}
        logoUrl={item.imageUrls?.[0] ?? null}
        description={item.about}
        workingHours={null}
        address={item.address}
        mapUrl={item.mapUrl}
        locations={locations}
        trustBadges={[]}
        listingCount={item.reviewCount}
        listingCountLabel={`${item.rating.toFixed(1)} ★ · rəy`}
        metaChips={
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
            {SERVICE_PROVIDER_TYPE_LABELS[item.providerType]}
            {" · "}
            Cavab: ~{item.responseMinutes} dəq
          </span>
        }
        ctaSlot={
          <div className="mt-3">
            <ServiceContactActions slug={slug} phone={item.phone} whatsapp={item.whatsapp} />
          </div>
        }
      >
        <nav className="text-sm text-slate-500">
          <Link href="/services" className="hover:text-slate-900">
            Servislər
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">{item.name}</span>
        </nav>

        {item.imageUrls && item.imageUrls.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Qalereya</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {item.imageUrls.slice(0, 4).map((imageUrl, index) => (
                <a
                  key={imageUrl}
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={`${item.name} şəkil ${index + 1}`}
                    className="h-44 w-full object-cover"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <ServiceInquiryForm slug={slug} />

          <div className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Təqdim olunan xidmətlər</h2>
              <ul className="mt-3 space-y-2">
                {item.services.map((service) => (
                  <li key={service} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0057FF]" />
                    {service}
                  </li>
                ))}
              </ul>
            </section>

            {item.certifications && item.certifications.length > 0 && (
              <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-slate-900">Sertifikasiya</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-400">
          EkoMobil bu profili məlumat məqsədilə təqdim edir. Xidmət keyfiyyəti və texniki nəticə xidmət
          göstərənin məsuliyyətindədir. Platforma hüquqi zəmanət vermir.
        </p>

        <Link href="/services" className="inline-flex text-sm font-medium text-[#0057FF] hover:underline">
          ← Bütün servislərə qayıt
        </Link>
      </PublicProfileShell>
    </>
  );
}
