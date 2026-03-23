"use client";

import { FormEvent, useState } from "react";

export function LeadCaptureForm({ listingId }: { listingId: string }) {
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", note: "" });
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/listings/${listingId}/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setState(response.ok ? "saved" : "error");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        className="input-field"
        placeholder="Adınız"
        value={form.customerName}
        onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))}
        required
      />
      <input
        className="input-field"
        placeholder="Telefon"
        value={form.customerPhone}
        onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
      />
      <input
        className="input-field"
        placeholder="Email"
        value={form.customerEmail}
        onChange={(e) => setForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
      />
      <textarea
        className="input-field min-h-[96px]"
        placeholder="Qeydiniz"
        value={form.note}
        onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
      />
      <button className="btn-primary w-full justify-center">Sorğu göndər</button>
      {state === "saved" && <p className="text-xs text-emerald-700">Sorğunuz dealer panelinə göndərildi.</p>}
      {state === "error" && <p className="text-xs text-red-700">Sorğu göndərilmədi. Yenidən cəhd edin.</p>}
    </form>
  );
}
