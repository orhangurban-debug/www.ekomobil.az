"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { LEAD_STAGE_OPTIONS } from "@/lib/admin-leads";

interface AdminLeadRow {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  stage: string;
  source: string;
  responseTimeMinutes?: number;
  createdAt: string;
  listingTitle?: string;
}

export function AdminLeadsTable({ items }: { items: AdminLeadRow[] }) {
  const [rows, setRows] = useState(items);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  async function updateStage(leadIds: string[], stage: string) {
    if (leadIds.length === 0) return;
    const response = await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds, stage })
    });
    const payload = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Mərhələ yenilənməsi uğursuz oldu");
    }
  }

  async function bulkStage(stage: string) {
    if (busy) return;
    const leadIds = rows.filter((r) => selected[r.id]).map((r) => r.id);
    if (leadIds.length === 0) return;
    setBusy(true);
    const prev = rows;
    setRows((current) => current.map((row) => (selected[row.id] ? { ...row, stage } : row)));
    try {
      await updateStage(leadIds, stage);
      setSelected({});
    } catch {
      setRows(prev);
      toast.error("Toplu mərhələ yenilənməsi uğursuz oldu");
    } finally {
      setBusy(false);
    }
  }

  async function updateRowStage(id: string, stage: string) {
    setBusyId(id);
    const prev = rows;
    setRows((current) => current.map((row) => (row.id === id ? { ...row, stage } : row)));
    try {
      await updateStage([id], stage);
    } catch {
      setRows(prev);
      toast.error("Mərhələ yenilənməsi uğursuz oldu");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">
          Seçilən sorğu: <span className="font-semibold text-slate-900">{Object.values(selected).filter(Boolean).length}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={busy} onClick={() => void bulkStage("contacted")} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60">Toplu əlaqə qurulub</button>
          <button type="button" disabled={busy} onClick={() => void bulkStage("visit_booked")} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60">Toplu baxış təyin et</button>
          <button type="button" disabled={busy} onClick={() => void bulkStage("closed")} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60">Toplu bağla</button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                onChange={(e) => setSelected(e.target.checked ? Object.fromEntries(rows.map((row) => [row.id, true])) : {})}
              />
            </th>
            <th className="px-4 py-3 text-left">Müştəri</th>
            <th className="px-4 py-3 text-left">Elan</th>
            <th className="px-4 py-3 text-left">Mərhələ</th>
            <th className="px-4 py-3 text-left">Mənbə</th>
            <th className="px-4 py-3 text-left">SLA</th>
            <th className="px-4 py-3 text-left">Tarix</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                Sorğu tapılmadı.
              </td>
            </tr>
          ) : (
            rows.map((lead) => (
              <tr key={lead.id}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(selected[lead.id])}
                    onChange={(e) => setSelected((current) => ({ ...current, [lead.id]: e.target.checked }))}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{lead.customerName}</div>
                  <div className="text-xs text-slate-500">{lead.customerPhone || lead.customerEmail || "-"}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{lead.listingTitle || "-"}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    value={lead.stage}
                    disabled={busyId === lead.id || busy}
                    onChange={(e) => void updateRowStage(lead.id, e.target.value)}
                  >
                    {LEAD_STAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-700">{lead.source}</td>
                <td className="px-4 py-3 text-slate-700">{lead.responseTimeMinutes ?? "-"} dəq</td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(lead.createdAt).toLocaleString("az-AZ")}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
