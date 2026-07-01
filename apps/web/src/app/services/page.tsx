import Link from "next/link";
import { ContactActionButton } from "@/components/support/contact-action-button";
import type { Metadata } from "next";
import { SERVICE_PROVIDER_GROUPS, SERVICE_PROVIDER_TYPE_LABELS } from "@/lib/services-marketplace";

export const metadata: Metadata = {
  title: "Servislər və ustalar | EkoMobil",
  description:
    "Ekspertiza, rəsmi servis, dəmirçi, elektrik və digər avtomobil xidmətləri. EkoMobil-də servis provayderləri və ustalar."
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Ana səhifə</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Servislər</span>
      </nav>

      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Avtomobil servisləri</h1>
        <p className="mt-2 text-slate-500 max-w-xl mx-auto">
          Ekspertiza, rəsmi servis, mexanik, elektrik — bütün avtomobil xidmətləri bir platformada
        </p>
      </div>

      {/* Service type grid */}
      <div className="mb-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_PROVIDER_GROUPS.map((group) => (
          <div key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{group.label}</p>
            <ul className="space-y-1">
              {group.types.map((type) => (
                <li key={type} className="text-sm text-slate-600">
                  {SERVICE_PROVIDER_TYPE_LABELS[type]}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Partner CTA */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0c1a2e] to-[#0e3a5a] p-8 text-center sm:p-12">
        <div className="mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#0891B2]/30 bg-[#0891B2]/10 px-3 py-1 text-xs font-semibold text-[#67e8f9]">
            Tərəfdaşlıq
          </span>
          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            Servis biznesisinizi EkoMobil-də tanıdın
          </h2>
          <p className="mt-3 text-sm text-white/60 leading-relaxed">
            Ekspertiza şirkəti, mexanik, rəsmi servis və ya avto elektrik — biznesisinizi
            minlərlə potensial müştəriyə çatdırın.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <ContactActionButton intent="service" className="rounded-xl bg-[#0891B2] px-8 py-3 font-semibold text-white transition hover:bg-[#0e7490]" />
            <Link href="/pricing#business" className="rounded-xl border border-white/20 px-8 py-3 font-semibold text-white transition hover:bg-white/10">
              Biznes planları
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
