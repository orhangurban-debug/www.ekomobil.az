"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, ShieldCheck, Gavel, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { HomeSlide } from "@/lib/home-content";
import { DEFAULT_HOME_CONTENT } from "@/lib/home-content";

const INTERVAL_MS = 6500;

const TRUST_CHIPS = [
  { icon: ShieldCheck, label: "VIN yoxlama" },
  { icon: TrendingUp, label: "Bazar analizi" },
  { icon: Gavel, label: "Canlı auksion" }
];

export function HeroCarousel({
  activeCount,
  slides: slidesProp
}: {
  activeCount?: number;
  slides?: HomeSlide[];
}) {
  const slides = slidesProp && slidesProp.length > 0 ? slidesProp : DEFAULT_HOME_CONTENT.slides;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = window.setInterval(next, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, next, slides.length]);

  const slide = slides[Math.min(index, slides.length - 1)];

  return (
    <section
      className="relative min-h-[92dvh] overflow-hidden bg-[#070B18]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Arxa fon slaydları */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          {s.imageUrl && (
            <div
              className="absolute inset-0 scale-105 bg-cover bg-center"
              style={{ backgroundImage: `url(${s.imageUrl})` }}
            />
          )}
          {/* Tünd overlaylar — premium kontrast üçün */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070B18] via-[#070B18]/85 to-[#070B18]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070B18] via-transparent to-[#070B18]/60" />
        </div>
      ))}

      {/* Dekorativ glow */}
      <div className="pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-[#0057FF]/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-16 bottom-24 h-64 w-64 rounded-full bg-cyan-400/15 blur-[120px]" />

      {/* Məzmun */}
      <div className="relative mx-auto flex min-h-[92dvh] max-w-7xl flex-col justify-center px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div
              key={`badge-${slide.id}`}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
              {slide.badge || "EkoMobil"}
            </div>

            <h1
              key={`title-${slide.id}`}
              className="text-[2.6rem] font-black leading-[1.03] tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              {slide.title}
              {slide.highlight && (
                <>
                  <br />
                  <span className="bg-gradient-to-r from-[#4d8bff] via-[#38bdf8] to-[#22d3ee] bg-clip-text text-transparent">
                    {slide.highlight}
                  </span>
                </>
              )}
            </h1>

            <p
              key={`sub-${slide.id}`}
              className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg"
            >
              {slide.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={slide.ctaPrimaryHref || "/listings"}
                className="rounded-xl bg-gradient-to-r from-[#0057FF] to-[#3b82f6] px-7 py-3.5 text-base font-semibold text-white shadow-[0_10px_40px_rgba(0,87,255,0.45)] transition hover:shadow-[0_14px_50px_rgba(0,87,255,0.6)]"
              >
                {slide.ctaPrimaryLabel || "Kəşf et"}
              </Link>
              {slide.ctaSecondaryLabel && (
                <Link
                  href={slide.ctaSecondaryHref || "/publish"}
                  className="rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
                >
                  {slide.ctaSecondaryLabel}
                </Link>
              )}
            </div>

            {/* Etibar çipləri */}
            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              {TRUST_CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                    {chip.label}
                  </span>
                );
              })}
            </div>

            {activeCount !== undefined && activeCount > 0 && (
              <p className="mt-6 text-sm text-slate-400">
                <span className="font-bold text-white">{activeCount.toLocaleString("az-AZ")}</span> aktiv elan indi
                platformada
              </p>
            )}
          </div>

          {/* Şüşə önizləmə kartı — yalnız desktop */}
          <div className="hidden lg:block">
            <div className="relative mx-auto w-full max-w-md">
              <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-1.5 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                {slide.imageUrl && (
                  <div
                    className="aspect-[4/3] rounded-2xl bg-cover bg-center transition-all duration-1000"
                    style={{ backgroundImage: `url(${slide.imageUrl})` }}
                  />
                )}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">{slide.badge}</p>
                  <p className="mt-1 text-lg font-bold text-white">{slide.highlight.replace(/\.$/, "") || slide.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-300">{slide.subtitle}</p>
                </div>
              </div>
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-2xl bg-[#0057FF]/30 blur-2xl" />
              <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-cyan-400/25 blur-2xl" />
            </div>
          </div>
        </div>

        {/* Axtarış paneli */}
        <form
          action="/listings"
          method="GET"
          className="mt-12 flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:flex-row sm:items-center sm:p-1.5"
        >
          <div className="flex flex-1 items-center gap-2 px-4 py-2.5">
            <Search className="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />
            <input
              type="text"
              name="q"
              placeholder="Marka, model, VIN..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-gradient-to-r from-[#0057FF] to-[#3b82f6] px-8 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Axtar
          </button>
        </form>

        {/* Karusel idarəçiləri */}
        {slides.length > 1 && (
          <div className="mt-8 flex items-center gap-4">
            <div className="flex gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Slayd ${i + 1}: ${s.badge}`}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === index ? "w-8 bg-cyan-400" : "w-2 bg-white/25 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Əvvəlki slayd"
                onClick={prev}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur transition hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Növbəti slayd"
                onClick={next}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur transition hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
