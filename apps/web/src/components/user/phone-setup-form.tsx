"use client";

import { useState } from "react";

export function PhoneSetupForm({ initialPhone }: { initialPhone?: string }) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [challengeId, setChallengeId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpHintCode, setOtpHintCode] = useState<string | null>(null);
  const [deliveryHint, setDeliveryHint] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPhone, setSavedPhone] = useState(initialPhone ?? "");

  async function sendOtp() {
    if (!phone.trim()) {
      setError("Telefon nömrəsini daxil edin.");
      return;
    }
    setSendingOtp(true);
    setError(null);
    try {
      const response = await fetch("/api/me/phone/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const payload = (await response.json()) as {
        ok: boolean;
        challengeId?: string;
        error?: string;
        code?: string;
        deliveryChannel?: "sms" | "email";
        deliveryDestination?: string;
      };
      if (!response.ok || !payload.ok || !payload.challengeId) {
        setError(payload.error ?? "Təsdiq kodu göndərilmədi.");
        return;
      }
      setChallengeId(payload.challengeId);
      setOtpHintCode(payload.code ?? null);
      setDeliveryHint(
        payload.deliveryChannel === "email"
          ? `Kod e-poçtunuza göndərildi (${payload.deliveryDestination ?? "təsdiqlənmiş email"}).`
          : payload.deliveryChannel === "sms"
          ? `Kod SMS ilə göndərildi (${payload.deliveryDestination ?? "telefon"}).`
          : null
      );
      setOtpSent(true);
    } catch {
      setError("Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyAndSave() {
    if (!challengeId) {
      setError("Əvvəl təsdiq kodu göndərin.");
      return;
    }
    if (!otpCode.trim()) {
      setError("Təsdiq kodunu daxil edin.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/me/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          phoneOtpChallengeId: challengeId,
          phoneOtpCode: otpCode
        })
      });
      const payload = (await response.json()) as { ok: boolean; phone?: string; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Telefon saxlanılmadı.");
        return;
      }
      setSavedPhone(payload.phone ?? phone);
      setOtpSent(false);
      setOtpCode("");
      setChallengeId("");
      window.location.reload();
    } catch {
      setError("Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setSaving(false);
    }
  }

  if (savedPhone) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
        <span className="text-emerald-800">{savedPhone}</span>
        <span className="text-xs font-semibold text-emerald-700">Təsdiqlənib</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">Telefon nömrəsi</p>
        <p className="mt-0.5 text-xs text-slate-500">SMS və ya e-poçt təsdiqi ilə əlavə edin — etibar xalınız artır.</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+994501234567"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]/30"
        />
        <button
          type="button"
          onClick={() => void sendOtp()}
          disabled={sendingOtp}
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
        >
          {sendingOtp ? "Göndərilir..." : otpSent ? "Yenidən göndər" : "Kod göndər"}
        </button>
      </div>

      {otpSent && (
        <div className="space-y-2">
          <input
            type="text"
            inputMode="numeric"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6 rəqəmli kod"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]/30"
          />
          {deliveryHint && (
            <p className="text-xs text-emerald-700">{deliveryHint}</p>
          )}
          {otpHintCode && (
            <p className="text-xs text-amber-700">Test kodu: {otpHintCode}</p>
          )}
          <button
            type="button"
            onClick={() => void verifyAndSave()}
            disabled={saving}
            className="rounded-xl bg-[#0057FF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#004ADF] disabled:opacity-60"
          >
            {saving ? "Yoxlanılır..." : "Təsdiqlə və saxla"}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
