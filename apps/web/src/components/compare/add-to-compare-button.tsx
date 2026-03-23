"use client";

import { useCompare } from "@/components/compare/compare-context";

export function AddToCompareButton({ listingId }: { listingId: string }) {
  const { ids, toggle } = useCompare();
  const active = ids.includes(listingId);

  return (
    <button
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(listingId);
      }}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-brand-600 text-white" : "bg-white/90 text-slate-700 border border-slate-200"
      }`}
    >
      {active ? "Müqayisədədir" : "Müqayisə et"}
    </button>
  );
}
