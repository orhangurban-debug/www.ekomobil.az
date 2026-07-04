import { getPlanExpiryDisplay, getPlanById, type PlanType } from "@/lib/listing-plans";

type ListingPlanExpiryCounterProps = {
  planExpiresAt: string;
  planType?: PlanType;
  variant?: "default" | "compact";
};

const stateStyles = {
  active: {
    bar: "bg-brand-600",
    text: "text-slate-600",
    badge: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25"
  },
  expiring_soon: {
    bar: "bg-amber-500",
    text: "text-amber-700",
    badge: "bg-amber-500/15 text-amber-700 border-amber-500/25"
  },
  expired: {
    bar: "bg-red-500",
    text: "text-red-700",
    badge: "bg-red-500/15 text-red-700 border-red-500/25"
  }
} as const;

export function ListingPlanExpiryCounter({
  planExpiresAt,
  planType = "free",
  variant = "default"
}: ListingPlanExpiryCounterProps) {
  const display = getPlanExpiryDisplay(planExpiresAt, planType);
  const plan = getPlanById(planType);
  const styles = stateStyles[display.state];

  const daysLabel =
    display.daysLeft <= 0
      ? "Müddət bitib"
      : display.daysLeft === 1
        ? "1 gün qalıb"
        : `${display.daysLeft} gün qalıb`;

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full border px-2 py-0.5 font-medium ${styles.badge}`}>
          {daysLabel}
        </span>
        <span className={styles.text}>
          {plan?.nameAz ?? "Plan"} · bitir: {display.expiresLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-900/10 bg-white/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Elan müddəti</p>
          <p className={`mt-1 text-xs ${styles.text}`}>
            {plan?.nameAz ?? "Plan"} · {display.durationDays} gün · bitir: {display.expiresLabel}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${styles.badge}`}>
          {daysLabel}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className={`h-2 rounded-full transition-all ${styles.bar}`}
          style={{ width: `${Math.min(display.progressPercent, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Sayğac yalnız aktiv elanlarda işləyir. Müddət bitdikdən sonra elan arxivlənir.
      </p>
    </div>
  );
}
