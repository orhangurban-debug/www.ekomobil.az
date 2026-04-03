"use client";

import { useState } from "react";

interface AdminIncidentCase {
  id: string;
  sourceType: "incident" | "manual_review" | "auction_case";
  subjectType: string;
  subjectId: string;
  category: string;
  severity: string;
  status: string;
  title: string;
  description?: string;
  assignedToUserId?: string;
  openedAt: string;
}

const INCIDENT_SOURCE_LABELS: Record<AdminIncidentCase["sourceType"], string> = {
  incident: "İstifadəçi insidenti",
  manual_review: "Əl baxışı",
  auction_case: "Auksion halı"
};

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  open: "Açıq",
  triage: "İlkin baxış",
  in_review: "Araşdırmada",
  actioned: "Tədbir görülüb",
  resolved: "Həll edilib",
  dismissed: "Əsassız sayılıb"
};

const INCIDENT_SEVERITY_LABELS: Record<string, string> = {
  low: "Aşağı",
  medium: "Orta",
  high: "Yüksək",
  critical: "Kritik"
};

export function AdminIncidentsTable({ items }: { items: AdminIncidentCase[] }) {
  const [rows, setRows] = useState(items);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateIncidentStatus(id: string, status: string) {
    if (id.startsWith("review:") || id.startsWith("auction:")) {
      alert("Törəmə haldır. Bu hal mənbə sistemindən idarə olunur.");
      return;
    }
    setBusyId(id);
    const prev = rows;
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
    try {
      const response = await fetch(`/api/admin/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: "Admin status yeniləməsi" })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error || "İnsident yenilənməsi uğursuz oldu");
    } catch {
      setRows(prev);
      alert("İnsident yenilənməsi uğursuz oldu");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Hal</th>
            <th className="px-4 py-3 text-left">Mənbə</th>
            <th className="px-4 py-3 text-left">Kateqoriya</th>
            <th className="px-4 py-3 text-left">Vaciblik dərəcəsi</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Açılıb</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{item.title}</div>
                <div className="text-xs text-slate-500">{item.subjectType}:{item.subjectId}</div>
                <div className="text-[11px] text-slate-400">{item.id}</div>
                {item.description ? <p className="mt-1 text-xs text-slate-500">{item.description}</p> : null}
              </td>
              <td className="px-4 py-3 text-slate-700">{INCIDENT_SOURCE_LABELS[item.sourceType] || item.sourceType}</td>
              <td className="px-4 py-3 text-slate-700">{item.category}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                  {INCIDENT_SEVERITY_LABELS[item.severity] || item.severity}
                </span>
              </td>
              <td className="px-4 py-3">
                <select
                  value={item.status}
                  disabled={busyId === item.id || item.id.startsWith("review:") || item.id.startsWith("auction:")}
                  onChange={(e) => void updateIncidentStatus(item.id, e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                >
                  <option value="open">{INCIDENT_STATUS_LABELS.open}</option>
                  <option value="triage">{INCIDENT_STATUS_LABELS.triage}</option>
                  <option value="in_review">{INCIDENT_STATUS_LABELS.in_review}</option>
                  <option value="actioned">{INCIDENT_STATUS_LABELS.actioned}</option>
                  <option value="resolved">{INCIDENT_STATUS_LABELS.resolved}</option>
                  <option value="dismissed">{INCIDENT_STATUS_LABELS.dismissed}</option>
                </select>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{new Date(item.openedAt).toLocaleString("az-AZ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
