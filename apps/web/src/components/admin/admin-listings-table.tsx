"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useToast } from "@/components/ui/toast-provider";

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
  imageUrl?: string;
  trustScore?: number;
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
  inactive: "bg-violet-50 text-violet-700",
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
  individual: "Fərdi",
  dealer: "Salon",
  parts_store: "Hissə mağ.",
};

interface EditModalState {
  id: string;
  title: string;
  status: string;
  priceAzn: number;
  city: string;
}

interface RejectModalState {
  id: string;
  note: string;
}

function TrustBadge({ score }: { score?: number }) {
  if (score == null) return <span className="text-slate-400">—</span>;
  const cls =
    score >= 75 ? "text-emerald-700 bg-emerald-50" :
    score >= 50 ? "text-amber-700 bg-amber-50" :
    "text-red-700 bg-red-50";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {score}
    </span>
  );
}

export function AdminListingsTable({ items, canDelete = false }: { items: AdminListingRow[]; canDelete?: boolean }) {
  const [rows, setRows] = useState(items);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<RejectModalState | null>(null);
  const toast = useToast();

  async function patchListing(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok || !payload.ok) throw new Error(payload.error ?? "Xəta");
  }

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
      toast.error("Toplu yeniləmə uğursuz oldu");
    } finally {
      setBusy(false);
    }
  }

  async function quickStatusChange(id: string, status: string, note?: string) {
    if (status === "rejected") {
      setRejectModal({ id, note: note ?? "" });
      return;
    }
    const prev = rows;
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
    try {
      await patchListing(id, { status, rejectionNote: note ?? null });
    } catch (error) {
      setRows(prev);
      toast.error(error instanceof Error ? error.message : "Status yenilənmədi");
    }
  }

  async function saveEdit() {
    if (!editModal || editBusy) return;
    setEditBusy(true);
    try {
      await patchListing(editModal.id, {
        status: editModal.status,
        priceAzn: editModal.priceAzn,
        title: editModal.title,
        city: editModal.city,
      });
      setRows((current) =>
        current.map((row) =>
          row.id === editModal.id
            ? { ...row, status: editModal.status, priceAzn: editModal.priceAzn, title: editModal.title, city: editModal.city }
            : row
        )
      );
      setEditModal(null);
      toast.success("Dəyişiklik saxlanıldı");
    } catch {
      toast.error("Dəyişiklik saxlanılmadı");
    } finally {
      setEditBusy(false);
    }
  }

  async function confirmReject() {
    if (!rejectModal || rejectModal.note.trim().length < 5) return;
    await quickStatusChange(rejectModal.id, "rejected", rejectModal.note.trim());
    setRejectModal(null);
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
      toast.success("Elan silindi");
    } catch {
      toast.error("Elan silinmədi");
    } finally {
      setDeleteConfirm(null);
    }
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

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
              <button type="button" className="btn-secondary" onClick={() => setEditModal(null)} disabled={editBusy}>
                Ləğv et
              </button>
              <button type="button" className="btn-primary" onClick={() => void saveEdit()} disabled={editBusy}>
                {editBusy ? "Saxlanılır..." : "Saxla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Elanı Rədd Et</h3>
            <p className="mb-3 text-sm text-slate-600">
              Rədd etmə səbəbini daxil edin — istifadəçi görcək.
            </p>
            <textarea
              className="input-field min-h-[80px] w-full resize-none text-sm"
              placeholder="Məs: Şəkil keyfiyyəti aşağıdır, əsas məlumatlar doldurulmayıb..."
              value={rejectModal.note}
              onChange={(e) => setRejectModal({ ...rejectModal, note: e.target.value })}
              autoFocus
            />
            {rejectModal.note.length > 0 && rejectModal.note.trim().length < 5 && (
              <p className="mt-1 text-xs text-red-500">Ən azı 5 simvol lazımdır</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setRejectModal(null)}>
                Ləğv et
              </button>
              <button
                type="button"
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                onClick={() => void confirmReject()}
                disabled={rejectModal.note.trim().length < 5}
              >
                Rədd et
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
              <button type="button" className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
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
        {/* Bulk actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">
            Seçilən:{" "}
            <span className="font-semibold text-slate-900">{selectedCount}</span>
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" disabled={busy || selectedCount === 0} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40" onClick={() => void bulkUpdate("active")}>
              ✓ Toplu aktiv et
            </button>
            <button type="button" disabled={busy || selectedCount === 0} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40" onClick={() => void bulkUpdate("pending_review")}>
              ↩ Baxışa göndər
            </button>
            <button type="button" disabled={busy || selectedCount === 0} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40" onClick={() => void bulkUpdate("rejected")}>
              ✗ Toplu rədd et
            </button>
            <button type="button" disabled={busy || selectedCount === 0} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40" onClick={() => void bulkUpdate("inactive")}>
              ⊘ Toplu blokla
            </button>
            <button type="button" disabled={busy || selectedCount === 0} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40" onClick={() => void bulkUpdate("archived")}>
              Arxivlə
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelected(checked ? Object.fromEntries(rows.map((row) => [row.id, true])) : {});
                  }}
                />
              </th>
              <th className="px-3 py-3 text-left">Foto</th>
              <th className="px-3 py-3 text-left">Elan</th>
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-left">Satıcı</th>
              <th className="px-3 py-3 text-left">Plan</th>
              <th className="px-3 py-3 text-left">Etibar</th>
              <th className="px-3 py-3 text-left">Qiymət</th>
              <th className="px-3 py-3 text-left">Tarix</th>
              <th className="px-3 py-3 text-left">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((item) => (
              <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${item.status === "pending_review" ? "bg-amber-50/40" : ""}`}>
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(selected[item.id])}
                    onChange={(e) => setSelected((current) => ({ ...current, [item.id]: e.target.checked }))}
                  />
                </td>
                {/* Cover photo */}
                <td className="px-3 py-3">
                  <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width={64}
                        height={48}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </td>
                {/* Info */}
                <td className="px-3 py-3">
                  <div className="max-w-[200px] truncate font-medium text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.year} · {item.city}</div>
                  <Link
                    href={`/listings/${item.id}`}
                    className="text-xs font-semibold text-[#0891B2] hover:underline"
                    target="_blank"
                  >
                    Elanı aç ↗
                  </Link>
                </td>
                {/* Status */}
                <td className="px-3 py-3">
                  <select
                    value={item.status}
                    className={`rounded-full border-0 px-2 py-1 text-xs font-medium ring-1 ring-inset ring-slate-200 focus:ring-2 cursor-pointer ${STATUS_CLS[item.status] ?? "bg-slate-100 text-slate-600"}`}
                    onChange={(e) => {
                      const nextStatus = e.target.value;
                      if (nextStatus === item.status) return;
                      void quickStatusChange(item.id, nextStatus);
                    }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                    {!STATUS_OPTIONS.find((o) => o.value === item.status) && (
                      <option value={item.status}>{STATUS_LABELS[item.status] ?? item.status}</option>
                    )}
                  </select>
                </td>
                <td className="px-3 py-3 text-slate-700 text-xs">
                  {SELLER_TYPE_LABELS[item.sellerType] ?? item.sellerType}
                </td>
                <td className="px-3 py-3 text-xs text-slate-700">{item.planType ?? "—"}</td>
                <td className="px-3 py-3">
                  <TrustBadge score={item.trustScore} />
                </td>
                <td className="px-3 py-3 font-semibold text-slate-900 text-xs">
                  {item.priceAzn.toLocaleString("az-AZ")} ₼
                </td>
                <td className="px-3 py-3 text-xs text-slate-500">
                  {new Date(item.createdAt).toLocaleDateString("az-AZ")}
                </td>
                {/* Quick actions */}
                <td className="px-3 py-3">
                  <div className="flex flex-wrap items-center gap-1">
                    {item.status === "pending_review" && (
                      <button
                        type="button"
                        title="Təsdiqlə"
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        onClick={() => void quickStatusChange(item.id, "active")}
                      >
                        ✓
                      </button>
                    )}
                    {item.status !== "rejected" && (
                      <button
                        type="button"
                        title="Rədd et"
                        className="rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                        onClick={() => setRejectModal({ id: item.id, note: "" })}
                      >
                        ✗
                      </button>
                    )}
                    <button
                      type="button"
                      title="Redaktə et"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
                    {canDelete && (
                      <button
                        type="button"
                        title="Sil"
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                        onClick={() => setDeleteConfirm(item.id)}
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-sm text-slate-500">
                  Elan tapılmadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
