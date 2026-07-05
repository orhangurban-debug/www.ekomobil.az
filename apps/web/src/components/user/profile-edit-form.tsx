"use client";

import { useState, useRef } from "react";

async function uploadImageFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/media/listing-images", { method: "POST", body: form });
  const data = await res.json() as { ok: boolean; file?: { url: string }; error?: string };
  if (!data.ok || !data.file?.url) throw new Error(data.error ?? "Yükləmə uğursuz oldu");
  return data.file.url;
}

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

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try { setAvatarUrl(await uploadImageFile(file)); } catch { setError("Şəkil yüklənmədi."); }
    setAvatarUploading(false);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }
  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try { setStoreLogoUrl(await uploadImageFile(file)); } catch { setError("Şəkil yüklənmədi."); }
    setLogoUploading(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }
  async function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try { setStoreCoverUrl(await uploadImageFile(file)); } catch { setError("Şəkil yüklənmədi."); }
    setCoverUploading(false);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

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
    const initials = (fullName || "EK").split(" ").map((w: string) => w[0] ?? "").slice(0, 2).join("").toUpperCase() || "EK";
    return (
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {avatarPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarPreview}
            alt={fullName || "Profil"}
            className="h-11 w-11 shrink-0 rounded-xl object-cover ring-2 ring-slate-100"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0057FF] to-[#0040CC] text-sm font-bold text-white">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{fullName || "Ad qeyd olunmayıb"}</p>
          <p className="truncate text-xs text-slate-400">{city || "Şəhər qeyd olunmayıb"}</p>
          {initialData.bio && (
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-400 italic">{initialData.bio}</p>
          )}
        </div>

        <button
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-lg border border-[#0057FF]/20 bg-[#0057FF]/5 px-3 py-1.5 text-xs font-semibold text-[#0057FF] transition hover:bg-[#0057FF]/10"
        >
          Redaktə et
        </button>
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

      {/* Avatar upload */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-600">Profil şəkili</label>
        <div className="flex items-center gap-3">
          {avatarUrl.startsWith("https://") ? (
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="Avatar" className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display="none"; }} />
              <button type="button" onClick={() => setAvatarUrl("")} className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px]" title="Sil">×</button>
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0057FF] to-[#0040CC] text-sm font-bold text-white">
              {(fullName || "EK").split(" ").map((w: string) => w[0] ?? "").slice(0, 2).join("").toUpperCase() || "EK"}
            </div>
          )}
          <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarFile} />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-600 transition hover:border-[#0057FF]/60 hover:bg-blue-50 hover:text-[#0057FF] disabled:opacity-50"
          >
            {avatarUploading ? "Yüklənir..." : "Cihazdan seç"}
          </button>
        </div>
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
              <label className="mb-1 block text-xs font-medium text-slate-600">Mağaza loqosu</label>
              <div className="flex items-center gap-2">
                {storeLogoUrl.startsWith("https://") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={storeLogoUrl} alt="Logo" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display="none"; }} />
                )}
                <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoFile} />
                <button type="button" onClick={() => logoInputRef.current?.click()} disabled={logoUploading}
                  className="flex-1 rounded-lg border border-dashed border-slate-300 bg-white py-2 text-xs text-slate-600 transition hover:border-[#0057FF]/60 hover:text-[#0057FF] disabled:opacity-50">
                  {logoUploading ? "Yüklənir..." : "Şəkil seç"}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Arxa plan (cover)</label>
              <div className="flex items-center gap-2">
                {storeCoverUrl.startsWith("https://") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={storeCoverUrl} alt="Cover" className="h-10 w-14 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display="none"; }} />
                )}
                <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverFile} />
                <button type="button" onClick={() => coverInputRef.current?.click()} disabled={coverUploading}
                  className="flex-1 rounded-lg border border-dashed border-slate-300 bg-white py-2 text-xs text-slate-600 transition hover:border-[#0057FF]/60 hover:text-[#0057FF] disabled:opacity-50">
                  {coverUploading ? "Yüklənir..." : "Şəkil seç"}
                </button>
              </div>
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
