"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  listingId: string;
  currentStatus: string;
  listingTitle: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  pending_review: "Yoxlamada",
  rejected: "Rədd edilib",
  archived: "Arxivdədir",
  inactive: "Deaktiv",
  draft: "Qaralama",
};

export function AdminListingActions({ listingId, currentStatus, listingTitle }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [busy, setBusy] = useState(false);

  async function updateStatus(newStatus: string) {
    if (busy || newStatus === status) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const payload = (await res.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error);
      setStatus(newStatus);
      router.refresh();
    } catch {
      alert("Status yenilənmədi");
    } finally {
      setBusy(false);
    }
  }

  const STATUS_CLS: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending_review: "bg-amber-50 text-amber-700 border-amber-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    archived: "bg-slate-100 text-slate-500 border-slate-200",
    inactive: "bg-slate-100 text-slate-500 border-slate-200",
    draft: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Admin moderasiya
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CLS[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
            {STATUS_LABELS[status] ?? status}
          </span>
          <span className="max-w-[240px] truncate text-sm text-slate-700">{listingTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          {status !== "active" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void updateStatus("active")}
              className="rounded-xl bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? "..." : "Təsdiqlə"}
            </button>
          )}
          {status !== "rejected" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void updateStatus("rejected")}
              className="rounded-xl bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? "..." : "Rədd et"}
            </button>
          )}
          {status !== "pending_review" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void updateStatus("pending_review")}
              className="rounded-xl border border-amber-300 bg-white px-4 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
            >
              Yoxlamaya göndər
            </button>
          )}
          <a
            href="/admin/listings"
            className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            ← Admin panel
          </a>
        </div>
      </div>
    </div>
  );
}
