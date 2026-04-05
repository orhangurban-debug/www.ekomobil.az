"use client";

import { useEffect, useMemo, useState } from "react";
import { trackListingStat } from "@/lib/listing-stats-client";

interface ListingStatsPanelProps {
  listingId: string;
  initialStats: {
    viewCount: number;
    contactClickCount: number;
    testDriveClickCount: number;
  };
}

export function ListingStatsPanel({ listingId, initialStats }: ListingStatsPanelProps) {
  const [stats, setStats] = useState(initialStats);

  const viewKey = useMemo(() => `ekomobil_listing_viewed_${listingId}`, [listingId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyViewed = window.sessionStorage.getItem(viewKey) === "1";
    if (!alreadyViewed) {
      void trackListingStat(listingId, "view");
      window.sessionStorage.setItem(viewKey, "1");
    }

    function onStatBump(event: Event) {
      const custom = event as CustomEvent<{ listingId?: string; action?: string }>;
      if (custom.detail?.listingId !== listingId) return;
      if (custom.detail.action === "contact_click") {
        setStats((prev) => ({ ...prev, contactClickCount: prev.contactClickCount + 1 }));
      }
      if (custom.detail.action === "test_drive_click") {
        setStats((prev) => ({ ...prev, testDriveClickCount: prev.testDriveClickCount + 1 }));
      }
    }

    window.addEventListener("listing-stat-bump", onStatBump);
    return () => window.removeEventListener("listing-stat-bump", onStatBump);
  }, [listingId, viewKey]);

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-slate-900">Elan statistikası</h3>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className="text-xs text-slate-500">Baxış</div>
          <div className="mt-1 text-base font-bold text-slate-900">{stats.viewCount.toLocaleString("az-AZ")}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className="text-xs text-slate-500">Əlaqə klik</div>
          <div className="mt-1 text-base font-bold text-slate-900">{stats.contactClickCount.toLocaleString("az-AZ")}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5">
          <div className="text-xs text-slate-500">Test sürüş klik</div>
          <div className="mt-1 text-base font-bold text-slate-900">{stats.testDriveClickCount.toLocaleString("az-AZ")}</div>
        </div>
      </div>
    </div>
  );
}
