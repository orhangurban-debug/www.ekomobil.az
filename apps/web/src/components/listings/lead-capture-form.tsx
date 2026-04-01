"use client";

import { FormEvent, useState } from "react";

export function LeadCaptureForm({ listingId }: { listingId: string }) {
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", note: "" });
  const [state, setState] = useState<"idle" | "loading" | "saved" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    try {
      const response = await fetch(`/api/listings/${listingId}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (response.ok) {
        setState("saved");
        setForm({ customerName: "", customerPhone: "", customerEmail: "", note: "" });
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "saved") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <svg className="mx-auto mb-2 h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="font-medium text-emerald-800">Sorğunuz göndərildi</p>
        <p className="mt-1 text-xs text-emerald-600">Satıcı sizinlə ən qısa zamanda əlaqə saxlayacaq.</p>
        <button onClick={() => setState("idle")} className="mt-3 text-xs text-emerald-700 underline">
          Yeni sorğu göndər
        </button>
      </div>
    );
  }

  const isLoading = state === "loading";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        className="input-field"
        placeholder="Adınız *"
        value={form.customerName}
        onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))}
        disabled={isLoading}
        required
      />
      <input
        className="input-field"
        placeholder="Telefon"
        value={form.customerPhone}
        onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
        disabled={isLoading}
      />
      <input
        className="input-field"
        placeholder="Email"
        value={form.customerEmail}
        onChange={(e) => setForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
        disabled={isLoading}
      />
      <textarea
        className="input-field min-h-[96px]"
        placeholder="Qeydiniz"
        value={form.note}
        onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
        disabled={isLoading}
      />
      <button className="btn-primary w-full justify-center" disabled={isLoading}>
        {isLoading ? "Göndərilir..." : "Sorğu göndər"}
      </button>
      {state === "error" && (
        <p className="text-xs text-red-700">Sorğu göndərilmədi. Yenidən cəhd edin.</p>
      )}
    </form>
  );
}
