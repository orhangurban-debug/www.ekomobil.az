"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function DealerApplyPage() {
  const [form, setForm] = useState({
    businessName: "",
    voen: "",
    city: "Bakı",
    phone: "",
    website: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/support/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "dealer_upgrade",
          message: `Salon/Mağaza müraciəti:\nBiznes adı: ${form.businessName}\nVÖEN: ${form.voen}\nŞəhər: ${form.city}\nTelefon: ${form.phone}\nSayt: ${form.website || "—"}\nQeyd: ${form.description || "—"}`
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error || "Müraciət göndərilmədi. Yenidən cəhd edin.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Şəbəkə xətası baş verdi. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Müraciətiniz qəbul edildi</h1>
        <p className="mt-3 text-slate-500">
          Komandamız 1–2 iş günü ərzində e-poçt vasitəsilə əlaqə saxlayacaq. 
          VÖEN arayışı tələb oluna bilər.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/me" className="btn-primary">Profil səhifəsinə qayıt</Link>
          <Link href="/pricing#business" className="btn-secondary">Biznes planları</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Ana səhifə</Link>
        <span className="mx-2">/</span>
        <Link href="/pricing#business" className="hover:text-slate-900">Biznes planları</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Salon müraciəti</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Salon / Mağaza hesabı</h1>
        <p className="mt-2 text-slate-500">
          Aşağıdakı formu doldurun, komandamız müraciətinizi yoxlayıb hesabınızı aktivləşdirəcək.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Tələb olunan:</strong> VÖEN (vergi ödəyicisinin eyniləşdirmə nömrəsi) — müraciətin yoxlanması üçün lazımdır.
      </div>

      <form onSubmit={onSubmit} className="card p-8 space-y-5">
        <div>
          <label className="label">Biznes adı <span className="text-red-400">*</span></label>
          <input
            className="input-field"
            value={form.businessName}
            onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
            placeholder="Salon adı, MMC adı və s."
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">VÖEN <span className="text-red-400">*</span></label>
            <input
              className="input-field"
              value={form.voen}
              onChange={(e) => setForm((p) => ({ ...p, voen: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
              placeholder="10 rəqəm"
              required
            />
          </div>
          <div>
            <label className="label">Şəhər <span className="text-red-400">*</span></label>
            <select
              className="input-field"
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            >
              {["Bakı", "Sumqayıt", "Gəncə", "Lənkəran", "Digər"].map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Əlaqə telefonu <span className="text-red-400">*</span></label>
            <input
              className="input-field"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+994..."
              required
            />
          </div>
          <div>
            <label className="label">Vebsayt / sosial şəbəkə</label>
            <input
              className="input-field"
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              placeholder="instagram.com/... və ya yoxdur"
            />
          </div>
        </div>

        <div>
          <label className="label">Qeyd (istəyə görə)</label>
          <textarea
            className="input-field min-h-[80px] resize-none"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Biznes haqqında qısa məlumat, neçə avtomobil satırsınız və s."
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <button disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? "Göndərilir..." : "Müraciəti göndər"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Müraciəti göndərdikdən sonra hesabınız admin tərəfindən aktivləşdirilir (1–2 iş günü).
        Suallar üçün:{" "}
        <a href="mailto:info@ekomobil.az" className="text-[#0891B2] hover:underline">
          info@ekomobil.az
        </a>
      </p>
    </div>
  );
}
