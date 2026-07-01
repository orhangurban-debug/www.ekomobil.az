"use client";

import { FormEvent, useState } from "react";
import type { LegalDataRequestRecord, LegalRequestStatus } from "@/server/legal-request-store";

const STATUS_LABELS: Record<LegalRequestStatus, string> = {
  received: "Qəbul edildi",
  verification: "Yoxlanılır",
  approved: "Təsdiqləndi",
  partially_disclosed: "Qismən təqdim olundu",
  disclosed: "Təqdim olundu",
  rejected: "Rədd edildi",
  closed: "Bağlandı"
};

export function AdminLegalRequestsPanel({ initialRequests }: { initialRequests: LegalDataRequestRecord[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    authorityName: "",
    requestType: "investigation",
    requestSummary: "",
    referenceNumber: "",
    subjectUserId: ""
  });

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/legal-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorityName: form.authorityName,
          requestType: form.requestType,
          requestSummary: form.requestSummary,
          referenceNumber: form.referenceNumber || undefined,
          subjectUserId: form.subjectUserId || undefined
        })
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        request?: LegalDataRequestRecord;
      };
      if (!payload.ok || !payload.request) {
        setError(payload.error || "Sorğu yaradılmadı.");
        return;
      }
      setRequests((prev) => [payload.request!, ...prev]);
      setForm({
        authorityName: "",
        requestType: "investigation",
        requestSummary: "",
        referenceNumber: "",
        subjectUserId: ""
      });
    } catch {
      setError("Şəbəkə xətası baş verdi.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: LegalRequestStatus) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/legal-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        request?: LegalDataRequestRecord;
      };
      if (!payload.ok || !payload.request) {
        setError(payload.error || "Status yenilənmədi.");
        return;
      }
      setRequests((prev) => prev.map((item) => (item.id === id ? payload.request! : item)));
    } catch {
      setError("Şəbəkə xətası baş verdi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={createRequest} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Yeni hüquqi sorğu qeydi</h2>
        <p className="mt-1 text-sm text-slate-500">
          Məhkəmə qərarı, cinayət araşdırması və ya rəsmi sorğu daxil olduqda burada qeyd edin.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Orqan adı</label>
            <input
              className="input-field"
              value={form.authorityName}
              onChange={(e) => setForm((p) => ({ ...p, authorityName: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Sorğu növü</label>
            <select
              className="input-field"
              value={form.requestType}
              onChange={(e) => setForm((p) => ({ ...p, requestType: e.target.value }))}
            >
              <option value="investigation">Araşdırma</option>
              <option value="court_order">Məhkəmə qərarı</option>
              <option value="subpoena">Subpoena / çağırış</option>
              <option value="emergency">Təcili</option>
              <option value="other">Digər</option>
            </select>
          </div>
          <div>
            <label className="label">Referans nömrəsi (opsional)</label>
            <input
              className="input-field"
              value={form.referenceNumber}
              onChange={(e) => setForm((p) => ({ ...p, referenceNumber: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Subyekt istifadəçi ID (opsional)</label>
            <input
              className="input-field font-mono text-sm"
              value={form.subjectUserId}
              onChange={(e) => setForm((p) => ({ ...p, subjectUserId: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="label">Sorğu xülasəsi</label>
          <textarea
            className="input-field min-h-24"
            value={form.requestSummary}
            onChange={(e) => setForm((p) => ({ ...p, requestSummary: e.target.value }))}
            required
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary mt-4 disabled:opacity-50">
          Sorğu qeyd et
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Referans</th>
              <th className="px-4 py-3">Orqan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Subyekt</th>
              <th className="px-4 py-3">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Hüquqi sorğu qeydi yoxdur.
                </td>
              </tr>
            ) : (
              requests.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-mono text-xs">{item.referenceNumber}</td>
                  <td className="px-4 py-3">{item.authorityName}</td>
                  <td className="px-4 py-3">{STATUS_LABELS[item.status]}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.subjectUserId ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input-field py-1 text-xs"
                      value={item.status}
                      onChange={(e) => void updateStatus(item.id, e.target.value as LegalRequestStatus)}
                      disabled={loading}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
