"use client";

import { useState } from "react";

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
}

export function AdminBusinessProfilesTable({ items }: { items: BusinessProfileItem[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [localItems, setLocalItems] = useState(items);

  async function patch(
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
        alert(payload.error ?? "Yeniləmə uğursuz oldu.");
        return;
      }
      setLocalItems((prev) =>
        prev.map((item) => (item.dealerId === dealerId ? { ...item, ...patchData } : item))
      );
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
      alert("Əvvəl ən azı 1 profil seçin.");
      return;
    }
    const confirmed = confirm(
      `${selectedIds.length} profil üçün "${label}" əməliyyatını tətbiq etmək istəyirsiniz?`
    );
    if (!confirmed) return;
    setBulkBusy(true);
    try {
      const response = await fetch("/api/admin/business-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealerIds: selectedIds, ...patchData })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; updatedCount?: number };
      if (!response.ok || !payload.ok) {
        alert(payload.error ?? "Toplu əməliyyat uğursuz oldu.");
        return;
      }
      setLocalItems((prev) =>
        prev.map((item) => (selectedIds.includes(item.dealerId) ? { ...item, ...patchData } : item))
      );
      alert(`Toplu əməliyyat tamamlandı. Yenilənən profil sayı: ${payload.updatedCount ?? selectedIds.length}`);
      setSelectedIds([]);
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
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
          <button
            type="button"
            onClick={() => void runBulk({ showWhatsapp: false, showWebsite: false }, "Kontaktları gizlət")}
            disabled={bulkBusy}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            Kontaktları gizlət
          </button>
          <button
            type="button"
            onClick={() => void runBulk({ showWhatsapp: true, showWebsite: true }, "Kontaktları göstər")}
            disabled={bulkBusy}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            Kontaktları göstər
          </button>
        </div>
      </div>
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
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-left">Planlar</th>
              <th className="px-4 py-2 text-left">Kontakt</th>
              <th className="px-4 py-2 text-left">Moderasiya</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {localItems.map((item) => {
              const busy = busyId === item.dealerId;
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
                    <div className="font-medium text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.city}</div>
                    <div className="text-xs text-slate-400">ID: {item.dealerId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{item.ownerEmail ?? "—"}</div>
                    <div className="text-xs text-slate-500">{item.ownerUserId ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600">Salon: {item.dealerPlanId ?? "—"}</div>
                    <div className="text-xs text-slate-600">Mağaza: {item.partsPlanId ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600">{item.whatsappPhone ?? "WhatsApp yoxdur"}</div>
                    <div className="text-xs text-slate-600 truncate max-w-[220px]">{item.websiteUrl ?? "Website yoxdur"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void patch(item.dealerId, { verified: !item.verified })}
                        className="btn-secondary px-3 py-1.5 text-xs"
                      >
                        {item.verified ? "Təsdiqi ləğv et" : "Təsdiq et"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void patch(item.dealerId, { showWhatsapp: !item.showWhatsapp })}
                        className="btn-secondary px-3 py-1.5 text-xs"
                      >
                        {item.showWhatsapp ? "WhatsApp gizlət" : "WhatsApp göstər"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void patch(item.dealerId, { showWebsite: !item.showWebsite })}
                        className="btn-secondary px-3 py-1.5 text-xs"
                      >
                        {item.showWebsite ? "Website gizlət" : "Website göstər"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {localItems.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-slate-400" colSpan={6}>
                  Nəticə tapılmadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
