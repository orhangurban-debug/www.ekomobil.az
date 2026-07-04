"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StoreSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  async function handleActivate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/business/store-setup", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; error?: string; trialEndsAt?: string };
      if (!data.ok) {
        setError(data.error ?? "Xəta baş verdi.");
        return;
      }
      setTrialEndsAt(data.trialEndsAt ?? null);
      setDone(true);
    } catch {
      setError("Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    const expiryLabel = trialEndsAt
      ? new Date(trialEndsAt).toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" })
      : null;

    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mb-5 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100">
            <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Mağazanız açıldı!</h1>
        <p className="mt-3 text-slate-500">
          30 günlük pulsuz sınaq başladı.
          {expiryLabel && (
            <> Sınaq müddəti: <strong className="text-slate-700">{expiryLabel}</strong> tarixinə qədər.</>
          )}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Müddət bitdikdən sonra Baza planı (19 ₼/ay) ödənişi tələb olunur.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => router.push("/parts/publish")}
            className="btn-primary w-full py-3"
          >
            İlk hissə elanını yerləşdir →
          </button>
          <Link href="/pricing#parts-store" className="btn-secondary w-full py-3 text-center">
            Planları gör
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Ana səhifə</Link>
        <span className="mx-2">/</span>
        <Link href="/parts" className="hover:text-slate-900">Mağaza elanları</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Mağaza aç</span>
      </nav>

      <div className="rounded-3xl border border-slate-900/10 bg-white/80 p-8 shadow-sm">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0057FF]/10 text-2xl">
            🏪
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Mağaza aç</h1>
          <p className="mt-2 text-slate-500">
            Hissə, aksesuar və avtomallar üçün mağaza profilinizi dərhal aktivləşdirin.
            Admin gözləmək lazım deyil.
          </p>
        </div>

        {/* Trial banner */}
        <div className="mb-8 rounded-2xl border border-emerald-500/25 bg-emerald-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-xl">🎁</span>
            <div>
              <p className="font-semibold text-emerald-800">İlk 30 gün tamamilə pulsuz</p>
              <p className="mt-0.5 text-sm text-emerald-700">
                Heç bir ödəniş məlumatı tələb edilmir. Sınaq müddəti bitdikdən sonra
                Baza planı (19 ₼/ay) ödənişinə keçilir.
              </p>
            </div>
          </div>
        </div>

        {/* What you get */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {[
            { icon: "📦", title: "50 aktiv SKU", desc: "Hissə, aksesuar, yağ və s." },
            { icon: "⚡", title: "Dərhal aktiv", desc: "Admin təsdiqsiz, elə indi başla" },
            { icon: "🏷️", title: "Mağaza etiketi", desc: "Elanlarınızda mağaza adı görünür" },
            { icon: "📊", title: "Toplu yükləmə", desc: "CSV ilə çoxlu elan əlavə et" }
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-xl border border-slate-900/8 p-4">
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider: private vs store */}
        <div className="mb-8 rounded-xl bg-slate-50 p-4 text-sm">
          <p className="font-medium text-slate-700">Mağaza vs Fərdi satıcı — fərq nədir?</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-800 mb-1">Fərdi satıcı</p>
              <ul className="space-y-1">
                <li>✓ Qeydiyyatsız başla</li>
                <li>✓ Tək-tək elan</li>
                <li>✗ Mağaza profili yoxdur</li>
                <li>✗ Toplu yükləmə yoxdur</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#0057FF] mb-1">Mağaza</p>
              <ul className="space-y-1">
                <li>✓ Brend profil səhifəsi</li>
                <li>✓ Toplu yükləmə (CSV)</li>
                <li>✓ Stok idarəetməsi</li>
                <li>✓ Analitika (Pro+)</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleActivate}
          disabled={loading}
          className="btn-primary w-full py-3.5 text-base font-semibold disabled:opacity-60"
        >
          {loading ? "Aktivləşdirilir..." : "Mağazamı pulsuz aç →"}
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          Aktivləşdirməklə{" "}
          <Link href="/terms" className="underline hover:text-slate-600">istifadə şərtlərini</Link>{" "}
          qəbul etmiş olursunuz.
        </p>
      </div>

      <div className="mt-6 text-center">
        <Link href="/parts/publish" className="text-sm text-slate-500 hover:text-slate-700">
          Mağaza olmadan fərdi elan yerləşdir →
        </Link>
      </div>
    </div>
  );
}
