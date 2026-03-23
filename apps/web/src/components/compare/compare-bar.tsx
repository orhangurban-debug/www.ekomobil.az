"use client";

import Link from "next/link";
import { useCompare } from "@/components/compare/compare-context";

export function CompareBar() {
  const { ids, clear } = useCompare();
  if (ids.length === 0) return null;

  const href = `/compare?ids=${ids.join(",")}`;
  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,640px)] -translate-x-1/2 rounded-2xl border border-soft-brown bg-white p-4 shadow-card backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Müqayisə aləti</div>
          <div className="text-xs text-slate-500">{ids.length} elan seçilib</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clear} className="btn-secondary text-xs">Sıfırla</button>
          <Link href={href} className="btn-primary text-xs">Müqayisəyə keç</Link>
        </div>
      </div>
    </div>
  );
}
