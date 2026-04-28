"use client";

import { useMemo, useState } from "react";
import { DEALER_PLANS } from "@/lib/dealer-plans";
import { PARTS_STORE_PLANS } from "@/lib/parts-store-plans";
import {
  calculateRecommendedActiveLimit,
  DEFAULT_PRICING_COST_MODEL,
  type PricingPlanAdminConfig,
  type PricingCostModel
} from "@/lib/pricing-plan-config";
import { SERVICE_PLAN_CATEGORIES } from "@/lib/service-plans";

interface Props {
  initialConfig: PricingPlanAdminConfig;
}

const SERVICE_PLANS = SERVICE_PLAN_CATEGORIES.flatMap((category) => category.plans);

function featureLinesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function featureArrayToLines(value: string[] | undefined): string {
  return (value ?? []).join("\n");
}

function mergeEconomics(model: PricingCostModel): PricingCostModel {
  return { ...DEFAULT_PRICING_COST_MODEL, ...model };
}

export function PricingPlanConfigManager({ initialConfig }: Props) {
  const [config, setConfig] = useState<PricingPlanAdminConfig>({
    ...initialConfig,
    economics: mergeEconomics(initialConfig.economics)
  });
  const [busy, setBusy] = useState(false);

  const serviceCategoryByPlanId = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of SERVICE_PLAN_CATEGORIES) {
      for (const plan of category.plans) map.set(plan.id, category.label);
    }
    return map;
  }, []);

  function patchDealer(planId: string, patch: Record<string, unknown>) {
    setConfig((prev) => ({
      ...prev,
      dealer: {
        ...prev.dealer,
        [planId]: {
          ...prev.dealer[planId as keyof typeof prev.dealer],
          ...patch
        }
      }
    }));
  }

  function patchParts(planId: string, patch: Record<string, unknown>) {
    setConfig((prev) => ({
      ...prev,
      parts: {
        ...prev.parts,
        [planId]: {
          ...prev.parts[planId as keyof typeof prev.parts],
          ...patch
        }
      }
    }));
  }

  function patchService(planId: string, patch: Record<string, unknown>) {
    setConfig((prev) => ({
      ...prev,
      service: {
        ...prev.service,
        [planId]: {
          ...prev.service[planId],
          ...patch
        }
      }
    }));
  }

  function patchEconomics(patch: Partial<PricingCostModel>) {
    setConfig((prev) => ({
      ...prev,
      economics: {
        ...prev.economics,
        ...patch
      }
    }));
  }

  function autoCalibrate() {
    const model = mergeEconomics(config.economics);
    const dealerPatch: PricingPlanAdminConfig["dealer"] = { ...config.dealer };
    for (const plan of DEALER_PLANS) {
      const row = dealerPatch[plan.id] ?? {};
      const priceAzn = row.priceAzn ?? plan.priceAzn;
      const maxImages = row.perListingMaxImages ?? plan.perListingMaxImages;
      const recommended = calculateRecommendedActiveLimit({
        priceAzn,
        maxImagesPerListing: maxImages,
        segment: "dealer",
        model
      });
      dealerPatch[plan.id] = { ...row, maxActiveListings: recommended };
    }

    const partsPatch: PricingPlanAdminConfig["parts"] = { ...config.parts };
    for (const plan of PARTS_STORE_PLANS) {
      const row = partsPatch[plan.id] ?? {};
      const priceAzn = row.priceAzn ?? plan.priceAzn;
      const maxImages = row.perListingMaxImages ?? plan.perListingMaxImages;
      const recommended = calculateRecommendedActiveLimit({
        priceAzn,
        maxImagesPerListing: maxImages,
        segment: "parts",
        model
      });
      partsPatch[plan.id] = { ...row, maxActiveListings: recommended };
    }

    setConfig((prev) => ({ ...prev, dealer: dealerPatch, parts: partsPatch }));
  }

  async function save() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/pricing-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; config?: PricingPlanAdminConfig };
      if (!payload.ok || !payload.config) throw new Error(payload.error || "Yadda saxlama alınmadı");
      setConfig(payload.config);
      alert("Plan ayarları saxlanıldı.");
    } catch {
      alert("Plan ayarları saxlanmadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-bold text-slate-900">Plan iqtisadiyyatı və limit idarəetməsi</h3>
      <p className="mt-1 text-sm text-slate-500">
        Qiymət, aktiv elan limiti, media limiti və plan mətnlərini mərkəzdən idarə edin.
      </p>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-slate-900">Unit economics modeli</h4>
          <button type="button" onClick={autoCalibrate} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">
            Limitləri auto-calibrate et
          </button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs text-slate-500">Storage / şəkil (₼)</span>
            <input
              type="number"
              step="0.0001"
              value={config.economics.storageCostPerImageAzn}
              onChange={(e) => patchEconomics({ storageCostPerImageAzn: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-500">Egress / görüntü (₼)</span>
            <input
              type="number"
              step="0.0001"
              value={config.economics.egressCostPerImageViewAzn}
              onChange={(e) => patchEconomics({ egressCostPerImageViewAzn: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-500">Dealer avg image view / ay</span>
            <input
              type="number"
              value={config.economics.avgDealerImageViewsPerListingPerMonth}
              onChange={(e) => patchEconomics({ avgDealerImageViewsPerListingPerMonth: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-500">Parts avg image view / ay</span>
            <input
              type="number"
              value={config.economics.avgPartsImageViewsPerListingPerMonth}
              onChange={(e) => patchEconomics({ avgPartsImageViewsPerListingPerMonth: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-500">Moderasiya / elan (₼)</span>
            <input
              type="number"
              step="0.01"
              value={config.economics.moderationCostPerListingAzn}
              onChange={(e) => patchEconomics({ moderationCostPerListingAzn: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-500">Dəstək / elan (₼)</span>
            <input
              type="number"
              step="0.01"
              value={config.economics.supportCostPerListingAzn}
              onChange={(e) => patchEconomics({ supportCostPerListingAzn: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-500">Ödəniş əməliyyatı / satış (₼)</span>
            <input
              type="number"
              step="0.01"
              value={config.economics.paymentOpsCostPerOrderAzn}
              onChange={(e) => patchEconomics({ paymentOpsCostPerOrderAzn: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-500">Risk buffer (%)</span>
            <input
              type="number"
              value={config.economics.riskBufferPct}
              onChange={(e) => patchEconomics({ riskBufferPct: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-slate-500">Hədəf COGS (%)</span>
            <input
              type="number"
              value={config.economics.targetCogsRatioPct}
              onChange={(e) => patchEconomics({ targetCogsRatioPct: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <h4 className="text-sm font-semibold text-slate-900">Salon planları</h4>
        {DEALER_PLANS.map((plan) => {
          const row = config.dealer[plan.id] ?? {};
          return (
            <div key={plan.id} className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">{row.nameAz ?? plan.nameAz}</p>
              <div className="mt-2 grid gap-3 md:grid-cols-4">
                <input type="number" value={row.priceAzn ?? plan.priceAzn} onChange={(e) => patchDealer(plan.id, { priceAzn: Number(e.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input type="number" value={row.maxActiveListings ?? plan.maxActiveListings} onChange={(e) => patchDealer(plan.id, { maxActiveListings: Number(e.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input type="number" value={row.perListingMaxImages ?? plan.perListingMaxImages} onChange={(e) => patchDealer(plan.id, { perListingMaxImages: Number(e.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input type="number" value={row.maxVideosPerListing ?? plan.maxVideosPerListing} onChange={(e) => patchDealer(plan.id, { maxVideosPerListing: Number(e.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <textarea
                value={featureArrayToLines(row.features ?? plan.features)}
                onChange={(e) => patchDealer(plan.id, { features: featureLinesToArray(e.target.value) })}
                className="mt-3 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-5 space-y-4">
        <h4 className="text-sm font-semibold text-slate-900">Hissə mağazası planları</h4>
        {PARTS_STORE_PLANS.map((plan) => {
          const row = config.parts[plan.id] ?? {};
          return (
            <div key={plan.id} className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">{row.nameAz ?? plan.nameAz}</p>
              <div className="mt-2 grid gap-3 md:grid-cols-3">
                <input type="number" value={row.priceAzn ?? plan.priceAzn} onChange={(e) => patchParts(plan.id, { priceAzn: Number(e.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input type="number" value={row.maxActiveListings ?? plan.maxActiveListings} onChange={(e) => patchParts(plan.id, { maxActiveListings: Number(e.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input type="number" value={row.perListingMaxImages ?? plan.perListingMaxImages} onChange={(e) => patchParts(plan.id, { perListingMaxImages: Number(e.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <textarea
                value={featureArrayToLines(row.features ?? plan.features)}
                onChange={(e) => patchParts(plan.id, { features: featureLinesToArray(e.target.value) })}
                className="mt-3 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-5 space-y-4">
        <h4 className="text-sm font-semibold text-slate-900">Servis planları</h4>
        {SERVICE_PLANS.map((plan) => {
          const row = config.service[plan.id] ?? {};
          return (
            <div key={plan.id} className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {serviceCategoryByPlanId.get(plan.id)} - {row.nameAz ?? plan.nameAz}
              </p>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                <input type="number" value={row.priceAzn ?? plan.priceAzn} onChange={(e) => patchService(plan.id, { priceAzn: Number(e.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={row.billingAz ?? plan.billingAz} onChange={(e) => patchService(plan.id, { billingAz: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <textarea
                value={row.descriptionAz ?? plan.descriptionAz}
                onChange={(e) => patchService(plan.id, { descriptionAz: e.target.value })}
                className="mt-3 min-h-16 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <textarea
                value={featureArrayToLines(row.features ?? plan.features)}
                onChange={(e) => patchService(plan.id, { features: featureLinesToArray(e.target.value) })}
                className="mt-3 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <button type="button" onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? "Saxlanılır..." : "Plan ayarlarını yadda saxla"}
        </button>
      </div>
    </div>
  );
}
