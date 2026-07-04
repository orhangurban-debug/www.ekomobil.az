"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BusinessPlanCheckoutButton(props: {
  businessType: "dealer" | "parts_store";
  planId: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activationResult, setActivationResult] = useState<{
    isTrial: boolean;
    expiresAt: string | null;
  } | null>(null);

  async function onCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/business-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: props.businessType,
          planId: props.planId
        })
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        checkoutUrl?: string;
        status?: string;
        isTrial?: boolean;
        expiresAt?: string | null;
      };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Ödəniş başlatmaq mümkün olmadı.");
        return;
      }
      // Plan bank ödənişi olmadan dərhal aktivləşdi (trial və ya $0 promo)
      if (!payload.checkoutUrl || payload.status === "succeeded") {
        setActivationResult({
          isTrial: payload.isTrial ?? false,
          expiresAt: payload.expiresAt ?? null
        });
        router.refresh();
        return;
      }
      router.push(payload.checkoutUrl);
      router.refresh();
    } catch {
      setError("Server xətası oldu.");
    } finally {
      setLoading(false);
    }
  }

  const expiryLabel = activationResult?.expiresAt
    ? new Date(activationResult.expiresAt).toLocaleDateString("az-AZ", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={props.className ?? "btn-primary"}
        onClick={onCheckout}
        disabled={loading || Boolean(activationResult)}
      >
        {activationResult
          ? "Aktivləşdirildi ✓"
          : loading
          ? "Göndərilir..."
          : (props.label ?? "Planı aktiv et")}
      </button>
      {activationResult && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-800">
          {activationResult.isTrial ? (
            <>
              <p className="font-semibold">30 günlük pulsuz sınaq başladı!</p>
              {expiryLabel && (
                <p className="mt-0.5">Sınaq müddəti: <span className="font-medium">{expiryLabel}</span> tarixinə qədər.</p>
              )}
              <p className="mt-1 text-emerald-700">Müddət bitdikdən sonra abunəni davam etdirmək üçün ödəniş tələb olunacaq.</p>
            </>
          ) : (
            <p className="font-semibold">Plan uğurla aktivləşdirildi.</p>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
