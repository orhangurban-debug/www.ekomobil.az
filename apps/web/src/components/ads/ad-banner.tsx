"use client";

/**
 * EkoMobil — Premium reklam banner komponenti
 *
 * Yerləşdirmə yerleri:
 *   leaderboard  — 728×90  — səhifə yuxarısı/altı, tam genişlik
 *   rectangle    — 300×250 — kənar panellər, kart arası
 *   wide         — 970×90  — desktop full-width arası
 *
 * Produksiyada buradakı placeholder-lar real reklam kodu
 * (Google Ad Manager / DFP snippet) ilə əvəz edilir.
 */

import { useState } from "react";
import Link from "next/link";

export type AdSize = "leaderboard" | "rectangle" | "wide";

interface AdBannerProps {
  size: AdSize;
  /** Reklam slotunun açıq etiketi (idarəetmə paneli üçün) */
  slotLabel?: string;
  /** Demo/dev rejimdə göstəriləcək nümunə məzmun */
  demoContent?: {
    logoText: string;
    headline: string;
    sub: string;
    cta: string;
    href: string;
    accent: string;
  };
  className?: string;
}

const SIZE_STYLES: Record<AdSize, { wrapper: string; height: string }> = {
  leaderboard: {
    wrapper: "w-full",
    height: "h-[90px]"
  },
  rectangle: {
    wrapper: "w-[300px]",
    height: "h-[250px]"
  },
  wide: {
    wrapper: "w-full",
    height: "h-[90px]"
  }
};

// Demo reklam məzmunları — real trafikdə real reklamlarla əvəz edilir
const DEMO_ADS: AdBannerProps["demoContent"][] = [
  {
    logoText: "AutoExpert",
    headline: "Avtomobilinizi peşəkar yoxlatdırın",
    sub: "Bakı • 24 saat ərzində nəticə",
    cta: "Rezerv et",
    href: "#",
    accent: "#0891B2"
  },
  {
    logoText: "TechniCar",
    headline: "Rəsmi texniki xidmət mərkəzi",
    sub: "Toyota · BMW · Mercedes · Hyundai",
    cta: "Əlaqə",
    href: "#",
    accent: "#7c3aed"
  },
  {
    logoText: "CarFinance",
    headline: "Avtomobil krediti — 12.5% illik",
    sub: "Sürətli qərar · Sənədsiz prosedur",
    cta: "Hesabla",
    href: "#",
    accent: "#d97706"
  },
  {
    logoText: "InsureAZ",
    headline: "KASKO sığortası — onlayn rəsmiləşdir",
    sub: "Dəyər bazarlığı olmadan — 3 dəqiqədə",
    cta: "Qiymət al",
    href: "#",
    accent: "#16a34a"
  }
];

function getRandomAd(slotLabel?: string): AdBannerProps["demoContent"] {
  const idx = slotLabel
    ? slotLabel.charCodeAt(0) % DEMO_ADS.length
    : Math.floor(Math.random() * DEMO_ADS.length);
  return DEMO_ADS[idx];
}

function LeaderboardAd({ content, onClose }: { content: NonNullable<AdBannerProps["demoContent"]>; onClose: () => void }) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-between gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white px-5 shadow-sm"
      style={{ borderLeftColor: content.accent, borderLeftWidth: 3 }}
    >
      {/* Left: logo + text */}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: content.accent }}
        >
          {content.logoText.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{content.headline}</p>
          <p className="truncate text-xs text-slate-400">{content.sub}</p>
        </div>
      </div>

      {/* Right: CTA + label */}
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden text-[10px] font-medium uppercase tracking-widest text-slate-300 sm:block">
          Reklam
        </span>
        <Link
          href={content.href}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: content.accent }}
          onClick={(e) => e.stopPropagation()}
        >
          {content.cta}
        </Link>
        <button
          onClick={onClose}
          className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-500"
          aria-label="Bağla"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function RectangleAd({ content }: { content: NonNullable<AdBannerProps["demoContent"]> }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {/* Top: Reklam etiket */}
      <div className="flex w-full items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-300">Reklam</span>
        <div
          className="h-1.5 w-16 rounded-full opacity-40"
          style={{ backgroundColor: content.accent }}
        />
      </div>

      {/* Center: brand + message */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm"
          style={{ backgroundColor: content.accent }}
        >
          {content.logoText.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-base font-bold text-slate-900 leading-snug">{content.headline}</p>
          <p className="mt-1 text-xs text-slate-400">{content.sub}</p>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={content.href}
        className="w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: content.accent }}
        onClick={(e) => e.stopPropagation()}
      >
        {content.cta}
      </Link>
    </div>
  );
}

export function AdBanner({ size, slotLabel, demoContent, className = "" }: AdBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const content = demoContent ?? getRandomAd(slotLabel);

  if (dismissed || !content) return null;

  const { wrapper, height } = SIZE_STYLES[size];

  return (
    <div
      className={`${wrapper} ${height} ${className}`}
      role="complementary"
      aria-label="Reklam"
    >
      {size === "rectangle" ? (
        <RectangleAd content={content} />
      ) : (
        <LeaderboardAd content={content} onClose={() => setDismissed(true)} />
      )}
    </div>
  );
}

/**
 * Elanlar arasında göstərilən native-style reklam kartı
 * Digər listing kartları ilə vizual harmoniyadır
 */
export function NativeAdCard({ slotLabel }: { slotLabel?: string }) {
  const [dismissed, setDismissed] = useState(false);
  const content = getRandomAd(slotLabel);

  if (dismissed || !content) return null;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* "Reklam" işarəsi */}
      <div className="absolute right-3 top-3 z-10 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
        Reklam
      </div>

      {/* Top band */}
      <div
        className="flex h-[140px] items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${content.accent}15 0%, ${content.accent}30 100%)`
        }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-white shadow"
          style={{ backgroundColor: content.accent }}
        >
          {content.logoText.slice(0, 2).toUpperCase()}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-medium text-slate-400">{content.logoText}</p>
          <h3 className="mt-0.5 font-semibold leading-snug text-slate-900">{content.headline}</h3>
          <p className="mt-1 text-xs text-slate-500">{content.sub}</p>
        </div>

        <Link
          href={content.href}
          className="mt-auto block w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: content.accent }}
        >
          {content.cta}
        </Link>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-slate-400 shadow-sm hover:text-slate-600"
        aria-label="Bağla"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
