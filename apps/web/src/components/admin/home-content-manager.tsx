"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type {
  HomeCategory,
  HomeCategoryIcon,
  HomeCategoryTone,
  HomeContentConfig,
  HomeSlide
} from "@/lib/home-content";
import { AdminReadOnlyBanner } from "@/components/admin/admin-read-only-banner";
import { AdminImageUpload } from "@/components/admin/admin-image-upload";

interface Props {
  initial: HomeContentConfig;
  readOnly?: boolean;
}

const ICON_OPTIONS: { value: HomeCategoryIcon; label: string }[] = [
  { value: "suv", label: "SUV" },
  { value: "electric", label: "Elektrik" },
  { value: "sedan", label: "Sedan" },
  { value: "budget", label: "Büdcə / qiymət" },
  { value: "vin", label: "VIN / qalxan" },
  { value: "auction", label: "Auksion" },
  { value: "parts", label: "Ehtiyat hissə" },
  { value: "truck", label: "Yük" },
  { value: "star", label: "Ulduz" }
];

const TONE_OPTIONS: HomeCategoryTone[] = ["sky", "emerald", "violet", "amber", "teal", "rose"];

function newSlide(index: number): HomeSlide {
  return {
    id: `slide-${Date.now()}-${index}`,
    badge: "",
    title: "Yeni başlıq",
    highlight: "",
    subtitle: "",
    imageUrl: "",
    ctaPrimaryLabel: "Ətraflı",
    ctaPrimaryHref: "/listings",
    ctaSecondaryLabel: "",
    ctaSecondaryHref: ""
  };
}

function newCategory(index: number): HomeCategory {
  return {
    id: `cat-${Date.now()}-${index}`,
    label: "Yeni kateqoriya",
    href: "/listings",
    icon: "star",
    tone: "sky"
  };
}

const inputCls = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50";

export function HomeContentManager({ initial, readOnly = false }: Props) {
  const [config, setConfig] = useState<HomeContentConfig>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [openSlide, setOpenSlide] = useState<string | null>(initial.slides[0]?.id ?? null);

  function updateSlide(id: string, patch: Partial<HomeSlide>) {
    setConfig((p) => ({ ...p, slides: p.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  }
  function removeSlide(id: string) {
    setConfig((p) => ({ ...p, slides: p.slides.filter((s) => s.id !== id) }));
  }
  function moveSlide(index: number, dir: -1 | 1) {
    setConfig((p) => {
      const slides = [...p.slides];
      const target = index + dir;
      if (target < 0 || target >= slides.length) return p;
      [slides[index], slides[target]] = [slides[target], slides[index]];
      return { ...p, slides };
    });
  }
  function addSlide() {
    setConfig((p) => {
      const s = newSlide(p.slides.length);
      setOpenSlide(s.id);
      return { ...p, slides: [...p.slides, s] };
    });
  }

  function updateCategory(id: string, patch: Partial<HomeCategory>) {
    setConfig((p) => ({ ...p, categories: p.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  }
  function removeCategory(id: string) {
    setConfig((p) => ({ ...p, categories: p.categories.filter((c) => c.id !== id) }));
  }
  function addCategory() {
    setConfig((p) => ({ ...p, categories: [...p.categories, newCategory(p.categories.length)] }));
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/home-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = (await res.json()) as { ok: boolean; config?: HomeContentConfig; error?: string };
      if (!res.ok || !data.ok || !data.config) {
        setMessage(data.error ?? "Saxlama uğursuz oldu.");
        return;
      }
      setConfig(data.config);
      setMessage("Ana səhifə məzmunu uğurla saxlanıldı.");
    } catch {
      setMessage("Şəbəkə xətası — yenidən cəhd edin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {readOnly && <AdminReadOnlyBanner />}

      {/* Hero slaydları */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Hero slaydları ({config.slides.length})
          </h3>
          {!readOnly && (
            <button
              type="button"
              onClick={addSlide}
              className="inline-flex items-center gap-1 rounded-lg border border-[#0891B2]/30 px-3 py-1.5 text-xs font-semibold text-[#0891B2] hover:bg-[#0891B2]/5"
            >
              <Plus className="h-3.5 w-3.5" /> Slayd əlavə et
            </button>
          )}
        </div>

        {config.slides.map((slide, index) => {
          const open = openSlide === slide.id;
          return (
            <div key={slide.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpenSlide(open ? null : slide.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="text-slate-400">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
                  <span className="truncate font-medium text-slate-900">
                    {slide.title} {slide.highlight}
                  </span>
                </button>
                {!readOnly && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => moveSlide(index, -1)} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Yuxarı">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => moveSlide(index, 1)} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Aşağı">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => removeSlide(slide.id)} className="rounded p-1 text-red-400 hover:bg-red-50" aria-label="Sil">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {open && (
                <div className="space-y-4 border-t border-slate-100 px-4 py-4">
                  <AdminImageUpload
                    value={slide.imageUrl}
                    folder="home-content"
                    disabled={readOnly}
                    label="Fon şəkli (1920×1080 tövsiyə olunur)"
                    previewClass="h-40"
                    onChange={(url) => updateSlide(slide.id, { imageUrl: url })}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="text-slate-500">Nişan (badge)</span>
                      <input disabled={readOnly} value={slide.badge} onChange={(e) => updateSlide(slide.id, { badge: e.target.value })} className={inputCls} />
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-500">Başlıq</span>
                      <input disabled={readOnly} value={slide.title} onChange={(e) => updateSlide(slide.id, { title: e.target.value })} className={inputCls} />
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-500">Vurğu (rəngli hissə)</span>
                      <input disabled={readOnly} value={slide.highlight} onChange={(e) => updateSlide(slide.id, { highlight: e.target.value })} className={inputCls} />
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-500">Alt mətn</span>
                      <input disabled={readOnly} value={slide.subtitle} onChange={(e) => updateSlide(slide.id, { subtitle: e.target.value })} className={inputCls} />
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-500">Əsas düymə mətni</span>
                      <input disabled={readOnly} value={slide.ctaPrimaryLabel} onChange={(e) => updateSlide(slide.id, { ctaPrimaryLabel: e.target.value })} className={inputCls} />
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-500">Əsas düymə linki</span>
                      <input disabled={readOnly} value={slide.ctaPrimaryHref} onChange={(e) => updateSlide(slide.id, { ctaPrimaryHref: e.target.value })} className={inputCls} />
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-500">İkinci düymə mətni</span>
                      <input disabled={readOnly} value={slide.ctaSecondaryLabel} onChange={(e) => updateSlide(slide.id, { ctaSecondaryLabel: e.target.value })} className={inputCls} />
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-500">İkinci düymə linki</span>
                      <input disabled={readOnly} value={slide.ctaSecondaryHref} onChange={(e) => updateSlide(slide.id, { ctaSecondaryHref: e.target.value })} className={inputCls} />
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Kateqoriyalar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Kateqoriyalar ({config.categories.length})
          </h3>
          {!readOnly && (
            <button
              type="button"
              onClick={addCategory}
              className="inline-flex items-center gap-1 rounded-lg border border-[#0891B2]/30 px-3 py-1.5 text-xs font-semibold text-[#0891B2] hover:bg-[#0891B2]/5"
            >
              <Plus className="h-3.5 w-3.5" /> Kateqoriya əlavə et
            </button>
          )}
        </div>

        <div className="space-y-2">
          {config.categories.map((cat) => (
            <div key={cat.id} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto_auto_auto_auto]">
              <input disabled={readOnly} value={cat.label} onChange={(e) => updateCategory(cat.id, { label: e.target.value })} placeholder="Ad" className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50" />
              <input disabled={readOnly} value={cat.href} onChange={(e) => updateCategory(cat.id, { href: e.target.value })} placeholder="/listings?..." className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50" />
              <select disabled={readOnly} value={cat.icon} onChange={(e) => updateCategory(cat.id, { icon: e.target.value as HomeCategoryIcon })} className="rounded-lg border border-slate-200 px-2 py-2 text-sm disabled:bg-slate-50">
                {ICON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select disabled={readOnly} value={cat.tone} onChange={(e) => updateCategory(cat.id, { tone: e.target.value as HomeCategoryTone })} className="rounded-lg border border-slate-200 px-2 py-2 text-sm capitalize disabled:bg-slate-50">
                {TONE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input disabled={readOnly} value={cat.badge ?? ""} onChange={(e) => updateCategory(cat.id, { badge: e.target.value || undefined })} placeholder="Nişan" className="w-24 rounded-lg border border-slate-200 px-2 py-2 text-sm disabled:bg-slate-50" />
              {!readOnly && (
                <button type="button" onClick={() => removeCategory(cat.id)} className="flex items-center justify-center rounded-lg p-2 text-red-400 hover:bg-red-50" aria-label="Sil">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bölmə mətnləri */}
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-500">Seçilmiş elanlar — başlıq</span>
          <input disabled={readOnly} value={config.featuredTitle} onChange={(e) => setConfig((p) => ({ ...p, featuredTitle: e.target.value }))} className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-500">Seçilmiş elanlar — alt mətn</span>
          <input disabled={readOnly} value={config.featuredSubtitle} onChange={(e) => setConfig((p) => ({ ...p, featuredSubtitle: e.target.value }))} className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-500">Satış CTA — başlıq</span>
          <input disabled={readOnly} value={config.sellCtaTitle} onChange={(e) => setConfig((p) => ({ ...p, sellCtaTitle: e.target.value }))} className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-500">Satış CTA — mətn</span>
          <input disabled={readOnly} value={config.sellCtaText} onChange={(e) => setConfig((p) => ({ ...p, sellCtaText: e.target.value }))} className={inputCls} />
        </label>
      </section>

      {message && (
        <p className={`text-sm ${message.includes("uğurla") ? "text-emerald-600" : "text-red-600"}`}>{message}</p>
      )}

      {!readOnly && (
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-xl bg-[#0891B2] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0891B2]/90 disabled:opacity-60"
        >
          {busy ? "Saxlanılır..." : "Dəyişiklikləri saxla"}
        </button>
      )}
    </div>
  );
}
