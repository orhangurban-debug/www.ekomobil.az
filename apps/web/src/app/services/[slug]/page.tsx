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
    title: `${item.name} | Servis profili`,
    description: `${item.name} (${item.city}) üzrə xidmət profili, əlaqə məlumatları və təqdim olunan xidmətlər.`
  };
}

export default async function ServiceProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const item = getServiceListingBySlug(slug);
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/services" className="hover:text-slate-900">
          Servislər
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{item.name}</span>
      </nav>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{item.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {SERVICE_PROVIDER_TYPE_LABELS[item.providerType]} • {item.city}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 px-4 py-2 text-right">
            <div className="text-lg font-semibold text-emerald-700">{item.rating.toFixed(1)} ★</div>
            <div className="text-xs text-emerald-800">{item.reviewCount} rəy</div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-700">{item.about}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Xidmət elanları</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {item.services.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Əlaqə və göstəricilər</h2>
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <p>Orta cavab müddəti: {item.responseMinutes} dəqiqə</p>
              <p>Telefon: {item.phone}</p>
              <p>WhatsApp: {item.whatsapp}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:${item.phone}`} className="btn-secondary text-sm">Zəng et</a>
              <a href={`https://wa.me/${item.whatsapp.replace("+", "")}`} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {item.certifications && item.certifications.length > 0 && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Sertifikasiya / akkreditasiya</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.certifications.map((cert) => (
                <span key={cert} className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          EkoMobil bu profilləri məlumat və əlaqə məqsədilə təqdim edir. Xidmət keyfiyyəti və yekun texniki nəticə xidmət
          göstərən tərəfin məsuliyyətindədir.
        </div>
      </div>
    </div>
  );
}
