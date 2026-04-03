"use client";

import Link from "next/link";
import { useState } from "react";

interface AdminAuctionRow {
  id: string;
  titleSnapshot: string;
  status: string;
  mode: string;
  currentBidAzn?: number;
  startingBidAzn: number;
  sellerUserId: string;
  winnerUserId?: string;
  endsAt: string;
  updatedAt: string;
  freezeBidding: boolean;
  forceManualReview: boolean;
  controlNote?: string;
}

export function AdminAuctionsTable({ items }: { items: AdminAuctionRow[] }) {
  const [rows, setRows] = useState(items);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateControl(row: AdminAuctionRow, patch: { freezeBidding?: boolean; forceManualReview?: boolean }) {
    setBusyId(row.id);
    const prev = rows;
    setRows((current) =>
      current.map((item) =>
        item.id === row.id ? { ...item, ...patch } : item
      )
    );
    try {
      const response = await fetch("/api/admin/auctions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auctionId: row.id,
          freezeBidding: patch.freezeBidding,
          forceManualReview: patch.forceManualReview
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error || "Auksion idarə update failed");
    } catch {
      setRows(prev);
      alert("Auksion idarə update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Lot</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Qiymət</th>
            <th className="px-4 py-3 text-left">Ends</th>
            <th className="px-4 py-3 text-left">Freeze bid</th>
            <th className="px-4 py-3 text-left">Manual review</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{item.titleSnapshot}</div>
                <div className="text-xs text-slate-500">{item.id}</div>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{item.status}</span>
              </td>
              <td className="px-4 py-3 text-slate-700">
                {(item.currentBidAzn ?? item.startingBidAzn).toLocaleString("az-AZ")} ₼
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{new Date(item.endsAt).toLocaleString("az-AZ")}</td>
              <td className="px-4 py-3">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.freezeBidding}
                    disabled={busyId === item.id}
                    onChange={(e) => void updateControl(item, { freezeBidding: e.target.checked })}
                  />
                  <span className="text-xs text-slate-600">{item.freezeBidding ? "Frozen" : "Open"}</span>
                </label>
              </td>
              <td className="px-4 py-3">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.forceManualReview}
                    disabled={busyId === item.id}
                    onChange={(e) => void updateControl(item, { forceManualReview: e.target.checked })}
                  />
                  <span className="text-xs text-slate-600">{item.forceManualReview ? "On" : "Off"}</span>
                </label>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <Link href={`/auction/${item.id}`} className="text-xs font-semibold text-[#0891B2] hover:underline">
                    Lot detail
                  </Link>
                  <Link href={`/auction/${item.id}/confirm`} className="text-xs font-semibold text-[#0891B2] hover:underline">
                    Confirm panel
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
