"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OpsDocumentReviewButtons({
  docId,
  auctionId
}: {
  docId: string;
  auctionId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function review(status: "approved" | "rejected") {
    setBusy(status);
    try {
      const res = await fetch(`/api/ops/auction-documents/${docId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, note: note.trim() || undefined })
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        window.alert(data.error || "Əməliyyat alınmadı");
        return;
      }
      setNote("");
      router.refresh();
    } catch {
      window.alert("Əməliyyat zamanı şəbəkə xətası baş verdi");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="text"
        placeholder="Qeyd (opsional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="input-field max-w-xs text-xs"
      />
      <div className="flex gap-2">
        <a
          href={`/api/auctions/${auctionId}/documents/${docId}/file`}
          className="btn-secondary justify-center text-xs"
          target="_blank"
          rel="noreferrer"
        >
          Fayl
        </a>
        <button
          type="button"
          disabled={Boolean(busy)}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          onClick={() => void review("approved")}
        >
          {busy === "approved" ? "..." : "Təsdiq"}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          onClick={() => void review("rejected")}
        >
          {busy === "rejected" ? "..." : "Rədd"}
        </button>
      </div>
    </div>
  );
}
