"use client";

import { useState } from "react";

export function PhoneSetupForm({ initialPhone }: { initialPhone?: string }) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [editing, setEditing] = useState(!initialPhone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPhone, setSavedPhone] = useState(initialPhone ?? "");

  async function savePhone() {
    if (!phone.trim()) {
      setError("Telefon nömrəsini daxil edin.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/me/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const payload = (await response.json()) as { ok: boolean; phone?: string; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Telefon saxlanılmadı.");
        return;
      }
      setSavedPhone(payload.phone ?? phone);
      setEditing(false);
      window.location.reload();
    } catch {
      setError("Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setSaving(false);
    }
  }

  if (savedPhone && !editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
          <span className="text-slate-800">{savedPhone}</span>
          <button
            type="button"
            onClick={() => {
              setPhone(savedPhone);
              setEditing(true);
              setError(null);
            }}
            className="text-xs font-semibold text-[#0057FF] hover:underline"
          >
            Dəyiş
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">Telefon nömrəsi</p>
        <p className="mt-0.5 text-xs text-slate-500">Əlaqə üçün nömrənizi daxil edin — etibar xalınız artır.</p>
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
          onClick={() => void savePhone()}
          disabled={saving}
          className="shrink-0 rounded-xl bg-[#0057FF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#004ADF] disabled:opacity-60"
        >
          {saving ? "Saxlanılır..." : "Saxla"}
        </button>
      </div>

      {savedPhone && editing && (
        <button
          type="button"
          onClick={() => {
            setPhone(savedPhone);
            setEditing(false);
            setError(null);
          }}
          className="text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          İmtina
        </button>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
