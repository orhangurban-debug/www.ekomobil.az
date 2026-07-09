"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminReadOnlyBanner } from "@/components/admin/admin-read-only-banner";
import { useConfirm } from "@/components/ui/confirm-dialog-provider";
import { useToast } from "@/components/ui/toast-provider";

interface BusinessProfileItem {
  dealerId: string;
  ownerUserId?: string;
  ownerEmail?: string;
  name: string;
  city: string;
  verified: boolean;
  showWhatsapp: boolean;
  showWebsite: boolean;
  websiteUrl?: string;
  whatsappPhone?: string;
  dealerPlanId?: string;
  partsPlanId?: string;
  profileType?: "dealer" | "store";
  subscriptionExpiresAt?: string;
  subscriptionStatus?: string;
}

function formatWhen(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export function AdminBusinessProfilesTable({
  items,
  readOnly = false
}: {
  items: BusinessProfileItem[];
  readOnly?: boolean;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [localItems, setLocalItems] = useState(items);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  async function patchDealer(
    dealerId: string,
    patchData: { verified?: boolean; showWhatsapp?: boolean; showWebsite?: boolean }
  ) {
    setBusyId(dealerId);
    try {
      const response = await fetch("/api/admin/business-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealerId, ...patchData })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        toast.error(payload.error ?? "Yeniləmə uğursuz oldu.");
        return;
      }
      setLocalItems((prev) =>
        prev.map((item) => (item.dealerId === dealerId ? { ...item, ...patchData } : item))
      );
      toast.success("Profil yeniləndi.");
    } finally {
      setBusyId(null);
    }
  }

  async function patchSubscription(
    item: BusinessProfileItem,
    action: "extend" | "cancel"
  ) {
    if (!item.ownerUserId) {
      toast.error("Sahib istifadəçi ID tapılmadı.");
      return;
    }
    const businessType = item.profileType === "store" ? "parts_store" : "dealer";
    const planId = item.profileType === "store" ? item.partsPlanId : item.dealerPlanId;
    if (!planId) {
      toast.error("Aktiv plan tapılmadı.");
      return;
    }

    const ok = await confirm({
      title: action === "extend" ? "Sınaq müddətini uzat" : "Abunəni ləğv et",
      message:
        action === "extend"
          ? "30 gün əlavə sınaq müddəti verilsin?"
          : "Bu biznes hesabının abunəliyi ləğv edilsin?",
      confirmLabel: action === "extend" ? "Uzat" : "Ləğv et",
      danger: action === "cancel"
    });
    if (!ok) return;

    setBusyId(item.dealerId);
    try {
      const expiresAt =
        action === "extend"
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : new Date().toISOString();
      const response = await fetch("/api/admin/business-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerUserId: item.ownerUserId,
          businessType,
          planId,
          status: action === "extend" ? "active" : "cancelled",
          expiresAt
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        toast.error(payload.error ?? "Abunə yenilənmədi.");
        return;
      }
      setLocalItems((prev) =>
        prev.map((row) =>
          row.dealerId === item.dealerId
            ? {
                ...row,
                subscriptionExpiresAt: action === "extend" ? expiresAt : expiresAt,
                subscriptionStatus: action === "extend" ? "active" : "cancelled"
              }
            : row
        )
      );
      toast.success(action === "extend" ? "Sınaq 30 gün uzadıldı." : "Abunə ləğv edildi.");
    } finally {
      setBusyId(null);
    }
  }

  function toggleSelected(dealerId: string) {
    setSelectedIds((prev) =>
      prev.includes(dealerId) ? prev.filter((id) => id !== dealerId) : [...prev, dealerId]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === localItems.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(localItems.map((item) => item.dealerId));
  }

  async function runBulk(
    patchData: { verified?: boolean; showWhatsapp?: boolean; showWebsite?: boolean },
    label: string
  ) {
    if (selectedIds.length === 0) {
      toast.error("Əvvəl ən azı 1 profil seçin.");
      return;
    }
    const dealerOnlyIds = selectedIds.filter((id) => {
      const item = localItems.find((row) => row.dealerId === id);
      return item?.profileType === "dealer";
    });
    if (dealerOnlyIds.length === 0) {
      toast.error("Toplu moderasiya yalnız salon profilləri üçündür.");
      return;
    }
    const confirmed = await confirm({
      title: "Toplu əməliyyat",
      message: `${dealerOnlyIds.length} salon profili üçün "${label}" tətbiq edilsin?`,
      confirmLabel: "Tətbiq et"
    });
    if (!confirmed) return;
    setBulkBusy(true);
    try {
      const response = await fetch("/api/admin/business-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealerIds: dealerOnlyIds, ...patchData })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; updatedCount?: number };
      if (!response.ok || !payload.ok) {
        toast.error(payload.error ?? "Toplu əməliyyat uğursuz oldu.");
        return;
      }
      setLocalItems((prev) =>
        prev.map((item) => (dealerOnlyIds.includes(item.dealerId) ? { ...item, ...patchData } : item))
      );
      toast.success(`Yenilənən profil: ${payload.updatedCount ?? dealerOnlyIds.length}`);
      setSelectedIds([]);
    } finally {
      setBulkBusy(false);
    }
  }

  function publicProfileHref(item: BusinessProfileItem): string | null {
    if (item.profileType === "dealer") return `/dealers/${item.dealerId}`;
    if (item.ownerUserId) return `/admin/listings?q=${encodeURIComponent(item.ownerEmail ?? item.ownerUserId)}`;
    return null;
  }

  return (
    <div className="space-y-3">
      {readOnly && <AdminReadOnlyBanner />}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {!readOnly && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
            <div className="text-sm text-slate-600">
              Seçilən profil: <span className="font-semibold text-slate-900">{selectedIds.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void runBulk({ verified: true }, "Toplu təsdiq et")}
                disabled={bulkBusy}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                Toplu təsdiq et
              </button>
              <button
                type="button"
                onClick={() => void runBulk({ verified: false }, "Toplu təsdiqi ləğv et")}
                disabled={bulkBusy}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                Toplu təsdiqi ləğv et
              </button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={localItems.length > 0 && selectedIds.length === localItems.length}
                    onChange={toggleSelectAll}
                    aria-label="Bütün profilləri seç"
                  />
                </th>
                <th className="px-4 py-2 text-left">Profil</th>
                <th className="px-4 py-2 text-left">Sahib</th>
                <th className="px-4 py-2 text-left">Abunə</th>
                <th className="px-4 py-2 text-left">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localItems.map((item) => {
                const busy = busyId === item.dealerId;
                const publicHref = publicProfileHref(item);
                const activePlan = item.profileType === "store" ? item.partsPlanId : item.dealerPlanId;
                return (
                  <tr key={item.dealerId}>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.dealerId)}
                        onChange={() => toggleSelected(item.dealerId)}
                        aria-label={`${item.name} profilini seç`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{item.name}</span>
                        {item.profileType === "store" ? (
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                            Mağaza
                          </span>
                        ) : (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            Salon
                          </span>
                        )}
                        {item.verified && item.profileType === "dealer" && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Təsdiqlənib
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{item.city}</div>
                      {publicHref && (
                        <Link href={publicHref} className="text-xs font-medium text-[#0891B2] hover:underline">
                          {item.profileType === "dealer" ? "Salon səhifəsi" : "Elanları bax"} →
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.ownerUserId ? (
                        <Link href={`/admin/users/${item.ownerUserId}`} className="font-medium text-[#0891B2] hover:underline">
                          {item.ownerEmail ?? item.ownerUserId.slice(0, 8)}
                        </Link>
                      ) : (
                        <span>{item.ownerEmail ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{activePlan ?? "—"}</p>
                      <p className="text-xs text-slate-500">
                        {item.subscriptionStatus ?? "—"}
                        {item.subscriptionExpiresAt ? ` · bitir ${formatWhen(item.subscriptionExpiresAt)}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {item.profileType === "dealer" && !readOnly && (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void patchDealer(item.dealerId, { verified: !item.verified })}
                              className="btn-secondary px-2.5 py-1 text-xs"
                            >
                              {item.verified ? "Təsdiqi ləğv" : "Təsdiq et"}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void patchDealer(item.dealerId, { showWhatsapp: !item.showWhatsapp })}
                              className="btn-secondary px-2.5 py-1 text-xs"
                            >
                              WA {item.showWhatsapp ? "gizlət" : "göstər"}
                            </button>
                          </>
                        )}
                        {!readOnly && activePlan && item.ownerUserId && (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void patchSubscription(item, "extend")}
                              className="btn-secondary px-2.5 py-1 text-xs"
                            >
                              +30 gün
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void patchSubscription(item, "cancel")}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                            >
                              Abunəni ləğv et
                            </button>
                          </>
                        )}
                        {item.ownerUserId && (
                          <Link
                            href={`/admin/users/${item.ownerUserId}`}
                            className="btn-secondary px-2.5 py-1 text-xs"
                          >
                            Sahib profili
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {localItems.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-400" colSpan={5}>
                    Nəticə tapılmadı.
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
