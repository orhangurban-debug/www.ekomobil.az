"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuctionConfirmationPanel({
  auctionId,
  canActAsBuyer,
  canActAsSeller
}: {
  auctionId: string;
  canActAsBuyer: boolean;
  canActAsSeller: boolean;
}) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(actorRole: "buyer" | "seller", outcome: "confirmed" | "no_show" | "disputed") {
    setLoadingAction(`${actorRole}-${outcome}`);
    setMessage(null);
    setError(null);
    const response = await fetch(`/api/auctions/${auctionId}/confirm-sale`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actorRole,
        outcome,
        note:
          outcome === "confirmed"
            ? "Əməliyyat off-platform tamamlandı"
            : outcome === "no_show"
              ? "Qalib tərəf SLA daxilində növbəti addımı tamamlamadı"
              : "Tərəflər arasında mübahisə yarandı"
      })
    });
    const payload = (await response.json()) as { ok: boolean; error?: string };
    if (!payload.ok) {
      setError(payload.error || "Əməliyyat alınmadı.");
      setLoadingAction(null);
      return;
    }
    setMessage("Status yeniləndi.");
    setLoadingAction(null);
    router.refresh();
  }

  if (!canActAsBuyer && !canActAsSeller) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Satış nəticəsini təsdiqlə</h2>
      <p className="mt-2 text-sm text-slate-500">
        Burada əsas satış ödənişi deyil, yalnız satış nəticəsi qeyd olunur. Avtomobilin tam məbləği birbaşa tərəflər arasında ödənir.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {canActAsBuyer && (
          <>
            <button
              type="button"
              onClick={() => submit("buyer", "confirmed")}
              disabled={Boolean(loadingAction)}
              className="btn-primary justify-center"
            >
              {loadingAction === "buyer-confirmed" ? "Göndərilir..." : "Alıcı kimi təsdiqlə"}
            </button>
            <button
              type="button"
              onClick={() => submit("buyer", "disputed")}
              disabled={Boolean(loadingAction)}
              className="btn-secondary justify-center"
            >
              Mübahisə bildir
            </button>
          </>
        )}

        {canActAsSeller && (
          <>
            <button
              type="button"
              onClick={() => submit("seller", "confirmed")}
              disabled={Boolean(loadingAction)}
              className="btn-primary justify-center"
            >
              {loadingAction === "seller-confirmed" ? "Göndərilir..." : "Satıcı kimi təsdiqlə"}
            </button>
            <button
              type="button"
              onClick={() => submit("seller", "no_show")}
              disabled={Boolean(loadingAction)}
              className="btn-secondary justify-center"
            >
              No-show bildir
            </button>
          </>
        )}
      </div>

      {message && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
