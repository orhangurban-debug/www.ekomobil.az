"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function KycReviewActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function send(decision: "approved" | "rejected") {
    setLoading(decision);
    setError(null);
    const res = await fetch(`/api/ops/kyc/${userId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note: note.trim() || undefined })
    });
    const payload = (await res.json()) as { ok: boolean; error?: string };
    if (!payload.ok) {
      setError(payload.error ?? "Əməliyyat uğursuz oldu");
      setLoading(null);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        className="min-h-[64px] rounded-md border border-slate-200 px-2.5 py-2 text-xs text-slate-700 focus:border-brand-500 focus:outline-none"
        placeholder="Ops qeydi (opsional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          disabled={loading !== null}
          onClick={() => void send("approved")}
        >
          {loading === "approved" ? "Təsdiqlənir..." : "Təsdiq et"}
        </button>
        <button
          type="button"
          className="rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          disabled={loading !== null}
          onClick={() => void send("rejected")}
        >
          {loading === "rejected" ? "Rədd edilir..." : "Rədd et"}
        </button>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
