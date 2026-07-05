"use client";

import { useState } from "react";
import Image from "next/image";

interface ProfileEditFormProps {
  initialData: {
    fullName?: string;
    city?: string;
    bio?: string;
    avatarUrl?: string;
    storeName?: string;
    storeLogoUrl?: string;
    storeCoverUrl?: string;
    storeDescription?: string;
  };
  userId: string;
  isStore?: boolean;
  publicProfileUrl: string;
}

export function ProfileEditForm({ initialData, isStore, publicProfileUrl }: ProfileEditFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(initialData.fullName ?? "");
  const [city, setCity] = useState(initialData.city ?? "");
  const [bio, setBio] = useState(initialData.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl ?? "");
  const [storeName, setStoreName] = useState(initialData.storeName ?? "");
  const [storeLogoUrl, setStoreLogoUrl] = useState(initialData.storeLogoUrl ?? "");
  const [storeCoverUrl, setStoreCoverUrl] = useState(initialData.storeCoverUrl ?? "");
  const [storeDescription, setStoreDescription] = useState(initialData.storeDescription ?? "");

  const avatarPreview = isStore ? (storeLogoUrl || avatarUrl) : avatarUrl;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName || undefined,
          city: city || undefined,
          bio: bio || undefined,
          avatarUrl: avatarUrl || "",
          storeName: storeName || undefined,
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
        setTimeout(() => {
          setSaved(false);
          setOpen(false);
          window.location.reload();
        }, 1000);
      }
    } catch {
      setError("Şəbəkə xətası. Yenidən cəhd edin.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        {/* Avatar preview */}
        {avatarPreview ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-2 ring-slate-900/10">
            <Image src={avatarPreview} alt="Profil" fill className="object-cover" sizes="40px" />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0057FF] to-[#0046CC] text-sm font-bold text-white">
            {(fullName || "EK").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "EK"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">{fullName || "Ad qeyd olunmayıb"}</p>
          <p className="text-xs text-slate-400">{city || "Şəhər qeyd olunmayıb"}</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={publicProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-slate-900/10 bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            İctimai profil →
          </a>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-lg border border-[#0057FF]/20 bg-[#0057FF]/5 px-3 py-1.5 text-xs font-medium text-[#0057FF] transition hover:bg-[#0057FF]/10"
          >
            Redaktə et
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Profili redaktə et</h3>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Fields */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Ad Soyad</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            maxLength={80}
            placeholder="Adınızı daxil edin"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Şəhər</label>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            maxLength={60}
            placeholder="Bakı, Gəncə, ..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]/30"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Haqqımda <span className="text-slate-400">({bio.length}/300)</span></label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={300}
          rows={2}
          placeholder="Özünüz haqqında qısa məlumat..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]/30 resize-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Profil şəkili URL <span className="text-slate-400">(HTTPS)</span></label>
        <input
          type="url"
          value={avatarUrl}
          onChange={e => setAvatarUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]/30"
        />
      </div>

      {/* Store-specific fields */}
      {isStore && (
        <div className="space-y-3 rounded-xl border border-violet-200/60 bg-violet-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Mağaza məlumatları</p>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Mağaza adı</label>
            <input
              type="text"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              maxLength={80}
              placeholder="Mağazanın adı"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]/30"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Loqo URL</label>
              <input
                type="url"
                value={storeLogoUrl}
                onChange={e => setStoreLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Arxa plan şəkili URL</label>
              <input
                type="url"
                value={storeCoverUrl}
                onChange={e => setStoreCoverUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]/30"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Mağaza haqqında <span className="text-slate-400">({storeDescription.length}/500)</span></label>
            <textarea
              value={storeDescription}
              onChange={e => setStoreDescription(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Mağazanız haqqında qısa məlumat..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]/30 resize-none"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <a
          href={publicProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#0057FF] hover:underline"
        >
          İctimai profili görmək üçün →
        </a>
        <div className="flex gap-2">
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            İmtina
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="rounded-xl bg-[#0057FF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#004ADF] disabled:opacity-60"
          >
            {saved ? "✓ Saxlanıldı" : saving ? "Saxlanılır..." : "Saxla"}
          </button>
        </div>
      </div>
    </div>
  );
}
