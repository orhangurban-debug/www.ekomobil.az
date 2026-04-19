import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  SERVICE_PROVIDER_TYPE_LABELS,
  getServiceListingBySlug
} from "@/lib/services-marketplace";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getServiceListingBySlug(slug);
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
  const item = getServiceListingBySlug(slug);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/services" className="hover:text-slate-900">Servislər</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{item.name}</span>
      </nav>

      {/* Profil header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-bold text-slate-400">
              {item.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{item.name}</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {SERVICE_PROVIDER_TYPE_LABELS[item.providerType]} • {item.city}
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-center">
            <div className="text-xl font-bold text-emerald-700">{item.rating.toFixed(1)} ★</div>
            <div className="text-xs text-emerald-700">{item.reviewCount} rəy</div>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-slate-700">{item.about}</p>

        {/* Əlaqə düymələri — görkəmli yerdə */}
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`tel:${item.phone}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0891B2] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0891B2]/90 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            Zəng et
          </a>
          <a
            href={`https://wa.me/${item.whatsapp.replace("+", "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100 transition"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.122 1.523 5.855L.057 23.996l6.305-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.032-1.384l-.36-.214-3.733.979.998-3.645-.235-.374A9.818 9.818 0 1112 21.818z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </div>

      {/* Detallı məlumat */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {/* Xidmətlər */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Təqdim olunan xidmətlər</h2>
          <ul className="mt-3 space-y-2">
            {item.services.map((service) => (
              <li key={service} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0891B2]" />
                {service}
              </li>
            ))}
          </ul>
        </div>

        {/* Göstəricilər */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Məlumat</h2>
          <dl className="mt-3 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <dt className="text-slate-500">Şəhər</dt>
              <dd className="font-medium text-slate-800">{item.city}</dd>
            </div>
            <div className="flex items-center justify-between text-sm">
              <dt className="text-slate-500">Kateqoriya</dt>
              <dd className="font-medium text-slate-800">{SERVICE_PROVIDER_TYPE_LABELS[item.providerType]}</dd>
            </div>
            <div className="flex items-center justify-between text-sm">
              <dt className="text-slate-500">Orta cavab</dt>
              <dd className="font-medium text-slate-800">~{item.responseMinutes} dəqiqə</dd>
            </div>
            <div className="flex items-center justify-between text-sm">
              <dt className="text-slate-500">Reytinq</dt>
              <dd className="font-medium text-emerald-700">{item.rating.toFixed(1)} ★ ({item.reviewCount} rəy)</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Sertifikasiyalar */}
      {item.certifications && item.certifications.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Sertifikasiya və akkreditasiya</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.certifications.map((cert) => (
              <span key={cert} className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        EkoMobil bu profili məlumat məqsədilə təqdim edir. Xidmət keyfiyyəti və texniki nəticə xidmət göstərənin
        məsuliyyətindədir. Platforma hüquqi zəmanət vermir.
      </div>

      {/* Geri */}
      <div className="mt-6">
        <Link href="/services" className="text-sm text-[#0891B2] hover:underline">
          ← Bütün servisləre qayıt
        </Link>
      </div>
    </div>
  );
}
