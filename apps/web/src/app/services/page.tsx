import Link from "next/link";
import type { Metadata } from "next";
import {
  Car,
  Gauge,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
  type LucideIcon
} from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { SERVICE_PROVIDER_GROUPS, SERVICE_PROVIDER_TYPE_LABELS } from "@/lib/services-marketplace";

export const metadata: Metadata = {
  title: "Servislər və ustalar | EkoMobil",
  description:
    "Ekspertiza, rəsmi servis, dəmirçi, elektrik və digər avtomobil xidmətləri. EkoMobil-də servis provayderləri və ustalar."
};

const groupIcons: Record<string, LucideIcon> = {
  official: ShieldCheck,
  mechanic: Wrench,
  electric: Zap,
  tech: Gauge,
  comfort: Sparkles,
  wheel: Car
};

export default function ServicesPage() {
  return (
    <div>
      <PageHero
        icon={Wrench}
        badge="Xidmətlər"
        title="Avtomobil servisləri"
        subtitle="Ekspertiza, rəsmi servis, mexanik, elektrik — bütün avtomobil xidmətləri bir platformada"
      />

      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_PROVIDER_GROUPS.map((group) => {
            const Icon = groupIcons[group.id] ?? Car;
            return (
              <div key={group.id} className="feature-card text-left">
                <div className="icon-tile icon-tile-teal mb-3">
                  <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{group.label}</p>
                <ul className="mt-3 space-y-1.5">
                  {group.types.map((type) => (
                    <li key={type} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="h-1 w-1 rounded-full bg-brand-400" />
                      {SERVICE_PROVIDER_TYPE_LABELS[type]}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-[#0c1a2e] to-[#0e3a5a] p-8 text-center sm:p-12">
          <div className="mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              Tərəfdaşlıq
            </span>
            <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
              Servis biznesisinizi EkoMobil-də tanıdın
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Ekspertiza şirkəti, mexanik, rəsmi servis və ya avto elektrik — biznesisinizi
              minlərlə potensial müştəriyə çatdırın.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/pricing#business" className="rounded-xl border border-white/20 px-8 py-3 font-semibold text-white transition hover:bg-white/10">
                Biznes planları
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
