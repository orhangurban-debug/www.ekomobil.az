"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LISTING_PLANS, type PlanType } from "@/lib/listing-plans";

interface BoostListingButtonProps {
  listingId: string;
  currentPlan?: PlanType;
  /** Only show for paid plans when already max */
  variant?: "full" | "compact";
}

const PAID_PLANS: PlanType[] = ["standard", "vip"];

export function BoostListingButton({
  listingId,
  currentPlan = "free",
  variant = "full"
}: BoostListingButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgrades = PAID_PLANS.filter((p) => {
    if (currentPlan === "vip") return false;
    if (currentPlan === "standard") return p === "vip";
    return true;
  });

  if (upgrades.length === 0) return null;

  async function handleUpgrade(planType: PlanType) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType })
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(data.error || "Xəta baş verdi");
      }
    } catch {
      setError("Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "compact") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          İrəli çək
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {upgrades.map((planId) => {
                const plan = LISTING_PLANS.find((p) => p.id === planId)!;
                return (
                  <button
                    key={planId}
                    type="button"
                    onClick={() => handleUpgrade(planId)}
                    disabled={loading}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    <span>{plan.nameAz}</span>
                    <span className="font-semibold text-slate-700">{plan.priceAzn} ₼</span>
                  </button>
                );
              })}
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
          <p className="text-sm font-medium text-slate-700">Yeni plan seçin</p>
          <div className="grid gap-2">
            {upgrades.map((planId) => {
              const plan = LISTING_PLANS.find((p) => p.id === planId)!;
              return (
                <button
                  key={planId}
                  type="button"
                  onClick={() => handleUpgrade(planId)}
                  disabled={loading}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50"
                >
                  <span className="font-medium text-slate-900">{plan.nameAz}</span>
                  <span className="font-bold text-brand-700">{plan.priceAzn} ₼ / 30 gün</span>
                </button>
              );
            })}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
