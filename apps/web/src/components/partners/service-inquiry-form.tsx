"use client";

import { useState } from "react";

export function ServiceInquiryForm({ slug }: { slug: string }) {
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    preferredDate: "",
    note: ""
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/services/${slug}/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Sorğu göndərilmədi.");
        return;
      }
      setDone(true);
    } catch {
      setError("Şəbəkə xətası.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
        Sorğunuz qəbul edildi. Servis tərəfdaşı tezliklə sizinlə əlaqə saxlayacaq.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-900/10 bg-white p-5 space-y-3">
      <h3 className="font-semibold text-slate-900">Xidmət sorğusu göndər</h3>
      <input className="input-field" placeholder="Adınız *" value={form.customerName} onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))} required />
      <input className="input-field" placeholder="Telefon *" value={form.customerPhone} onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))} required />
      <input className="input-field" placeholder="E-poçt (istəyə görə)" value={form.customerEmail} onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))} />
      <input className="input-field" type="date" value={form.preferredDate} onChange={(e) => setForm((p) => ({ ...p, preferredDate: e.target.value }))} />
      <textarea className="input-field min-h-[80px]" placeholder="Qeyd" value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? "Göndərilir..." : "Sorğu göndər"}
      </button>
    </form>
  );
}
