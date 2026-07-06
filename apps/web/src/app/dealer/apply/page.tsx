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
          requestType: "dealer_apply",
          subject: `Salon müraciəti: ${form.businessName}`,
          message: `Biznes növü: Avtomobil salonu\nBiznes adı: ${form.businessName}\nVÖEN: ${form.voen || "—"}\nŞəhər: ${form.city}\nTelefon: ${form.phone}\nSayt: ${form.website || "—"}\nQeyd: ${form.description || "—"}`,
          phone: form.phone,
          dealerApplication: {
            businessType: "dealer",
            businessName: form.businessName,
            voen: form.voen || null,
            city: form.city,
            phone: form.phone,
            website: form.website || null,
            description: form.description || null
          }
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
        <h1 className="text-2xl font-bold text-slate-900">Salon hesabı yaradıldı!</h1>
        <p className="mt-3 text-slate-500">
          Komandamız 1–2 iş günü ərzində yoxlayıb salon panelinizi aktivləşdirəcək.
        </p>
        <div className="mx-auto mt-5 max-w-sm rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          Salon aktivləşdiriləndən sonra <strong>ilk 30 gün pulsuz</strong> sınaq müddəti verilir.
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/me" className="btn-primary">Profil səhifəsinə qayıt</Link>
          <Link href="/pricing#dealer" className="btn-secondary">Salon planları</Link>
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
        <span className="text-slate-900">Salon yarat</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Avtomobil salonu</h1>
        <p className="mt-2 text-slate-500">
          Məlumatları doldurun — qısa yoxlamadan sonra salon paneliniz aktivləşdiriləcək.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-emerald-800">İlk 30 gün pulsuz sınaq</p>
            <p className="mt-0.5 text-xs text-emerald-700">
              Salon aktivləşdiriləndən sonra ilk 30 gün pulsuz sınaq müddəti verilir.
              Sınaq bitdikdən sonra aylıq abunə ödənişinə keçilir.{" "}
              <Link href="/pricing#dealer" className="font-semibold underline">Qiymətlərə bax →</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-900/10 bg-white/60 px-4 py-3 text-sm text-slate-700">
        Ehtiyat hissə mağazası açmaq istəyirsinizsə{" "}
        <Link href="/parts/apply" className="font-medium text-[#0057FF] hover:underline">
          mağaza yarat
        </Link>{" "}
        səhifəsindən istifadə edin — salon hesabından asılı deyil.
      </div>

      <form onSubmit={onSubmit} className="card p-8 space-y-5">
        <div>
          <label className="label">Biznes / Salon adı <span className="text-red-400">*</span></label>
          <input
            className="input-field"
            value={form.businessName}
            onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
            placeholder="Məs: Orion Auto, Premium Cars..."
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">
              VÖEN
              <span className="ml-1.5 text-xs font-normal text-slate-400">(varsa)</span>
            </label>
            <input
              className="input-field"
              value={form.voen}
              onChange={(e) => setForm((p) => ({ ...p, voen: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
              placeholder="10 rəqəm — şirkətsiz satıcı üçün boş buraxın"
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
          <div className="rounded-xl alert-danger border px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <button disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? "Yaradılır..." : "Salonu yarat"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Suallarınız varsa{" "}
        <Link href="/trust#support-request" className="text-[#0057FF] hover:underline">
          dəstək sorğusu göndərin
        </Link>
      </p>
    </div>
  );
}
