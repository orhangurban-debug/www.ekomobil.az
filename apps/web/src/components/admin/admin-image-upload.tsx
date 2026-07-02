"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

interface Props {
  value: string;
  folder: "ad-creatives" | "home-content";
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
  /** Önizləmə hündürlüyü class-ı (məs. "h-24") */
  previewClass?: string;
}

export function AdminImageUpload({
  value,
  folder,
  onChange,
  disabled = false,
  label = "Şəkil",
  previewClass = "h-28"
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        setError(data.error ?? "Yükləmə uğursuz oldu.");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Şəbəkə xətası — yenidən cəhd edin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600"
          >
            <X className="h-3 w-3" /> Sil
          </button>
        )}
      </div>

      {value ? (
        <div className={`relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${previewClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Önizləmə" className="h-full w-full object-cover" />
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-[#0891B2]/50 hover:text-[#0891B2] disabled:opacity-60 ${previewClass}`}
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          <span className="text-xs font-medium">{busy ? "Yüklənir..." : "Şəkil yüklə"}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      {!disabled && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="və ya şəkil URL-i yapışdırın"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
        />
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
