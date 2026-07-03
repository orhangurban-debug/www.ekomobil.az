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
  const [activated, setActivated] = useState(false);

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
      };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Ödəniş başlatmaq mümkün olmadı.");
        return;
      }
      // Açılış kampaniyası aktivdirsə plan bank ödənişi olmadan dərhal aktivləşir.
      if (!payload.checkoutUrl || payload.status === "succeeded") {
        setActivated(true);
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

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={props.className ?? "btn-primary"}
        onClick={onCheckout}
        disabled={loading || activated}
      >
        {activated ? "Aktivləşdirildi ✓" : loading ? "Göndərilir..." : (props.label ?? "Planı aktiv et")}
      </button>
      {activated && (
        <p className="text-xs font-medium text-emerald-700">
          Açılış kampaniyası ilə plan pulsuz aktivləşdirildi.
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
