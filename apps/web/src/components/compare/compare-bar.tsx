"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCompare } from "@/components/compare/compare-context";

export function CompareBar() {
  const pathname = usePathname();
  const { ids, clear } = useCompare();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || ids.length === 0 || pathname === "/") return null;

  const href = `/compare?ids=${ids.join(",")}`;
  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,640px)] -translate-x-1/2 rounded-2xl border border-slate-900/10 bg-white/90 p-4 shadow-[0_8px_32px_rgba(15,23,42,0.16)] backdrop-blur-xl">
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
