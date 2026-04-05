"use client";

import { useMemo, useState } from "react";

interface AdminSupportRequestRow {
  id: string;
  requestType: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  source: string;
  reporterUserId?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  listingId?: string;
  assignedToUserId?: string;
  assignedToEmail?: string;
  adminResponse?: string;
  responseAt?: string;
  resolvedAt?: string;
  lastActivityAt: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "Yeni" },
  { value: "in_progress", label: "İcrada" },
  { value: "waiting_user", label: "İstifadəçi cavabı gözlənilir" },
  { value: "resolved", label: "Həll edilib" },
  { value: "closed", label: "Bağlanıb" }
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Aşağı" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Yüksək" },
  { value: "urgent", label: "Təcili" }
];

export function AdminSupportRequestsTable({ items }: { items: AdminSupportRequestRow[] }) {
  const [rows, setRows] = useState(items);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [assigneeById, setAssigneeById] = useState<Record<string, string>>({});
  const [statusById, setStatusById] = useState<Record<string, string>>({});
  const [priorityById, setPriorityById] = useState<Record<string, string>>({});

  const initial = useMemo(
    () =>
      Object.fromEntries(
        rows.map((row) => [
          row.id,
          {
            status: row.status,
            priority: row.priority,
            assignedToUserId: row.assignedToUserId ?? "",
            adminResponse: row.adminResponse ?? ""
          }
        ])
      ),
    [rows]
  );

  async function saveRow(id: string) {
    const status = statusById[id] ?? initial[id]?.status ?? "new";
    const priority = priorityById[id] ?? initial[id]?.priority ?? "normal";
    const assignedToUserId = assigneeById[id] ?? initial[id]?.assignedToUserId ?? "";
    const adminResponse = noteById[id] ?? initial[id]?.adminResponse ?? "";
    setBusyId(id);
    try {
      const response = await fetch("/api/admin/support-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          priority,
          assignedToUserId: assignedToUserId.trim() ? assignedToUserId.trim() : undefined,
          adminResponse: adminResponse.trim() ? adminResponse.trim() : undefined
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        alert(payload.error ?? "Yeniləmə uğursuz oldu.");
        return;
      }
      setRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                status,
                priority,
                assignedToUserId: assignedToUserId.trim() ? assignedToUserId.trim() : row.assignedToUserId,
                adminResponse: adminResponse.trim() ? adminResponse.trim() : row.adminResponse,
                lastActivityAt: new Date().toISOString()
              }
            : row
        )
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Müraciət</th>
            <th className="px-4 py-3 text-left">Müraciətçi</th>
            <th className="px-4 py-3 text-left">Status/Prioritet</th>
            <th className="px-4 py-3 text-left">Cavab və təhkim</th>
            <th className="px-4 py-3 text-left">Vaxt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const busy = busyId === row.id;
            return (
              <tr key={row.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{row.subject}</div>
                  <div className="mt-1 line-clamp-4 text-xs text-slate-600">{row.message}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    Tip: {row.requestType} | Mənbə: {row.source}
                  </div>
                  <div className="text-[11px] text-slate-400">ID: {row.id}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-slate-900">{row.reporterName ?? "Anonim"}</div>
                  <div className="text-xs text-slate-600">{row.reporterEmail ?? "email yoxdur"}</div>
                  <div className="text-xs text-slate-600">{row.reporterPhone ?? "telefon yoxdur"}</div>
                  {row.listingId && <div className="text-[11px] text-slate-400">Elan: {row.listingId}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <select
                      className="input-field"
                      value={statusById[row.id] ?? row.status}
                      onChange={(e) => setStatusById((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <select
                      className="input-field"
                      value={priorityById[row.id] ?? row.priority}
                      onChange={(e) => setPriorityById((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <input
                      className="input-field"
                      value={assigneeById[row.id] ?? row.assignedToUserId ?? ""}
                      onChange={(e) => setAssigneeById((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      placeholder="Təhkim edilən user ID"
                    />
                    <textarea
                      className="input-field min-h-24"
                      value={noteById[row.id] ?? row.adminResponse ?? ""}
                      onChange={(e) => setNoteById((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      placeholder="Admin cavabı / daxili qeyd"
                    />
                    <button
                      type="button"
                      onClick={() => void saveRow(row.id)}
                      disabled={busy}
                      className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
                    >
                      {busy ? "Saxlanılır..." : "Yadda saxla"}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  <div>Yaradılıb: {new Date(row.createdAt).toLocaleString("az-AZ")}</div>
                  <div>Aktivlik: {new Date(row.lastActivityAt).toLocaleString("az-AZ")}</div>
                  <div>Cavab: {row.responseAt ? new Date(row.responseAt).toLocaleString("az-AZ") : "yoxdur"}</div>
                  <div>Həll: {row.resolvedAt ? new Date(row.resolvedAt).toLocaleString("az-AZ") : "yoxdur"}</div>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-10 text-center text-slate-400" colSpan={5}>
                Müraciət tapılmadı.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
