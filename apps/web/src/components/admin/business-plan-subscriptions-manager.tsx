"use client";

import { useMemo, useState } from "react";
import { DEALER_PLANS } from "@/lib/dealer-plans";
import { PARTS_STORE_PLANS } from "@/lib/parts-store-plans";

interface SubscriptionItem {
  id: string;
  ownerUserId: string;
  ownerEmail?: string;
  businessType: "dealer" | "parts_store";
  planId: string;
  status: "active" | "expired" | "cancelled";
  startsAt?: string;
  expiresAt?: string;
  updatedAt?: string;
}

const statusOptions: Array<SubscriptionItem["status"]> = ["active", "expired", "cancelled"];

function planOptionsForType(type: SubscriptionItem["businessType"]) {
  return type === "dealer"
    ? DEALER_PLANS.map((plan) => ({ value: plan.id, label: plan.nameAz }))
    : PARTS_STORE_PLANS.map((plan) => ({ value: plan.id, label: plan.nameAz }));
}

export function BusinessPlanSubscriptionsManager({ initialItems }: { initialItems: SubscriptionItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [ownerUserId, setOwnerUserId] = useState("");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerCandidates, setOwnerCandidates] = useState<Array<{ id: string; email: string; role: string }>>([]);
  const [searchingOwner, setSearchingOwner] = useState(false);
  const [businessType, setBusinessType] = useState<"dealer" | "parts_store">("dealer");
  const [planId, setPlanId] = useState<string>(DEALER_PLANS[0]?.id ?? "baza");
  const [status, setStatus] = useState<SubscriptionItem["status"]>("active");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentPlanOptions = useMemo(() => planOptionsForType(businessType), [businessType]);

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
                const fallbackPlan = planOptionsForType(nextType)[0]?.value ?? "";
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
                <th className="px-3 py-2 text-left">Yenilənmə</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900">{item.ownerEmail ?? "—"}</div>
                    <div className="text-xs text-slate-500">{item.ownerUserId}</div>
                  </td>
                  <td className="px-3 py-2">{item.businessType === "dealer" ? "Salon" : "Mağaza"}</td>
                  <td className="px-3 py-2">{item.planId}</td>
                  <td className="px-3 py-2">{item.status}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {(item.startsAt ? new Date(item.startsAt).toLocaleDateString("az-AZ") : "—")} →{" "}
                    {(item.expiresAt ? new Date(item.expiresAt).toLocaleDateString("az-AZ") : "—")}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleString("az-AZ") : "—"}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-slate-400" colSpan={6}>
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
