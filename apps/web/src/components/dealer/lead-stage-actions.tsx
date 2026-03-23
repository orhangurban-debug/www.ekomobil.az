"use client";

import { useState } from "react";

type Stage = "new" | "contacted" | "visit_booked" | "closed";

const STAGES: { value: Stage; label: string }[] = [
  { value: "new", label: "Yeni" },
  { value: "contacted", label: "Əlaqə qurulub" },
  { value: "visit_booked", label: "Baxış var" },
  { value: "closed", label: "Bağlı" }
];

export function LeadStageActions({
  leadId,
  currentStage,
  onUpdated
}: {
  leadId: string;
  currentStage: Stage;
  onUpdated?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function updateStage(stage: Stage) {
    if (stage === currentStage) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dealer/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage })
      });
      if (res.ok) {
        onUpdated?.();
        if (typeof window !== "undefined") window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-1">
      {STAGES.map((s) => (
        <button
          key={s.value}
          onClick={() => updateStage(s.value)}
          disabled={loading || s.value === currentStage}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
            s.value === currentStage
              ? "bg-brand-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
