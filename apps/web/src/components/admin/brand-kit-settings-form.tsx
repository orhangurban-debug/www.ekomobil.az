"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { BrandImageAsset, BrandSettings } from "@/lib/brand-settings";

interface Props {
  initial: BrandSettings;
}

export function BrandKitSettingsForm({ initial }: Props) {
  const [form, setForm] = useState<BrandSettings>(initial);
  const [busy, setBusy] = useState(false);

  const galleryPreview = useMemo(
    () => form.gallery.filter((item) => item.url.trim().length > 0),
    [form.gallery]
  );

  function updateField<K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateAsset(index: number, patch: Partial<BrandImageAsset>) {
    setForm((prev) => ({
      ...prev,
      gallery: prev.gallery.map((asset, i) => (i === index ? { ...asset, ...patch } : asset))
    }));
  }

  function addAsset() {
    const next: BrandImageAsset = {
      id: `asset-${Date.now()}`,
      label: "Yeni asset",
      url: "",
      kind: "other"
    };
    setForm((prev) => ({ ...prev, gallery: [...prev.gallery, next] }));
  }

  function removeAsset(index: number) {
    setForm((prev) => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
  }

  async function save() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/brand-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; settings?: BrandSettings };
      if (!response.ok || !payload.ok || !payload.settings) {
        alert(payload.error ?? "Brend ayarları saxlanmadı.");
        return;
      }
      setForm(payload.settings);
      alert("Brend ayarları yadda saxlanıldı. Saytda avtomatik yenilənəcək.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">Brend ayarlarını redaktə et</h3>
        <p className="mt-1 text-sm text-slate-500">
          Loqo URL-lərini, rəng kodlarını və əlavə vizualları burada dəyişin.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Əsas loqo URL</span>
            <input className="input-field" value={form.logoUrl} onChange={(e) => updateField("logoUrl", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kvadrat loqo URL</span>
            <input className="input-field" value={form.logoSquareUrl} onChange={(e) => updateField("logoSquareUrl", e.target.value)} />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Favicon URL</span>
            <input className="input-field" value={form.faviconUrl} onChange={(e) => updateField("faviconUrl", e.target.value)} />
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Primary</span>
            <input className="input-field font-mono" value={form.primaryColor} onChange={(e) => updateField("primaryColor", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Primary Hover</span>
            <input className="input-field font-mono" value={form.primaryHoverColor} onChange={(e) => updateField("primaryHoverColor", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deep Base</span>
            <input className="input-field font-mono" value={form.deepBaseColor} onChange={(e) => updateField("deepBaseColor", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Soft Brown</span>
            <input className="input-field font-mono" value={form.softBrownColor} onChange={(e) => updateField("softBrownColor", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Soft Border</span>
            <input className="input-field font-mono" value={form.softBrownBorderColor} onChange={(e) => updateField("softBrownBorderColor", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Canvas</span>
            <input className="input-field font-mono" value={form.canvasColor} onChange={(e) => updateField("canvasColor", e.target.value)} />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Loqo və şəkil asset-ləri</h3>
          <button type="button" className="btn-secondary text-xs" onClick={addAsset}>
            + Yeni asset
          </button>
        </div>
        <div className="space-y-3">
          {form.gallery.map((asset, index) => (
            <div key={asset.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-12">
              <input
                className="input-field md:col-span-3"
                value={asset.label}
                onChange={(e) => updateAsset(index, { label: e.target.value })}
                placeholder="Asset adı"
              />
              <input
                className="input-field md:col-span-6"
                value={asset.url}
                onChange={(e) => updateAsset(index, { url: e.target.value })}
                placeholder="/brand/logo.png və ya https://..."
              />
              <select
                className="input-field md:col-span-2"
                value={asset.kind}
                onChange={(e) => updateAsset(index, { kind: e.target.value as BrandImageAsset["kind"] })}
              >
                <option value="logo">Loqo</option>
                <option value="banner">Banner</option>
                <option value="social">Social</option>
                <option value="other">Digər</option>
              </select>
              <button type="button" className="btn-secondary md:col-span-1 text-xs" onClick={() => removeAsset(index)}>
                Sil
              </button>
            </div>
          ))}
          {form.gallery.length === 0 && <p className="text-sm text-slate-500">Hələ asset əlavə edilməyib.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">Canlı preview</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border p-3" style={{ background: form.canvasColor }}>
            <div className="h-12 rounded-md" style={{ background: form.primaryColor }} />
            <p className="mt-2 text-xs text-slate-600">Primary</p>
          </div>
          <div className="rounded-xl border p-3" style={{ background: form.canvasColor }}>
            <div className="h-12 rounded-md" style={{ background: form.primaryHoverColor }} />
            <p className="mt-2 text-xs text-slate-600">Primary hover</p>
          </div>
          <div className="rounded-xl border p-3" style={{ background: form.canvasColor }}>
            <div className="h-12 rounded-md" style={{ background: form.deepBaseColor }} />
            <p className="mt-2 text-xs text-slate-600">Deep base</p>
          </div>
          <div className="rounded-xl border p-3" style={{ background: form.softBrownColor }}>
            <div className="h-12 rounded-md border" style={{ borderColor: form.softBrownBorderColor, background: form.canvasColor }} />
            <p className="mt-2 text-xs text-slate-600">Soft brown səthi</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {galleryPreview.slice(0, 6).map((asset) => (
            <div key={asset.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <Image
                src={asset.url}
                alt={asset.label}
                width={640}
                height={240}
                loader={({ src }) => src}
                unoptimized
                className="h-20 w-full rounded-md object-contain bg-white"
              />
              <p className="mt-2 text-xs font-medium text-slate-700">{asset.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <button type="button" className="btn-primary" onClick={save} disabled={busy}>
          {busy ? "Saxlanılır..." : "Brend ayarlarını yadda saxla"}
        </button>
      </div>
    </div>
  );
}
