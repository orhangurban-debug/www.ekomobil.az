"use client";

import { useState, useRef } from "react";
import { BranchCitiesField } from "@/components/business/branch-cities-field";
import { mergeDescriptionWithBranches, parseBranchCitiesFromDescription } from "@/lib/branch-cities";

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

async function uploadImageFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/media/listing-images", { method: "POST", body: form });
  const data = await res.json() as { ok: boolean; file?: { url: string }; error?: string };
  if (!data.ok || !data.file?.url) throw new Error(data.error ?? "Yükləmə uğursuz oldu");
  return data.file.url;
}

function ImageUploadField({
  label,
  value,
  onChange,
  previewClass,
  icon
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  previewClass?: string;
  icon: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isValid = value.startsWith("https://");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadImageFile(file);
      onChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Xəta baş verdi");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-600">{label}</label>

      {/* Preview */}
      {isValid && (
        <div className={`relative overflow-hidden rounded-xl bg-slate-100 ${previewClass ?? "h-20 w-20"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className="h-full w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
            title="Sil"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload row */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-2.5 text-xs font-medium text-slate-600 transition hover:border-[#0057FF]/60 hover:bg-blue-50 hover:text-[#0057FF] disabled:opacity-50"
        >
          {uploading ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Yüklənir...
            </>
          ) : (
            <>
              {icon}
              Cihazdan seç
            </>
          )}
        </button>
      </div>

      {uploadError && (
        <p className="text-xs text-red-500">{uploadError}</p>
      )}
    </div>
  );
}

export function StoreProfileEditForm({ initialData, publicProfileUrl }: StoreProfileEditFormProps) {
  const initialCity = initialData.city ?? "";
  const [storeName, setStoreName] = useState(initialData.storeName ?? "");
  const [city, setCity] = useState(initialCity);
  const [storeLogoUrl, setStoreLogoUrl] = useState(initialData.storeLogoUrl ?? "");
  const [storeCoverUrl, setStoreCoverUrl] = useState(initialData.storeCoverUrl ?? "");
  const [storeDescription, setStoreDescription] = useState(
    (initialData.storeDescription ?? "").replace(/\n\nFiliallar: [^\n]+$/, "").trim()
  );
  const [branchCities, setBranchCities] = useState(
    parseBranchCitiesFromDescription(initialData.storeDescription, initialCity)
  );
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
          storeDescription: mergeDescriptionWithBranches(storeDescription, branchCities, city) || undefined
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

  const logoPreview = storeLogoUrl.startsWith("https://") ? storeLogoUrl : null;

  return (
    <div className="space-y-4">
      {/* Logo preview + name/city */}
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

      {city && (
        <BranchCitiesField
          primaryCity={city}
          value={branchCities}
          onChange={setBranchCities}
        />
      )}

      {/* Image uploads */}
      <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Şəkillər</p>

        <ImageUploadField
          label="Mağaza loqosu"
          value={storeLogoUrl}
          onChange={setStoreLogoUrl}
          previewClass="h-16 w-16"
          icon={
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          }
        />

        <ImageUploadField
          label="Arxa plan (cover) şəkli"
          value={storeCoverUrl}
          onChange={setStoreCoverUrl}
          previewClass="h-24 w-full"
          icon={
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          }
        />
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
