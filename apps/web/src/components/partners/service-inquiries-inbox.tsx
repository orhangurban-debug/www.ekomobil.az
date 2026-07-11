"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STAGES = [
  { value: "new", label: "Yeni" },
  { value: "contacted", label: "Əlaqə qurulub" },
  { value: "visit_booked", label: "Baxış / görüş" },
  { value: "closed", label: "Bağlı" }
] as const;

type Stage = (typeof STAGES)[number]["value"];

export interface ServiceInquiryItem {
  id: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  preferredDate?: string;
  note?: string;
  stage: string;
}

export function ServiceInquiriesInbox({ inquiries }: { inquiries: ServiceInquiryItem[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function updateStage(id: string, stage: Stage) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/partners/service-inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage })
      });
      if (res.ok) router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  if (inquiries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500">
        Hələ xidmət sorğusu yoxdur.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {inquiries.map((item) => (
        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">{item.customerName}</p>
              <p className="text-sm text-slate-500">{item.customerPhone}{item.customerEmail ? ` · ${item.customerEmail}` : ""}</p>
              <p className="mt-1 text-xs text-slate-400">{item.serviceName}{item.preferredDate ? ` · ${item.preferredDate}` : ""}</p>
              {item.note && <p className="mt-2 text-sm text-slate-600">{item.note}</p>}
            </div>
            <select
              className="input-field py-1 text-xs"
              value={item.stage}
              disabled={loadingId === item.id}
              onChange={(e) => updateStage(item.id, e.target.value as Stage)}
            >
              {STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>{stage.label}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
