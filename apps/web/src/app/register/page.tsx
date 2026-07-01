"use client";

import { FormEvent, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CONTACT_INTENTS } from "@/lib/support-contact";

type AccountIntent = "personal" | "business" | "service";
type BusinessVertical = "salon" | "magaza" | "both";

const ACCOUNT_INTENTS: { id: AccountIntent; icon: string; label: string; sub: string }[] = [
  {
    id: "personal",
    icon: "👤",
    label: "Fərdi istifadəçi",
    sub: "Alıcı, şəxsi satıcı, auksion iştirakçısı"
  },
  {
    id: "business",
    icon: "🏢",
    label: "Biznes satıcı",
    sub: "Avtomobil salonu və/və ya ehtiyat hissə mağazası"
  },
  {
    id: "service",
    icon: "🔧",
    label: "Servis / Usta",
    sub: "Mexanik, ekspertiza şirkəti, rəsmi servis"
  }
];

const INTENT_INFO: Record<AccountIntent, { title: string; body: string; cta?: string; href?: string }> = {
  personal: {
    title: "Fərdi hesab",
    body: "Standart hesabla elan yerləşdirə, auksionlarda iştirak edə, favorilər saxlaya bilərsiniz. Gələcəkdə salon hesabına keçid mümkündür."
  },
  business: {
    title: "Biznes satıcı hesabı",
    body: "Eyni hesabla salon və mağaza ayrıca aktivləşir. Qeydiyyatdan sonra uyğun müraciət göndərin və biznes planını seçin."
  },
  service: {
    title: "Servis / Usta profili",
    body: "Hesab yaradın, sonra servis profili üçün müraciət edin. Fərdi hesabla eyni zamanda elan yerləşdirə bilərsiniz — iki funksiya bir hesabda birləşir.",
    cta: CONTACT_INTENTS.service.label,
    href: CONTACT_INTENTS.service.href
  }
};

export default function RegisterPage() {
  const router = useRouter();
  const [intent, setIntent] = useState<AccountIntent>("personal");
  const [businessVertical, setBusinessVertical] = useState<BusinessVertical>("salon");
  const [googleLoading, setGoogleLoading] = useState(false);
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
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const consentComplete = acceptTerms && acceptPrivacy;

  function onGoogleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!consentComplete) {
      event.preventDefault();
      setError("Google ilə davam etmək üçün razılaşmaları qəbul edin.");
      return;
    }
    setGoogleLoading(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.phoneOtpChallengeId) {
      setError("Əvvəl telefon təsdiq kodunu göndərin.");
      return;
    }
    if (!consentComplete) {
      setError("Hesab yaratmaq üçün razılaşmaları qəbul edin.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          acceptTerms: true as const,
          acceptPrivacy: true as const
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error || "Qeydiyyat mümkün olmadı.");
        setLoading(false);
        return;
      }
      // Redirect based on intent so post-register guidance is shown
      if (intent === "business") {
        if (businessVertical === "salon") router.push("/me?welcome=salon");
        else if (businessVertical === "magaza") router.push("/me?welcome=magaza");
        else router.push("/me?welcome=business");
      } else if (intent === "service") {
        router.push("/me?welcome=service");
      } else {
        router.push("/me");
      }
    } catch (err) {
      console.error("register error:", err);
      setError("Şəbəkə xətası baş verdi. Yenidən cəhd edin.");
      setLoading(false);
    }
  }

  async function sendPhoneOtp() {
    if (!form.phone.trim()) {
      setError("Əvvəl telefon nömrəsini daxil edin.");
      return;
    }
    setSendingOtp(true);
    setError(null);
    try {
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
        return;
      }
      setForm((prev) => ({ ...prev, phoneOtpChallengeId: payload.challengeId! }));
      setOtpHintCode(payload.code ?? null);
      setOtpSent(true);
    } catch (err) {
      console.error("send otp error:", err);
      setError("Şəbəkə xətası baş verdi. Yenidən cəhd edin.");
    } finally {
      setSendingOtp(false);
    }
  }

  const info = INTENT_INFO[intent];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Hesab yaradın</h1>
        <p className="mt-2 text-slate-500">EkoMobil-ə qoşulun — bütün hesab növləri eyni formadan başlayır</p>
      </div>

      {/* Account intent selector */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {ACCOUNT_INTENTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIntent(item.id)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 text-center transition ${
              intent === item.id
                ? "border-[#0891B2] bg-[#0891B2]/5"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className={`text-sm font-semibold ${intent === item.id ? "text-[#0891B2]" : "text-slate-800"}`}>
              {item.label}
            </span>
            <span className="text-[11px] leading-tight text-slate-400">{item.sub}</span>
          </button>
        ))}
      </div>

      {intent === "business" && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {([
            { id: "salon" as const, label: "Avtomobil salonu", sub: "Avto inventar, salon paneli" },
            { id: "magaza" as const, label: "Ehtiyat hissə mağazası", sub: "SKU kataloqu, toplu elan" },
            { id: "both" as const, label: "Hər ikisi", sub: "Eyni hesab, ayrı planlar" }
          ]).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setBusinessVertical(item.id)}
              className={`rounded-xl border-2 p-3 text-left transition ${
                businessVertical === item.id
                  ? "border-[#0891B2] bg-[#0891B2]/5"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className={`text-sm font-semibold ${businessVertical === item.id ? "text-[#0891B2]" : "text-slate-800"}`}>
                {item.label}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">{item.sub}</p>
            </button>
          ))}
        </div>
      )}

      {/* Intent-specific info */}
      {intent !== "personal" && (
        <div className="mb-6 rounded-xl border border-[#0891B2]/30 bg-[#0891B2]/5 px-4 py-4 text-sm">
          <p className="font-semibold text-[#0891B2]">{info.title}</p>
          <p className="mt-1 text-slate-600 leading-relaxed">{info.body}</p>
          {info.cta && info.href && (
            <a
              href={info.href}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#0891B2] hover:underline"
            >
              {info.cta} →
            </a>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="card p-8 space-y-5">
        <Link
          href="/api/auth/google/start?next=%2Fme"
          prefetch={false}
          onClick={onGoogleClick}
          aria-disabled={googleLoading}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 ${
            googleLoading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.5 3.6-5.5 3.6-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 4 1.5l2.7-2.6C17 2.6 14.7 1.7 12 1.7 6.9 1.7 2.8 6 2.8 11.3S6.9 20.9 12 20.9c6.9 0 9.2-4.9 9.2-7.5 0-.5 0-.9-.1-1.3H12z" />
          </svg>
          {googleLoading ? "Google-a yönləndirilir..." : "Google ilə qeydiyyat"}
        </Link>
        <div className="text-center text-xs text-slate-400">və ya aşağıdakı formu doldurun</div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Ad və soyad</label>
            <input
              className="input-field"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Şəhər</label>
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
            <label className="label">Email</label>
            <input
              type="email"
              className="input-field"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input
              className="input-field"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+994..."
              required
            />
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
          <label className="label">Telefon təsdiq kodu</label>
          <input
            className="input-field"
            value={form.phoneOtpCode}
            onChange={(e) =>
              setForm((p) => ({ ...p, phoneOtpCode: e.target.value.replace(/\D/g, "").slice(0, 6) }))
            }
            placeholder="6 rəqəmli kod"
            maxLength={6}
            required
          />
          {otpHintCode && (
            <p className="mt-1 text-xs text-slate-500">
              Test kodu: <span className="font-mono">{otpHintCode}</span>
            </p>
          )}
        </div>

        <div>
          <label className="label">Şifrə</label>
          <input
            type="password"
            className="input-field"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            minLength={8}
            required
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span>
              <Link href="/terms" className="font-medium text-[#0891B2] hover:underline" target="_blank">
                İstifadəçi Razılaşmasını
              </Link>{" "}
              oxudum və qəbul edirəm.
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span>
              <Link href="/privacy" className="font-medium text-[#0891B2] hover:underline" target="_blank">
                Məxfilik Siyasətini
              </Link>{" "}
              oxudum və qəbul edirəm.
            </span>
          </label>
          <p className="text-xs text-slate-500">
            Qeydiyyat məlumatlarınız fırıldaqçılıq hallarının araşdırılması və qanuni tələblər çərçivəsində
            saxlanıla bilər.{" "}
            <Link href="/legal" className="text-[#0891B2] hover:underline">
              Ətraflı
            </Link>
          </p>
        </div>

        <button disabled={loading || !consentComplete} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
          {loading ? "Hesab yaradılır..." : "Hesab yarat"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Artıq hesabınız var?{" "}
        <Link href="/login" className="font-medium text-[#0891B2] hover:underline">
          Daxil olun
        </Link>
      </p>
    </div>
  );
}
