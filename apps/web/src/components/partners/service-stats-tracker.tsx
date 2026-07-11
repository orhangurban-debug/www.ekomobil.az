"use client";

import { useEffect } from "react";

export function ServiceStatsTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/services/${slug}/stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "view" })
    }).catch(() => {});
  }, [slug]);

  return null;
}

export function trackServiceContactClick(slug: string) {
  fetch(`/api/services/${slug}/stats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "contact_click" })
  }).catch(() => {});
}
