"use client";

import { useState } from "react";

interface StoreProfileEditFormProps {
  initialData: {
    storeName?: string;
    storeLogoUrl?: string;
    storeCoverUrl?: string;
    storeDescription?: string;
    city?: string;
  };
  publicProfileUrl: string;
}

function isValidHttpsUrl(val: string): boolean {
  try {
    return new URL(val).protocol === "https:";
  } catch {
    return false;
  }
}

export function StoreProfileEditForm({ initialData, publicProfileUrl }: StoreProfileEditFormProps) {
  const [storeName, setStoreName] = useState(initialData.storeName ?? "");
  const [city, setCity] = useState(initialData.city ?? "");
  const [storeLogoUrl, setStoreLogoUrl] = useState(initialData.storeLogoUrl ?? "");
  const [storeCoverUrl, setStoreCoverUrl] = useState(initialData.storeCoverUrl ?? "");
  const [storeDescription, setStoreDescription] = useState(initialData.storeDescription ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: storeName || undefined,
          city: city || undefined,
          storeLogoUrl: storeLogoUrl || "",
          storeCoverUrl: storeCoverUrl || "",
          storeDescription: storeDescription || undefined
        })
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Xəta baş verdi.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      setError("Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setSaving(false);
    }
  }

  const logoPreview = storeLogoUrl && isValidHttpsUrl(storeLogoUrl) ? storeLogoUrl : null;

  return (
    <div className="space-y-4">
      {/* Logo preview + name */}
      <div className="flex items-center gap-3">
        {logoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoPreview} alt="Loqo" className="h-14 w-14 rounded-xl object-cover ring-2 ring-slate-100 shrink-0" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 text-xl font-bold text-white">
            {(storeName || "M").slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={storeName}
            onChange={e => setStoreName(e.target.value)}
            maxLength={80}
            placeholder="Mağaza adı"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-[#0057FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0057FF]/20"
          />
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            maxLength={60}
            placeholder="Şəhər"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 placeholder-slate-400 focus:border-[#0057FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0057FF]/20"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Mağaza haqqında <span className="text-slate-400">({storeDescription.length}/500)</span>
        </label>
        <textarea
          value={storeDescription}
          onChange={e => setStoreDescription(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Mağazanız haqqında qısa məlumat, ixtisas sahəniz, maraqlar..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0057FF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0057FF]/20"
        />
      </div>

      {/* Image URLs */}
      <div className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Şəkillər (HTTPS URL)</p>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Loqo URL</label>
          <input
            type="url"
            value={storeLogoUrl}
            onChange={e => setStoreLogoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-[#0057FF] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Arxa plan (cover) URL</label>
          <input
            type="url"
            value={storeCoverUrl}
            onChange={e => setStoreCoverUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-[#0057FF] focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <a
          href={publicProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#0057FF] hover:underline"
        >
          İctimai profilə bax ↗
        </a>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="ml-auto rounded-xl bg-[#0057FF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#004ADF] disabled:opacity-60"
        >
          {saved ? "✓ Saxlanıldı" : saving ? "Saxlanılır..." : "Saxla"}
        </button>
      </div>
    </div>
  );
}
