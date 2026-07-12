"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ListingStatus } from "@/lib/marketplace-types";

interface Props {
  listingId: string;
  status: ListingStatus | string;
  variant?: "inline" | "stack";
}

export function OwnerListingLifecycleActions({ listingId, status, variant = "inline" }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"hide" | "unhide" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "hide" | "unhide" | "delete", confirmMessage?: string) {
    if (busy) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setBusy(action);
    setError(null);
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Əməliyyat uğursuz oldu.");
        return;
      }
      router.refresh();
    } catch {
      setError("Əməliyyat uğursuz oldu.");
    } finally {
      setBusy(null);
    }
  }

  const btn =
    variant === "stack"
      ? "w-full rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-60"
      : "text-xs font-medium transition hover:underline disabled:opacity-60";

  return (
    <div className={variant === "stack" ? "space-y-2" : "flex flex-wrap items-center gap-3"}>
      {status === "active" && (
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void run("hide")}
          className={
            variant === "stack"
              ? `${btn} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`
              : `${btn} text-slate-600`
          }
        >
          {busy === "hide" ? "Gizlədilir..." : "Gizlət"}
        </button>
      )}
      {status === "inactive" && (
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void run("unhide")}
          className={
            variant === "stack"
              ? `${btn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`
              : `${btn} text-emerald-700`
          }
        >
          {busy === "unhide" ? "Açılır..." : "Yenidən aç"}
        </button>
      )}
      {status !== "archived" && (
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() =>
            void run("delete", "Elanı silmək istəyirsiniz? Elan arxivə köçürüləcək və axtarışda görünməyəcək.")
          }
          className={
            variant === "stack"
              ? `${btn} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`
              : `${btn} text-red-600`
          }
        >
          {busy === "delete" ? "Silinir..." : "Sil"}
        </button>
      )}
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
