"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LISTING_PLANS, type PlanType } from "@/lib/listing-plans";
import {
  BUMP_PACKAGES,
  PREMIUM_PACKAGES,
  VIP_PACKAGES,
  type BoostPackage
} from "@/lib/listing-boost-plans";

interface BoostListingButtonProps {
  listingId: string;
  currentPlan?: PlanType;
  /** Only show for paid plans when already max */
  variant?: "full" | "compact";
}

const PAID_PLANS: PlanType[] = ["standard", "vip"];
const PLAN_RANK: Record<PlanType, number> = {
  free: 0,
  standard: 1,
  vip: 2
};

export function BoostListingButton({
  listingId,
  currentPlan = "free",
  variant = "full"
}: BoostListingButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availablePlans = PAID_PLANS.filter((planId) => PLAN_RANK[planId] >= PLAN_RANK[currentPlan]);

  if (availablePlans.length === 0) return null;

  async function handleUpgrade(planType: PlanType) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/listing-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, planType, source: "boost" })
      });
      const data = (await res.json()) as { ok: boolean; error?: string; checkoutUrl?: string };
      if (data.ok && data.checkoutUrl) {
        setOpen(false);
        router.push(data.checkoutUrl);
      } else {
        setError(data.error || "Xəta baş verdi");
      }
    } catch {
      setError("Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  }

  async function handleBoost(packageId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/listing-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, packageId })
      });
      const data = (await res.json()) as { ok: boolean; error?: string; checkoutUrl?: string };
      if (data.ok && data.checkoutUrl) {
        setOpen(false);
        router.push(data.checkoutUrl);
      } else {
        setError(data.error || "Xəta baş verdi");
      }
    } catch {
      setError("Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  }

  function renderCompactBoostButton(pkg: BoostPackage) {
    return (
      <button
        key={pkg.id}
        type="button"
        onClick={() => handleBoost(pkg.id)}
        disabled={loading}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
      >
        <span>{pkg.nameAz}</span>
        <span className="font-semibold text-slate-700">{pkg.priceAzn} ₼</span>
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Elanı irəli çək
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Plan yüksəlt</div>
              {availablePlans.map((planId) => {
                const plan = LISTING_PLANS.find((p) => p.id === planId)!;
                const isCurrent = planId === currentPlan;
                return (
                  <button
                    key={planId}
                    type="button"
                    onClick={() => handleUpgrade(planId)}
                    disabled={loading}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    <span>
                      {plan.nameAz}
                      {isCurrent ? " (müddəti uzat)" : ""}
                    </span>
                    <span className="font-semibold text-slate-700">{plan.priceAzn} ₼</span>
                  </button>
                );
              })}
              <div className="my-1 border-t border-slate-100" />
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Boost paketləri</div>
              {BUMP_PACKAGES.slice(0, 2).map(renderCompactBoostButton)}
              {VIP_PACKAGES.slice(0, 1).map(renderCompactBoostButton)}
              {PREMIUM_PACKAGES.slice(0, 1).map(renderCompactBoostButton)}
              {error && (
                <p className="px-3 py-2 text-xs text-red-600">{error}</p>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn-secondary w-full justify-center py-3"
      >
        Elanı irəli çək
      </button>
      {open && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">Plan seçin və ya müddəti uzadın</p>
          <div className="grid gap-2">
            {availablePlans.map((planId) => {
              const plan = LISTING_PLANS.find((p) => p.id === planId)!;
              const isCurrent = planId === currentPlan;
              return (
                <button
                  key={planId}
                  type="button"
                  onClick={() => handleUpgrade(planId)}
                  disabled={loading}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50"
                >
                  <span className="font-medium text-slate-900">
                    {plan.nameAz}
                    {isCurrent ? " (müddəti uzat)" : ""}
                  </span>
                  <span className="font-bold text-brand-700">{plan.priceAzn} ₼ / {plan.durationDays} gün</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium text-slate-700">Boost paketləri</p>
            <p className="mt-1 text-xs text-slate-500">
              İrəli çək / VIP / Premium paketləri ilə elanın görünürlüğünü artırın.
            </p>
            <div className="mt-2 grid gap-2">
              {[...BUMP_PACKAGES, ...VIP_PACKAGES, ...PREMIUM_PACKAGES].map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleBoost(pkg.id)}
                  disabled={loading}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50"
                >
                  <span className="font-medium text-slate-900">{pkg.nameAz}</span>
                  <span className="font-bold text-brand-700">
                    {pkg.priceAzn} ₼
                    {pkg.durationDays ? ` / ${pkg.durationDays} gün` : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
