"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function InspectionPage() {
  const searchParams = useSearchParams();
  const listingIdFromParams = searchParams.get("listingId") ?? "";
  const [form, setForm] = useState({
    listingId: listingIdFromParams,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    preferredDate: "",
    note: ""
  });
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("idle");
    const res = await fetch("/api/inspection/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setState(res.ok ? "saved" : "error");
    if (res.ok) setForm({ listingId: "", customerName: "", customerPhone: "", customerEmail: "", preferredDate: "", note: "" });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <nav className="mb-8 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Ana səhifə</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Ekspertiza sifarişi</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900">Ekspertiza sifariş et</h1>
      <p className="mt-2 text-slate-500">
        Avtomobilin texniki vəziyyətini müstəqil ekspert tərəfindən yoxlatmaq üçün sorğu göndərin.
      </p>

      <form onSubmit={onSubmit} className="card p-6 mt-8 space-y-5">
        <div>
          <label className="label">Elan ID (əgər bilirsinizsə)</label>
          <input
            className="input-field"
            value={form.listingId}
            onChange={(e) => setForm((p) => ({ ...p, listingId: e.target.value }))}
            placeholder="Məs: 1 və ya listing URL-dən"
          />
        </div>
        <div>
          <label className="label">Adınız *</label>
          <input
            className="input-field"
            value={form.customerName}
            onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="label">Telefon *</label>
          <input
            className="input-field"
            type="tel"
            value={form.customerPhone}
            onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))}
            placeholder="+994..."
            required
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input-field"
            type="email"
            value={form.customerEmail}
            onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Üstünlük verilən tarix</label>
          <input
            className="input-field"
            type="date"
            value={form.preferredDate}
            onChange={(e) => setForm((p) => ({ ...p, preferredDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Qeyd</label>
          <textarea
            className="input-field min-h-[100px]"
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            placeholder="Əlavə məlumat və ya suallar"
          />
        </div>

        {state === "saved" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Sorğunuz qeydə alındı. Əlaqə nömrənizə 24 saat ərzində geri dönüş edəcəyik.
          </div>
        )}
        {state === "error" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Sorğu göndərilmədi. Yenidən cəhd edin və ya bizimlə əlaqə saxlayın.
          </div>
        )}

        <button type="submit" className="btn-primary w-full justify-center py-3">
          Sorğu göndər
        </button>
      </form>

      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="font-semibold text-slate-900">Ekspertiza nədir?</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Müstəqil ekspert avtomobilin texniki vəziyyətini, qəza izlərini, yürüş uyğunluğunu və 
          ümumi baxım keyfiyyətini yoxlayır. Bu xidmət alıcıya əlavə etibar verir.
        </p>
      </div>

      <div className="mt-6">
        <Link href="/listings" className="btn-secondary">Elanlara qayıt</Link>
      </div>
    </div>
  );
}
