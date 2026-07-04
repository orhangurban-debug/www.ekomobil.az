"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DraftListingActionsProps {
  listingId: string;
  pendingPaymentId?: string;
}

export function DraftListingActions({ listingId, pendingPaymentId }: DraftListingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleActivateFree() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}/activate-free`, { method: "POST" });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Xəta baş verdi");
      } else {
        router.refresh();
      }
    } catch {
      setError("Serverlə əlaqə qurulmadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
      <p className="text-xs font-medium text-amber-800">Ödəniş tamamlanmayıb</p>
      <p className="mt-0.5 text-xs text-amber-700">
        Elanınız qaralama olaraq saxlanıb. Ödənişi tamamlayın və ya pulsuz yerləşdirin.
      </p>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {pendingPaymentId && (
          <Link
            href={`/payments/listing-plan/${pendingPaymentId}`}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
          >
            Ödənişi tamamla →
          </Link>
        )}
        <button
          onClick={handleActivateFree}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-50 disabled:opacity-50"
        >
          {loading ? "Gözləyin..." : "Pulsuz yerləşdir"}
        </button>
      </div>
    </div>
  );
}
