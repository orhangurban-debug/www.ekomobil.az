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
      <PageHero icon={Wrench} title="Servislər" />

      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </div>
  );
}
