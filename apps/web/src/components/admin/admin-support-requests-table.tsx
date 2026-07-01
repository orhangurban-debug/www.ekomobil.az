"use client";

import { useMemo, useState } from "react";
import {
  PRIORITY_LABELS,
  REQUEST_TYPE_LABELS,
  STATUS_LABELS
} from "@/lib/support-contact";

export interface AdminSupportRequestRow {
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

export interface AssignableStaff {
  id: string;
  email: string;
  role: string;
  fullName?: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "Yeni" },
  { value: "in_progress", label: "İcrada" },
  { value: "waiting_user", label: "Cavab gözlənilir" },
  { value: "resolved", label: "Həll edilib" },
  { value: "closed", label: "Bağlanıb" }
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Aşağı" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Yüksək" },
  { value: "urgent", label: "Təcili" }
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case "new":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "in_progress":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "waiting_user":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "resolved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "closed":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case "urgent":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "high":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    case "low":
      return "bg-slate-50 text-slate-500 ring-slate-200";
    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function staffLabel(staff: AssignableStaff): string {
  const name = staff.fullName?.trim();
  return name ? `${name} (${staff.email})` : staff.email;
}

export function AdminSupportRequestsTable({
  items,
  assignees
}: {
  items: AdminSupportRequestRow[];
  assignees: AssignableStaff[];
}) {
  const [rows, setRows] = useState(items);
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId]
  );

  const [draft, setDraft] = useState({
    status: selected?.status ?? "new",
    priority: selected?.priority ?? "normal",
    assignedToUserId: selected?.assignedToUserId ?? "",
    adminResponse: selected?.adminResponse ?? ""
  });

  function selectRow(row: AdminSupportRequestRow) {
    setSelectedId(row.id);
    setDraft({
      status: row.status,
      priority: row.priority,
      assignedToUserId: row.assignedToUserId ?? "",
      adminResponse: row.adminResponse ?? ""
    });
    setError(null);
    setEmailSent(false);
  }

  async function saveSelected() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setEmailSent(false);
    try {
      const response = await fetch("/api/admin/support-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          status: draft.status,
          priority: draft.priority,
          assignedToUserId: draft.assignedToUserId.trim() || null,
          adminResponse: draft.adminResponse.trim() || undefined
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; emailSent?: boolean };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Yeniləmə uğursuz oldu.");
        return;
      }
      const assignee = assignees.find((a) => a.id === draft.assignedToUserId);
      setRows((prev) =>
        prev.map((row) =>
          row.id === selected.id
            ? {
                ...row,
                status: draft.status,
                priority: draft.priority,
                assignedToUserId: draft.assignedToUserId || undefined,
                assignedToEmail: assignee?.email,
                adminResponse: draft.adminResponse.trim() || row.adminResponse,
                responseAt: draft.adminResponse.trim() ? new Date().toISOString() : row.responseAt,
                lastActivityAt: new Date().toISOString()
              }
            : row
        )
      );
      if (payload.emailSent) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 6000);
      }
    } finally {
      setBusy(false);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
        <p className="text-sm font-medium text-slate-700">Müraciət tapılmadı</p>
        <p className="mt-1 text-xs text-slate-400">Filterləri dəyişin və ya yeni müraciət gözləyin.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid min-h-[560px] lg:grid-cols-[340px_1fr]">
        {/* Ticket list */}
        <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inbox</p>
            <p className="text-sm text-slate-700">{rows.length} müraciət</p>
          </div>
          <ul className="max-h-[520px] divide-y divide-slate-100 overflow-y-auto">
            {rows.map((row) => {
              const active = row.id === selectedId;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => selectRow(row)}
                    className={`w-full px-4 py-3 text-left transition ${
                      active ? "bg-[#0891B2]/5 border-l-2 border-[#0891B2]" : "hover:bg-slate-50 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`line-clamp-1 text-sm font-semibold ${active ? "text-[#0891B2]" : "text-slate-900"}`}>
                        {row.subject}
                      </p>
                      {row.status === "new" && (
                        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${statusBadgeClass(row.status)}`}>
                        {STATUS_LABELS[row.status] ?? row.status}
                      </span>
                      {row.priority === "urgent" || row.priority === "high" ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${priorityBadgeClass(row.priority)}`}>
                          {PRIORITY_LABELS[row.priority]}
                        </span>
                      ) : null}
                      <span className="text-[10px] text-slate-400">{formatWhen(row.createdAt)}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="flex flex-col">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{selected.subject}</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {REQUEST_TYPE_LABELS[selected.requestType] ?? selected.requestType} · ID {selected.id.slice(0, 8)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusBadgeClass(selected.status)}`}>
                    {STATUS_LABELS[selected.status] ?? selected.status}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${priorityBadgeClass(selected.priority)}`}>
                    {PRIORITY_LABELS[selected.priority] ?? selected.priority}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {/* Reporter */}
              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Müraciətçi</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Ad</p>
                    <p className="font-medium text-slate-900">{selected.reporterName ?? "Anonim"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">E-poçt</p>
                    <p className="font-medium text-slate-900">{selected.reporterEmail ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Telefon</p>
                    <p className="font-medium text-slate-900">{selected.reporterPhone ?? "—"}</p>
                  </div>
                  {selected.listingId && (
                    <div>
                      <p className="text-xs text-slate-400">Elan ID</p>
                      <p className="font-mono text-xs text-slate-700">{selected.listingId}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Message */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Müraciət mətni</p>
                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {selected.message}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Yaradılıb: {formatWhen(selected.createdAt)} · Son aktivlik: {formatWhen(selected.lastActivityAt)}
                </p>
              </section>

              {/* Controls */}
              <section className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                  <select
                    className="input-field"
                    value={draft.status}
                    onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prioritet</span>
                  <select
                    className="input-field"
                    value={draft.priority}
                    onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5 sm:col-span-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Təhkim et</span>
                  <select
                    className="input-field"
                    value={draft.assignedToUserId}
                    onChange={(e) => setDraft((d) => ({ ...d, assignedToUserId: e.target.value }))}
                  >
                    <option value="">Təhkim olunmayıb</option>
                    {assignees.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staffLabel(staff)} · {staff.role}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              {/* Reply */}
              <section>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cavab (istifadəçiyə e-poçt göndərilir)
                  </span>
                  <textarea
                    className="input-field min-h-36"
                    value={draft.adminResponse}
                    onChange={(e) => setDraft((d) => ({ ...d, adminResponse: e.target.value }))}
                    placeholder="Cavabınızı yazın. İstifadəçi e-poçtuna göndəriləcək — e-poçta reply işləmir, saytdan yeni müraciət göndərməlidir."
                  />
                </label>
                {selected.reporterEmail ? (
                  <p className="mt-1.5 text-xs text-slate-400">Göndəriləcək ünvan: {selected.reporterEmail}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-amber-600">E-poçt yoxdur — cavab yalnız sistemdə saxlanılacaq.</p>
                )}
                {selected.responseAt && (
                  <p className="mt-1 text-xs text-slate-400">Son cavab: {formatWhen(selected.responseAt)}</p>
                )}
              </section>
            </div>

            {/* Footer actions */}
            <div className="border-t border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void saveSelected()}
                  disabled={busy}
                  className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60"
                >
                  {busy ? "Saxlanılır..." : "Saxla və cavab göndər"}
                </button>
                {emailSent && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    E-poçt göndərildi
                  </span>
                )}
                {error && <span className="text-sm text-rose-600">{error}</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-10 text-sm text-slate-400">
            Müraciət seçin
          </div>
        )}
      </div>
    </div>
  );
}
