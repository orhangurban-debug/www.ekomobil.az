import { Car } from "lucide-react";

interface PlatformStatsBarProps {
  activeCount: number;
}

export function PlatformStatsBar({ activeCount }: PlatformStatsBarProps) {
  if (activeCount <= 0) return null;
  return (
    <section className="border-b border-slate-900/8 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0057FF]/10 text-[#0057FF]">
            <Car className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </div>
          <p className="text-sm text-slate-600">
            <span className="font-bold text-slate-900">{activeCount.toLocaleString("az-AZ")}</span>
            {" "}aktiv elan platformada
          </p>
        </div>
      </div>
    </section>
  );
}
