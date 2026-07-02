import { Car, ShieldCheck, Gavel, Users } from "lucide-react";

interface PlatformStatsBarProps {
  activeCount: number;
}

export function PlatformStatsBar({ activeCount }: PlatformStatsBarProps) {
  const stats = [
    {
      icon: Car,
      value: activeCount > 0 ? activeCount.toLocaleString("az-AZ") : "—",
      label: "Aktiv elan"
    },
    {
      icon: ShieldCheck,
      value: "VIN+",
      label: "Yoxlama sistemi"
    },
    {
      icon: Gavel,
      value: "Canlı",
      label: "Auksion platforması"
    },
    {
      icon: Users,
      value: "4 tip",
      label: "Hesab növü"
    }
  ];

  return (
    <section className="border-b border-slate-900/8 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0057FF]/10 text-[#0057FF]">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
