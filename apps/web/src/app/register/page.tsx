"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    city: "Bakı",
    phone: "",
    password: "",
    phoneOtpChallengeId: "",
    phoneOtpCode: ""
  });
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpHintCode, setOtpHintCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.phoneOtpChallengeId) {
      setError("Əvvəl telefon təsdiq kodunu göndərin.");
      return;
    }
    setLoading(true);
    setError(null);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = (await response.json()) as { ok: boolean; error?: string };
    if (!payload.ok) {
      setError(payload.error || "Qeydiyyat mümkün olmadı.");
      setLoading(false);
      return;
    }
    router.push("/me");
  }

  async function sendPhoneOtp() {
    if (!form.phone.trim()) {
      setError("Əvvəl telefon nömrəsini daxil edin.");
      return;
    }
    setSendingOtp(true);
    setError(null);
    const response = await fetch("/api/auth/phone/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone })
    });
    const payload = (await response.json()) as {
      ok: boolean;
      challengeId?: string;
      error?: string;
      code?: string;
    };
    if (!payload.ok || !payload.challengeId) {
      setError(payload.error || "Təsdiq kodu göndərilmədi.");
      setSendingOtp(false);
      return;
    }
    const challengeId = payload.challengeId;
    setForm((prev) => ({ ...prev, phoneOtpChallengeId: challengeId }));
    setOtpHintCode(payload.code ?? null);
    setOtpSent(true);
    setSendingOtp(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Qeydiyyat</h1>
        <p className="mt-2 text-slate-500">Favorilər, axtarışlar və elan idarəetməsi üçün hesab yaradın</p>
      </div>

      <form onSubmit={onSubmit} className="card p-8 space-y-5">
        <Link
          href="/api/auth/google/start?next=%2Fme"
          prefetch={false}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.5 3.6-5.5 3.6-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 4 1.5l2.7-2.6C17 2.6 14.7 1.7 12 1.7 6.9 1.7 2.8 6 2.8 11.3S6.9 20.9 12 20.9c6.9 0 9.2-4.9 9.2-7.5 0-.5 0-.9-.1-1.3H12z" />
          </svg>
          Google ilə qeydiyyat / giriş
        </Link>
        <div className="text-center text-xs text-slate-400">və ya aşağıdakı formu doldurun</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Ad və soyad</label>
            <input className="input-field" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Şəhər</label>
            <select className="input-field" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}>
              {["Bakı", "Sumqayıt", "Gəncə", "Lənkəran", "Digər"].map((city) => <option key={city}>{city}</option>)}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+994..." required />
            <button
              type="button"
              onClick={() => void sendPhoneOtp()}
              disabled={sendingOtp}
              className="btn-secondary mt-2 text-xs"
            >
              {sendingOtp ? "Kod göndərilir..." : otpSent ? "Kodu yenidən göndər" : "Telefonu təsdiqlə"}
            </button>
          </div>
        </div>
        <div>
          <label className="label">Telefon OTP kodu</label>
          <input
            className="input-field"
            value={form.phoneOtpCode}
            onChange={(e) => setForm((p) => ({ ...p, phoneOtpCode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
            placeholder="6 rəqəmli kod"
            maxLength={6}
            required
          />
          {otpHintCode && (
            <p className="mt-1 text-xs text-slate-500">Dev kodu: <span className="font-mono">{otpHintCode}</span></p>
          )}
        </div>
        <div>
          <label className="label">Şifrə</label>
          <input type="password" className="input-field" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} minLength={8} required />
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <button disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? "Hesab yaradılır..." : "Hesab yarat"}
        </button>
      </form>
    </div>
  );
}
