"use client";

import { useMemo, useState } from "react";
import { AdminReadOnlyBanner } from "@/components/admin/admin-read-only-banner";

interface PlanCatalogItem {
  id: string;
  nameAz: string;
  priceAzn: number;
}

interface SubscriptionItem {
  id: string;
  ownerUserId: string;
  ownerEmail?: string;
  businessType: "dealer" | "parts_store";
  planId: string;
  status: "active" | "expired" | "cancelled";
  startsAt?: string;
  expiresAt?: string;
  trialGrantedAt?: string;
  updatedAt?: string;
}

const statusOptions: Array<SubscriptionItem["status"]> = ["active", "expired", "cancelled"];

function planOptionsForType(type: SubscriptionItem["businessType"], dealerPlans: PlanCatalogItem[], partsPlans: PlanCatalogItem[]) {
  const plans = type === "dealer" ? dealerPlans : partsPlans;
  return plans.map((plan) => ({
    value: plan.id,
    label: `${plan.nameAz} (${plan.priceAzn} ₼/ay)`
  }));
}

export function BusinessPlanSubscriptionsManager({
  initialItems,
  dealerPlans,
  partsPlans,
  readOnly = false
}: {
  initialItems: SubscriptionItem[];
  dealerPlans: PlanCatalogItem[];
  partsPlans: PlanCatalogItem[];
  readOnly?: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [ownerUserId, setOwnerUserId] = useState("");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerCandidates, setOwnerCandidates] = useState<Array<{ id: string; email: string; role: string }>>([]);
  const [searchingOwner, setSearchingOwner] = useState(false);
  const [businessType, setBusinessType] = useState<"dealer" | "parts_store">("dealer");
  const [planId, setPlanId] = useState<string>(dealerPlans[0]?.id ?? "baza");
  const [status, setStatus] = useState<SubscriptionItem["status"]>("active");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentPlanOptions = useMemo(
    () => planOptionsForType(businessType, dealerPlans, partsPlans),
    [businessType, dealerPlans, partsPlans]
  );

  async function lookupOwnerByEmail() {
    const q = ownerSearch.trim();
    if (!q) {
      setOwnerCandidates([]);
      return;
    }
    setSearchingOwner(true);
    try {
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`);
      const payload = (await response.json()) as {
        ok: boolean;
        items?: Array<{ id: string; email: string; role: string }>;
        error?: string;
      };
      if (!response.ok || !payload.ok) {
        setFeedback(payload.error ?? "Axtarış mümkün olmadı.");
        return;
      }
      setOwnerCandidates(payload.items ?? []);
      if ((payload.items ?? []).length === 0) {
        setFeedback("Bu email ilə istifadəçi tapılmadı.");
      } else {
        setFeedback(null);
      }
    } catch {
      setFeedback("Axtarış zamanı server xətası oldu.");
    } finally {
      setSearchingOwner(false);
    }
  }

  async function submit() {
    if (!ownerUserId.trim()) {
      setFeedback("Owner user ID mütləqdir.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/business-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerUserId: ownerUserId.trim(),
          businessType,
          planId,
          status,
          startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; item?: SubscriptionItem };
      if (!response.ok || !payload.ok || !payload.item) {
        setFeedback(payload.error ?? "Yeniləmə mümkün olmadı.");
        return;
      }
      setItems((prev) => {
        const rest = prev.filter((entry) => entry.id !== payload.item!.id);
        return [payload.item!, ...rest];
      });
      setFeedback("Abunə uğurla yeniləndi.");
    } catch {
      setFeedback("Server xətası oldu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {readOnly && <AdminReadOnlyBanner />}
      {!readOnly && (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">Yeni / yenilə abunə</h3>
        <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_auto]">
          <input
            className="input-field"
            value={ownerSearch}
            onChange={(e) => setOwnerSearch(e.target.value)}
            placeholder="Owner email ilə axtar"
          />
          <button type="button" className="btn-secondary" onClick={lookupOwnerByEmail} disabled={searchingOwner}>
            {searchingOwner ? "Axtarılır..." : "Email ilə axtar"}
          </button>
          {ownerCandidates.length > 0 && (
            <div className="md:col-span-2">
              <select
                className="input-field"
                defaultValue=""
                onChange={(e) => {
                  const nextId = e.target.value;
                  if (!nextId) return;
                  setOwnerUserId(nextId);
                }}
              >
                <option value="">Tapılmış owner seçin</option>
                {ownerCandidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.email} ({candidate.role}) - {candidate.id}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner user ID</span>
            <input className="input-field" value={ownerUserId} onChange={(e) => setOwnerUserId(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Biznes tipi</span>
            <select
              className="input-field"
              value={businessType}
              onChange={(e) => {
                const nextType = e.target.value as "dealer" | "parts_store";
                setBusinessType(nextType);
                const fallbackPlan = planOptionsForType(nextType, dealerPlans, partsPlans)[0]?.value ?? "";
                setPlanId(fallbackPlan);
              }}
            >
              <option value="dealer">Salon</option>
              <option value="parts_store">Mağaza</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</span>
            <select className="input-field" value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {currentPlanOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value as SubscriptionItem["status"])}>
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Başlanğıc</span>
            <input type="datetime-local" className="input-field" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bitmə</span>
            <input type="datetime-local" className="input-field" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="button" className="btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Saxlanılır..." : "Abunəni yadda saxla"}
          </button>
          {feedback && <span className="text-sm text-slate-600">{feedback}</span>}
        </div>
      </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">Aktiv və tarixi yazılar</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Owner</th>
                <th className="px-3 py-2 text-left">Tip</th>
                <th className="px-3 py-2 text-left">Plan</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Müddət</th>
                <th className="px-3 py-2 text-left">Sınaq</th>
                <th className="px-3 py-2 text-left">Yenilənmə</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className={item.trialGrantedAt ? "bg-emerald-500/5" : ""}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900">{item.ownerEmail ?? "—"}</div>
                    <div className="text-xs text-slate-500">{item.ownerUserId}</div>
                  </td>
                  <td className="px-3 py-2">{item.businessType === "dealer" ? "Salon" : "Mağaza"}</td>
                  <td className="px-3 py-2">{item.planId}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      item.status === "active"
                        ? "bg-emerald-500/15 text-emerald-700"
                        : item.status === "expired"
                          ? "bg-amber-500/15 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                    }`}>
                      {item.status === "active" ? "Aktiv" : item.status === "expired" ? "Bitib" : "Ləğv"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {(item.startsAt ? new Date(item.startsAt).toLocaleDateString("az-AZ") : "—")} →{" "}
                    {(item.expiresAt ? new Date(item.expiresAt).toLocaleDateString("az-AZ") : "—")}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {item.trialGrantedAt ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {new Date(item.trialGrantedAt).toLocaleDateString("az-AZ")}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleString("az-AZ") : "—"}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-slate-400" colSpan={7}>
                    Hələ abunə yazısı yoxdur.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
