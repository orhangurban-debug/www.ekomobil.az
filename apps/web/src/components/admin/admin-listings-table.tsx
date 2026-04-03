"use client";

import Link from "next/link";
import { useState } from "react";

interface AdminListingRow {
  id: string;
  title: string;
  status: string;
  sellerType: string;
  listingKind: string;
  priceAzn: number;
  city: string;
  year: number;
  planType?: string;
  createdAt: string;
}

export function AdminListingsTable({ items }: { items: AdminListingRow[] }) {
  const [rows, setRows] = useState(items);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  async function bulkUpdate(status: string) {
    if (busy) return;
    const listingIds = rows.filter((r) => selected[r.id]).map((r) => r.id);
    if (listingIds.length === 0) return;
    setBusy(true);
    const prev = rows;
    setRows((current) => current.map((row) => (selected[row.id] ? { ...row, status } : row)));
    try {
      const response = await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingIds, status })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error || "Bulk listing update failed");
      setSelected({});
    } catch {
      setRows(prev);
      alert("Bulk listing update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">
          Seçilən elan: <span className="font-semibold text-slate-900">{Object.values(selected).filter(Boolean).length}</span>
        </p>
        <div className="flex items-center gap-2">
          <button type="button" disabled={busy} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60" onClick={() => void bulkUpdate("active")}>Bulk active</button>
          <button type="button" disabled={busy} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60" onClick={() => void bulkUpdate("pending_review")}>Bulk review</button>
          <button type="button" disabled={busy} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60" onClick={() => void bulkUpdate("rejected")}>Bulk reject</button>
          <button type="button" disabled={busy} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60" onClick={() => void bulkUpdate("archived")}>Bulk archive</button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelected(checked ? Object.fromEntries(rows.map((row) => [row.id, true])) : {});
                }}
              />
            </th>
            <th className="px-4 py-3 text-left">Elan</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Satıcı</th>
            <th className="px-4 py-3 text-left">Plan</th>
            <th className="px-4 py-3 text-left">Qiymət</th>
            <th className="px-4 py-3 text-left">Tarix</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={Boolean(selected[item.id])}
                  onChange={(e) => setSelected((current) => ({ ...current, [item.id]: e.target.checked }))}
                />
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{item.title}</div>
                <div className="text-xs text-slate-500">{item.year}, {item.city}</div>
                <Link href={`/listings/${item.id}`} className="text-xs font-semibold text-[#0891B2] hover:underline">
                  Elanı aç
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{item.status}</span>
              </td>
              <td className="px-4 py-3 text-slate-700">{item.sellerType}</td>
              <td className="px-4 py-3 text-slate-700">{item.planType || "-"}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{item.priceAzn.toLocaleString("az-AZ")} ₼</td>
              <td className="px-4 py-3 text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString("az-AZ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
