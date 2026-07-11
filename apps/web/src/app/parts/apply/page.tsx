"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { AZERBAIJAN_CITIES } from "@/lib/car-data";
import { formatBranchCitiesForMessage } from "@/lib/branch-cities";
import { BranchCitiesField } from "@/components/business/branch-cities-field";

async function uploadLogoFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/media/listing-images", { method: "POST", body: form });
  const data = (await res.json()) as { ok: boolean; file?: { url: string }; error?: string };
  if (!data.ok || !data.file?.url) throw new Error(data.error ?? "Logo yüklənmədi");
  return data.file.url;
}

export default function PartsApplyPage() {
  const [form, setForm] = useState({
    businessName: "",
    voen: "",
    city: "Bakı",
    phone: "",
    website: "",
    description: ""
  });
  const [branchCities, setBranchCities] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogoSelected(file: File | undefined) {
    if (!file) return;
    setLogoUploading(true);
    setError(null);
    try {
      const url = await uploadLogoFile(file);
      setLogoUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logo yüklənmədi");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/support/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "parts_apply",
          subject: `Mağaza müraciəti: ${form.businessName}`,
          message: [
            `Biznes adı: ${form.businessName}`,
            `VÖEN: ${form.voen || "—"}`,
            `Əsas şəhər: ${form.city}`,
            `Filiallar: ${formatBranchCitiesForMessage(branchCities, form.city)}`,
            `Telefon: ${form.phone}`,
            `Sayt: ${form.website || "—"}`,
            `Logo: ${logoUrl || "—"}`,
            `Qeyd: ${form.description || "—"}`
          ].join("\n"),
          phone: form.phone,
          dealerApplication: {
            businessType: "parts_store",
            businessName: form.businessName,
            voen: form.voen || null,
            city: form.city,
            phone: form.phone,
            website: form.website || null,
            description: form.description || null,
            logoUrl: logoUrl || null,
            branchCities
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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
            <span className="text-3xl">⏳</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Müraciətiniz qəbul edildi</h1>
        <p className="mt-3 text-slate-500">
          Mağaza profiliniz <strong>gözləmə rejimindədir</strong>. Komandamız 1–2 iş günü ərzində yoxlayıb təsdiqləyəcək.
        </p>
        <div className="mx-auto mt-5 max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Təsdiqdən sonra mağaza paneliniz aktiv olacaq və <strong>ilk 30 gün pulsuz</strong> sınaq başlayacaq.
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/me" className="btn-primary">Profil səhifəsinə qayıt</Link>
          <Link href="/pricing#parts-store" className="btn-secondary">Mağaza planları</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Ana səhifə</Link>
        <span className="mx-2">/</span>
        <Link href="/pricing#parts-store" className="hover:text-slate-900">Mağaza planları</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Mağaza yarat</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Ehtiyat hissə mağazası</h1>
        <p className="mt-2 text-slate-500">
          SKU kataloqu, toplu elan və mağaza analitikası — admin təsdiqindən sonra aktiv olur.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        İlkin qeydiyyat admin yoxlamasından keçir. Təsdiq olunana qədər mağaza paneli aktiv olmur.
      </div>

      <div className="mb-6 rounded-xl border border-slate-900/10 bg-white/60 px-4 py-3 text-sm text-slate-700">
        <strong>Qeyd:</strong> Avtomobil salonu açmaq istəyirsinizsə{" "}
        <Link href="/dealer/apply" className="font-medium text-[#0057FF] hover:underline">
          salon yarat
        </Link>{" "}
        səhifəsindən istifadə edin.
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

        <div>
          <label className="label">Mağaza loqosu</label>
          <div className="flex items-center gap-4">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-xl border object-cover" />
            )}
            <div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="input-field"
                onChange={(e) => onLogoSelected(e.target.files?.[0])}
              />
              <p className="mt-1 text-xs text-slate-500">
                {logoUploading ? "Yüklənir..." : "PNG, JPG və ya WEBP — admin təsdiqi ilə profilə köçürülür"}
              </p>
            </div>
          </div>
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
            <label className="label">Əsas şəhər <span className="text-red-400">*</span></label>
            <select
              className="input-field"
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            >
              {AZERBAIJAN_CITIES.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        <BranchCitiesField
          primaryCity={form.city}
          value={branchCities}
          onChange={setBranchCities}
        />

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
          <div className="rounded-xl alert-danger border px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <button disabled={loading || logoUploading} className="btn-primary w-full justify-center py-3">
          {loading ? "Göndərilir..." : "Müraciət göndər"}
        </button>
      </form>
    </div>
  );
}
