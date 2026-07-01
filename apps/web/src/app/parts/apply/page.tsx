"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function PartsApplyPage() {
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
          requestType: "partnership",
          subject: `Mağaza müraciəti: ${form.businessName}`,
          message: `Biznes adı: ${form.businessName}\nVÖEN: ${form.voen}\nŞəhər: ${form.city}\nTelefon: ${form.phone}\nSayt: ${form.website || "—"}\nQeyd: ${form.description || "—"}`,
          phone: form.phone
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
        <h1 className="text-2xl font-bold text-white">Müraciətiniz qəbul edildi</h1>
        <p className="mt-3 text-white/50">
          Komandamız 1–2 iş günü ərzində əlaqə saxlayacaq. Təsdiqdən sonra mağaza planını aktivləşdirə bilərsiniz.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/me" className="btn-primary">Profil səhifəsinə qayıt</Link>
          <Link href="/pricing#parts-store" className="btn-secondary">Mağaza planları</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <nav className="mb-6 text-sm text-white/50">
        <Link href="/" className="hover:text-white">Ana səhifə</Link>
        <span className="mx-2">/</span>
        <Link href="/pricing#parts-store" className="hover:text-white">Mağaza planları</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Mağaza müraciəti</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Ehtiyat hissə mağazası</h1>
        <p className="mt-2 text-white/50">
          SKU kataloqu, toplu elan və mağaza analitikası üçün müraciət göndərin. Salon hesabından asılı deyil.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
        <strong>Qeyd:</strong> Avtomobil salonu açmaq istəyirsinizsə{" "}
        <Link href="/dealer/apply" className="font-medium text-[#0891B2] hover:underline">
          salon müraciəti
        </Link>{" "}
        formundan istifadə edin.
      </div>

      <form onSubmit={onSubmit} className="card p-8 space-y-5">
        <div>
          <label className="label">Mağaza / biznes adı <span className="text-red-400">*</span></label>
          <input
            className="input-field"
            value={form.businessName}
            onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
            placeholder="Mağaza adı, MMC adı və s."
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
            placeholder="Hansı hissə kateqoriyalarında satış edirsiniz, təxmini SKU sayı və s."
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <button disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? "Göndərilir..." : "Müraciəti göndər"}
        </button>
      </form>
    </div>
  );
}
