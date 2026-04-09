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

const STATUS_OPTIONS = [
  { value: "active", label: "Aktiv" },
  { value: "pending_review", label: "Yoxlamada" },
  { value: "rejected", label: "Rədd edilib" },
  { value: "archived", label: "Arxivdədir" },
  { value: "inactive", label: "Deaktiv" },
];

const STATUS_CLS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  pending_review: "bg-amber-50 text-amber-700",
  rejected: "bg-red-50 text-red-700",
  archived: "bg-slate-100 text-slate-500",
  inactive: "bg-slate-100 text-slate-500",
  draft: "bg-slate-100 text-slate-600",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  pending_review: "Yoxlamada",
  rejected: "Rədd edilib",
  archived: "Arxivdədir",
  inactive: "Deaktiv",
  draft: "Qaralama",
};

const SELLER_TYPE_LABELS: Record<string, string> = {
  private: "Fərdi",
  individual: "Fərdi satıcı",
  dealer: "Avtosalon",
  parts_store: "Ehtiyat hissə mağazası",
};

interface EditModalState {
  id: string;
  title: string;
  status: string;
  priceAzn: number;
  city: string;
}

export function AdminListingsTable({ items }: { items: AdminListingRow[] }) {
  const [rows, setRows] = useState(items);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
        body: JSON.stringify({ listingIds, status }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error || "Toplu yeniləmə uğursuz oldu");
      setSelected({});
    } catch {
      setRows(prev);
      alert("Toplu yeniləmə uğursuz oldu");
    } finally {
      setBusy(false);
    }
  }

  async function quickStatusChange(id: string, status: string) {
    const prev = rows;
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await res.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error);
    } catch {
      setRows(prev);
      alert("Status yenilənmədi");
    }
  }

  async function saveEdit() {
    if (!editModal || editBusy) return;
    setEditBusy(true);
    try {
      const res = await fetch(`/api/admin/listings/${editModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editModal.status,
          priceAzn: editModal.priceAzn,
          title: editModal.title,
          city: editModal.city,
        }),
      });
      const payload = (await res.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error);
      setRows((current) =>
        current.map((row) =>
          row.id === editModal.id
            ? { ...row, status: editModal.status, priceAzn: editModal.priceAzn, title: editModal.title, city: editModal.city }
            : row
        )
      );
      setEditModal(null);
    } catch {
      alert("Dəyişiklik saxlanılmadı");
    } finally {
      setEditBusy(false);
    }
  }

  async function confirmDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
      const payload = (await res.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error);
      setRows((current) => current.filter((row) => row.id !== id));
      setSelected((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch {
      alert("Elan silinmədi");
    } finally {
      setDeleteConfirm(null);
    }
  }

  return (
    <>
      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Elanı Redaktə Et</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Başlıq</label>
                <input
                  className="input-field w-full"
                  value={editModal.title}
                  onChange={(e) => setEditModal({ ...editModal, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Qiymət (₼)</label>
                  <input
                    type="number"
                    className="input-field w-full"
                    value={editModal.priceAzn}
                    onChange={(e) => setEditModal({ ...editModal, priceAzn: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Şəhər</label>
                  <input
                    className="input-field w-full"
                    value={editModal.city}
                    onChange={(e) => setEditModal({ ...editModal, city: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
                <select
                  className="input-field w-full"
                  value={editModal.status}
                  onChange={(e) => setEditModal({ ...editModal, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditModal(null)}
                disabled={editBusy}
              >
                Ləğv et
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => void saveEdit()}
                disabled={editBusy}
              >
                {editBusy ? "Saxlanılır..." : "Saxla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Elanı Sil</h3>
            <p className="mb-5 text-sm text-slate-600">
              Bu elan bütün media faylları ilə birlikdə silinəcək. Bu əməliyyat geri qaytarıla bilməz.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Ləğv et
              </button>
              <button
                type="button"
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                onClick={() => void confirmDelete(deleteConfirm)}
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">
            Seçilən elan:{" "}
            <span className="font-semibold text-slate-900">
              {Object.values(selected).filter(Boolean).length}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
              onClick={() => void bulkUpdate("active")}
            >
              Toplu aktiv et
            </button>
            <button
              type="button"
              disabled={busy}
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
              onClick={() => void bulkUpdate("pending_review")}
            >
              Toplu baxışa göndər
            </button>
            <button
              type="button"
              disabled={busy}
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
              onClick={() => void bulkUpdate("rejected")}
            >
              Toplu rədd et
            </button>
            <button
              type="button"
              disabled={busy}
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
              onClick={() => void bulkUpdate("archived")}
            >
              Toplu arxivlə
            </button>
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
              <th className="px-4 py-3 text-left">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(selected[item.id])}
                    onChange={(e) =>
                      setSelected((current) => ({ ...current, [item.id]: e.target.checked }))
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500">
                    {item.year}, {item.city}
                  </div>
                  <Link
                    href={`/listings/${item.id}`}
                    className="text-xs font-semibold text-[#0891B2] hover:underline"
                    target="_blank"
                  >
                    Elanı aç ↗
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={item.status}
                    className={`rounded-full border-0 px-2 py-1 text-xs font-medium ring-1 ring-inset ring-slate-200 focus:ring-2 ${STATUS_CLS[item.status] ?? "bg-slate-100 text-slate-600"}`}
                    onChange={(e) => void quickStatusChange(item.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                    {!STATUS_OPTIONS.find((o) => o.value === item.status) && (
                      <option value={item.status}>{STATUS_LABELS[item.status] ?? item.status}</option>
                    )}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {SELLER_TYPE_LABELS[item.sellerType] ?? item.sellerType}
                </td>
                <td className="px-4 py-3 text-slate-700">{item.planType ?? "-"}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {item.priceAzn.toLocaleString("az-AZ")} ₼
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {new Date(item.createdAt).toLocaleDateString("az-AZ")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Redaktə et"
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      onClick={() =>
                        setEditModal({
                          id: item.id,
                          title: item.title,
                          status: item.status,
                          priceAzn: item.priceAzn,
                          city: item.city,
                        })
                      }
                    >
                      Redaktə
                    </button>
                    <button
                      type="button"
                      title="Sil"
                      className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                      onClick={() => setDeleteConfirm(item.id)}
                    >
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
