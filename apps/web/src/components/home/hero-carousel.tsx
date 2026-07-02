"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  image: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
}

const slides: HeroSlide[] = [
  {
    id: "marketplace",
    badge: "Avtomobil bazarı",
    title: "Etibarla al.",
    highlight: "Şəffaf qiymətlə sat.",
    subtitle:
      "VIN yoxlamalı elanlar, etibar xalı və bazar analizi — Azərbaycanda ən şəffaf avtomobil bazarı.",
    image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1920&q=80",
    ctaPrimary: { label: "Elanları kəşf et", href: "/listings" },
    ctaSecondary: { label: "Elan yerləşdir", href: "/publish" }
  },
  {
    id: "auction",
    badge: "Canlı auksion",
    title: "Real vaxtda",
    highlight: "hərrac.",
    subtitle:
      "Sayğac, avtomatik təklif və tam tarixi ilə şəffaf auksion — lot statusu anında yenilənir.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1920&q=80",
    ctaPrimary: { label: "Auksionlara bax", href: "/auction" },
    ctaSecondary: { label: "Lot yerləşdir", href: "/auction/sell" }
  },
  {
    id: "trust",
    badge: "Etibar & yoxlama",
    title: "VIN, servis tarixçəsi,",
    highlight: "yürüş təsdiqi.",
    subtitle:
      "Hər elan məlumat dolğunluğuna görə qiymətləndirilir — alıcı risk siqnallarını əvvəlcədən görür.",
    image: "https://images.unsplash.com/photo-1619642751034-765df6927ada?auto=format&fit=crop&w=1920&q=80",
    ctaPrimary: { label: "Etibar mərkəzi", href: "/trust" },
    ctaSecondary: { label: "Elanları yoxla", href: "/listings?vinProvided=1" }
  },
  {
    id: "business",
    badge: "Salon & mağaza",
    title: "Biznesiniz üçün",
    highlight: "tam platforma.",
    subtitle:
      "Avtomobil salonu, ehtiyat hissə mağazası və servis — bir hesabdan idarə, analitika və CRM.",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1920&q=80",
    ctaPrimary: { label: "Salonları kəşf et", href: "/dealers" },
    ctaSecondary: { label: "Biznes planları", href: "/pricing#dealer" }
  }
];

const INTERVAL_MS = 6000;

export function HeroCarousel({ activeCount }: { activeCount?: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(next, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, next]);

  const slide = slides[index];

  return (
    <section
      className="relative min-h-[88dvh] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${s.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/75 to-white/30 sm:from-white/95 sm:via-white/80 sm:to-white/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#EEF1F8] via-white/20 to-transparent sm:via-transparent sm:to-white/30" />
        </div>
      ))}

      {/* Content */}
      <div className="relative mx-auto flex min-h-[88dvh] max-w-7xl flex-col justify-center px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div
              key={`badge-${slide.id}`}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0057FF]/20 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#0057FF] backdrop-blur-sm transition-all duration-500"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#0057FF] animate-pulse" />
              {slide.badge}
            </div>

            <h1
              key={`title-${slide.id}`}
              className="text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 transition-all duration-700 sm:text-5xl lg:text-6xl"
            >
              {slide.title}
              <br />
              <span className="bg-gradient-to-r from-[#0057FF] to-[#0046CC] bg-clip-text text-transparent">
                {slide.highlight}
              </span>
            </h1>

            <p
              key={`sub-${slide.id}`}
              className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 transition-all duration-700 sm:text-lg"
            >
              {slide.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={slide.ctaPrimary.href} className="btn-primary px-7 py-3.5 text-base">
                {slide.ctaPrimary.label}
              </Link>
              <Link href={slide.ctaSecondary.href} className="btn-secondary px-7 py-3.5 text-base">
                {slide.ctaSecondary.label}
              </Link>
            </div>

            {activeCount !== undefined && activeCount > 0 && (
              <p className="mt-5 text-sm text-slate-500">
                <span className="font-semibold text-[#0057FF]">{activeCount.toLocaleString("az-AZ")}</span> aktiv elan
                indi platformada
              </p>
            )}
          </div>

          {/* Glass preview cards — desktop only */}
          <div className="hidden lg:block">
            <div className="relative mx-auto w-full max-w-md">
              <div className="glass-panel overflow-hidden rounded-3xl p-1 shadow-[0_24px_80px_rgba(0,87,255,0.15)]">
                <div
                  className="aspect-[4/3] rounded-2xl bg-cover bg-center transition-all duration-1000"
                  style={{ backgroundImage: `url(${slide.image})` }}
                />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#0057FF]">{slide.badge}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{slide.highlight.replace(/\.$/, "")}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{slide.subtitle}</p>
                </div>
              </div>
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-2xl bg-[#0057FF]/10 blur-2xl" />
              <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-emerald-400/20 blur-2xl" />
            </div>
          </div>
        </div>

        {/* Search bar */}
        <form
          action="/listings"
          method="GET"
          className="mt-10 flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/80 bg-white/75 p-2 shadow-[0_8px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:flex-row sm:items-center sm:p-1.5"
        >
          <div className="flex flex-1 items-center gap-2 px-4 py-2.5">
            <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              name="q"
              placeholder="Marka, model, VIN..."
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0 px-8 py-3">
            Axtar
          </button>
        </form>

        {/* Carousel controls */}
        <div className="mt-8 flex items-center gap-4">
          <div className="flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Slayd ${i + 1}: ${s.badge}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-8 bg-[#0057FF]" : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Əvvəlki slayd"
              onClick={prev}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 backdrop-blur transition hover:border-[#0057FF]/30 hover:text-[#0057FF]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Növbəti slayd"
              onClick={next}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 backdrop-blur transition hover:border-[#0057FF]/30 hover:text-[#0057FF]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
