"use client";

import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ui/toast-provider";

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

function derivedOpsHref(item: AdminIncidentCase): string | null {
  if (item.sourceType === "manual_review") {
    return item.subjectType === "listing" ? `/listings/${item.subjectId}` : "/ops/reviews";
  }
  if (item.sourceType === "auction_case") {
    return `/auction/${item.subjectId}`;
  }
  return null;
}

export function AdminIncidentsTable({ items }: { items: AdminIncidentCase[] }) {
  const [rows, setRows] = useState(items);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();

  async function updateIncidentStatus(id: string, status: string) {
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
      toast.error("İnsident yenilənməsi uğursuz oldu");
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
        <p className="text-sm font-medium text-slate-700">Hal tapılmadı</p>
        <p className="mt-1 text-xs text-slate-400">Filteri dəyişin və ya yeni insident yaradın.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Hal</th>
            <th className="px-4 py-3 text-left">Mənbə</th>
            <th className="px-4 py-3 text-left">Kateqoriya</th>
            <th className="px-4 py-3 text-left">Vaciblik</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Açılıb</th>
            <th className="px-4 py-3 text-left">Keçid</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((item) => {
            const isDerived = item.sourceType !== "incident";
            const opsHref = derivedOpsHref(item);
            return (
              <tr key={item.id} className={isDerived ? "bg-slate-50/60" : undefined}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.subjectType}:{item.subjectId}</div>
                  {item.description ? <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.description}</p> : null}
                </td>
                <td className="px-4 py-3 text-slate-700">{INCIDENT_SOURCE_LABELS[item.sourceType] || item.sourceType}</td>
                <td className="px-4 py-3 text-slate-700">{item.category}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                    {INCIDENT_SEVERITY_LABELS[item.severity] || item.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {isDerived ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {INCIDENT_STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  ) : (
                    <select
                      value={item.status}
                      disabled={busyId === item.id}
                      onChange={(e) => void updateIncidentStatus(item.id, e.target.value)}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    >
                      {Object.entries(INCIDENT_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(item.openedAt).toLocaleString("az-AZ")}</td>
                <td className="px-4 py-3">
                  {opsHref ? (
                    <Link href={opsHref} className="text-xs font-medium text-[#0891B2] hover:underline">
                      {item.sourceType === "manual_review" ? "Elan / baxış" : "Auksion lotu"}
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
