"use client";

import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const oauthError = searchParams.get("error");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onGoogleClick() {
    setGoogleLoading(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const payload = (await response.json()) as { ok: boolean; error?: string };
    if (!payload.ok) {
      setError(payload.error || "Giriş uğursuz oldu.");
      setLoading(false);
      return;
    }

    router.push(nextPath);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0891B2] shadow-sm">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h1l1-4h12l1 4h1a1 1 0 010 2h-.5M3 10a1 1 0 000 2h.5M6 14a2 2 0 104 0m4 0a2 2 0 104 0" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-slate-900">
              <span className="text-[#3E2F28]">Eko</span><span className="text-[#0891B2]">Mobil</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Hesabınıza daxil olun</h1>
          <p className="mt-2 text-sm text-slate-500">Platforma idarəetmə üçün giriş edin</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <Link
            href={`/api/auth/google/start?next=${encodeURIComponent(nextPath)}`}
            prefetch={false}
            onClick={onGoogleClick}
            aria-disabled={googleLoading}
            className={`mb-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 ${
              googleLoading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.5 3.6-5.5 3.6-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 4 1.5l2.7-2.6C17 2.6 14.7 1.7 12 1.7 6.9 1.7 2.8 6 2.8 11.3S6.9 20.9 12 20.9c6.9 0 9.2-4.9 9.2-7.5 0-.5 0-.9-.1-1.3H12z" />
            </svg>
            {googleLoading ? "Google-a yönləndirilir..." : "Google ilə daxil ol"}
          </Link>
          <div className="mb-5 text-center text-xs text-slate-400">və ya email ilə giriş et</div>
          {oauthError === "rate_limited_google" && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Google giriş üçün çox tez-tez sorğu göndərildi. 1 dəqiqə sonra yenidən cəhd edin.
            </div>
          )}
          {oauthError === "google_not_configured" && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Google giriş hazırda aktiv deyil. Zəhmət olmasa email/şifrə ilə daxil olun.
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="label">Email ünvanı</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@ekomobil.az"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Şifrə</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Giriş edilir...
                </>
              ) : "Daxil ol"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} EkoMobil — ekomobil.az
        </p>
        <p className="mt-3 text-center text-sm text-slate-500">
          Hesabın yoxdur? <Link href="/register" className="font-medium text-brand-700">Qeydiyyat</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
