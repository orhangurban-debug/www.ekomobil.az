"use client";

import { useEffect, useState } from "react";

export interface LaunchPromoStatus {
  active: boolean;
  badge: string | null;
}

/**
 * Fetches live "açılış kampaniyası" status from the server so client-only
 * publish/upgrade forms can show correct pricing without an async server wrapper.
 * Defaults to inactive until the response arrives (never blocks rendering).
 */
export function useLaunchPromo(): LaunchPromoStatus {
  const [status, setStatus] = useState<LaunchPromoStatus>({ active: false, badge: null });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/launch-promo")
      .then((res) => res.json())
      .then((data: { ok: boolean; active?: boolean; badge?: string | null }) => {
        if (cancelled || !data.ok) return;
        setStatus({ active: Boolean(data.active), badge: data.badge ?? null });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
