import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SERVICE_PROVIDER_TYPE_LABELS } from "@/lib/services-marketplace";
import { getApprovedServiceListingBySlug } from "@/server/service-listing-store";
import { ServiceInquiryForm } from "@/components/partners/service-inquiry-form";
import { ServiceStatsTracker } from "@/components/partners/service-stats-tracker";
import { ServiceContactActions } from "@/components/partners/service-contact-actions";

// Admin təsdiqləri istənilən vaxt baş verə bilər (yeni servis təsdiqlənməsi/rədd edilməsi),
// ona görə bu səhifə Full Route Cache-ə salınmamalıdır — əks halda yeni təsdiqlənmiş profillər
// keş təzələnənə qədər 404 qala bilər (məsələn, `dynamicParams` fallback keşləməsi ilk sorğuda
// baş verən keçici bir xətanı belə əbədi keşləyə bilər).
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
  return {
    title: `${item.name} | Servis profili · EkoMobil`,
    description: `${item.name} (${item.city}) — ${item.about}`
  };
}

export default async function ServiceProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const item = await getApprovedServiceListingBySlug(slug);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <ServiceStatsTracker slug={slug} />
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/services" className="hover:text-slate-900">Servislər</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{item.name}</span>
      </nav>

      {/* Profil header */}
      <div className="rounded-2xl border glass-panel border-slate-900/10 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/63 text-2xl font-bold text-slate-400">
              {item.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{item.name}</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {SERVICE_PROVIDER_TYPE_LABELS[item.providerType]} • {item.city}
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-center">
            <div className="text-xl font-bold text-emerald-700">{item.rating.toFixed(1)} ★</div>
            <div className="text-xs text-emerald-700">{item.reviewCount} rəy</div>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-slate-700">{item.about}</p>

        {item.imageUrls && item.imageUrls.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {item.imageUrls.slice(0, 4).map((imageUrl, index) => (
              <a key={imageUrl} href={imageUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-900/10 bg-white/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt={`${item.name} şəkil ${index + 1}`} className="h-48 w-full object-cover" />
              </a>
            ))}
          </div>
        )}

        <ServiceContactActions slug={slug} phone={item.phone} whatsapp={item.whatsapp} />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <ServiceInquiryForm slug={slug} />

        {/* Detallı məlumat */}
        <div className="space-y-4">
        {/* Xidmətlər */}
        <div className="rounded-2xl border glass-panel border-slate-900/10 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Təqdim olunan xidmətlər</h2>
          <ul className="mt-3 space-y-2">
            {item.services.map((service) => (
              <li key={service} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0057FF]" />
                {service}
              </li>
            ))}
          </ul>
        </div>

        {/* Göstəricilər */}
        <div className="rounded-2xl border glass-panel border-slate-900/10 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Məlumat</h2>
          <dl className="mt-3 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <dt className="text-slate-500">Şəhər</dt>
              <dd className="font-medium text-slate-900">{item.city}</dd>
            </div>
            {item.address && (
              <div className="flex items-start justify-between gap-4 text-sm">
                <dt className="text-slate-500">Ünvan</dt>
                <dd className="text-right font-medium text-slate-900">{item.address}</dd>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <dt className="text-slate-500">Kateqoriya</dt>
              <dd className="font-medium text-slate-900">{SERVICE_PROVIDER_TYPE_LABELS[item.providerType]}</dd>
            </div>
            <div className="flex items-center justify-between text-sm">
              <dt className="text-slate-500">Orta cavab</dt>
              <dd className="font-medium text-slate-900">~{item.responseMinutes} dəqiqə</dd>
            </div>
            <div className="flex items-center justify-between text-sm">
              <dt className="text-slate-500">Reytinq</dt>
              <dd className="font-medium text-emerald-700">{item.rating.toFixed(1)} ★ ({item.reviewCount} rəy)</dd>
            </div>
          </dl>
          {item.mapUrl && (
            <div className="mt-4">
              <a
                href={item.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg border border-slate-900/10 px-3 py-2 text-sm text-[#0057FF] hover:bg-slate-900/5"
              >
                Xəritədə aç
              </a>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Sertifikasiyalar */}
      {item.certifications && item.certifications.length > 0 && (
        <div className="mt-4 rounded-2xl border glass-panel border-slate-900/10 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Sertifikasiya və akkreditasiya</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.certifications.map((cert) => (
              <span key={cert} className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 rounded-xl alert-warning border p-4 text-xs leading-relaxed text-amber-700">
        EkoMobil bu profili məlumat məqsədilə təqdim edir. Xidmət keyfiyyəti və texniki nəticə xidmət göstərənin
        məsuliyyətindədir. Platforma hüquqi zəmanət vermir.
      </div>

      {/* Geri */}
      <div className="mt-6">
        <Link href="/services" className="text-sm text-[#0057FF] hover:underline">
          ← Bütün servisləre qayıt
        </Link>
      </div>
    </div>
  );
}
