"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LeadRecord } from "@/lib/marketplace-types";

const STAGES = [
  { value: "new", label: "Yeni" },
  { value: "contacted", label: "Əlaqə qurulub" },
  { value: "visit_booked", label: "Baxış / görüş" },
  { value: "closed", label: "Bağlı" }
] as const;

type Stage = (typeof STAGES)[number]["value"];

const STAGE_LABELS: Record<string, string> = Object.fromEntries(STAGES.map((s) => [s.value, s.label]));

export function BusinessLeadsInbox({
  leads,
  updateUrlPrefix,
  title = "Sorğu qutusu",
  emptyMessage = "Hələ sorğu yoxdur."
}: {
  leads: Array<LeadRecord & { listingTitle?: string }>;
  updateUrlPrefix: "/api/dealer/leads" | "/api/parts/leads";
  title?: string;
  emptyMessage?: string;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function updateStage(leadId: string, stage: Stage) {
    setLoadingId(leadId);
    try {
      const res = await fetch(`${updateUrlPrefix}/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage })
      });
      if (res.ok) router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-900/10 px-6 py-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <span className="text-sm text-slate-400">{leads.length} sorğu</span>
      </div>
      {leads.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-slate-400">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left">Müştəri</th>
                <th className="px-6 py-3 text-left">Elan</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Cavab (dəq)</th>
                <th className="px-6 py-3 text-center">Hərəkət</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/10">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-900/5">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{lead.customerName}</div>
                    <div className="text-xs text-slate-500">{lead.customerPhone || lead.customerEmail || "—"}</div>
                    {lead.note && <div className="mt-1 text-xs text-slate-400 line-clamp-2">{lead.note}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/listings/${lead.listingId}`} className="text-[#0057FF] hover:underline">
                      {(lead as LeadRecord & { listingTitle?: string }).listingTitle || lead.listingId.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-center text-xs font-medium text-slate-600">
                    {STAGE_LABELS[lead.stage] ?? lead.stage}
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-slate-500">
                    {lead.responseTimeMinutes ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <select
                      className="input-field py-1 text-xs"
                      value={lead.stage}
                      disabled={loadingId === lead.id}
                      onChange={(e) => updateStage(lead.id, e.target.value as Stage)}
                    >
                      {STAGES.map((stage) => (
                        <option key={stage.value} value={stage.value}>{stage.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
