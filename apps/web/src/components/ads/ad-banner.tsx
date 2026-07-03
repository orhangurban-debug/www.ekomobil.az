"use client";

/**
 * EkoMobil — Reklam slot komponentləri (IAB standart ölçülər)
 *
 * Standart formatlar:
 *   leaderboard  — 728×90  — səhifə üstü/altı, tam genişlik
 *   wide         — 970×90  — desktop geniş banner
 *   rectangle    — 300×250 — MPU, kənar panel / kart arası
 *   mobile       — 320×50  — mobil banner
 *
 * `mode="placeholder"` — boş inventar yeri ("Burda sizin reklamınız ola bilər!")
 * `mode="demo"`        — nümunə reklam məzmunu (dev/preview)
 *
 * Produksiyada slotLabel ilə Google Ad Manager / DFP snippet əlavə edilir.
 */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import type { AdSlotItem } from "@/lib/ad-slots-config";
import { computeAdCampaignStatus } from "@/lib/ad-slots-config";

export type AdSize = "leaderboard" | "rectangle" | "wide" | "mobile";
export type AdMode = "placeholder" | "demo";

type DemoContent = {
  logoText: string;
  headline: string;
  sub: string;
  cta: string;
  href: string;
  accent: string;
};

interface AdBannerProps {
  size: AdSize;
  mode?: AdMode;
  slotLabel?: string;
  slotConfig?: AdSlotItem;
  demoContent?: DemoContent;
  className?: string;
  /** Placeholder rejimində reklam sorğusu linki */
  contactHref?: string;
  placeholderText?: string;
}

const SIZE_META: Record<AdSize, { width: number; height: number; label: string; wrapper: string; heightClass: string }> = {
  leaderboard: {
    width: 728,
    height: 90,
    label: "Leaderboard",
    wrapper: "w-full max-w-[728px]",
    heightClass: "h-[90px]"
  },
  wide: {
    width: 970,
    height: 90,
    label: "Wide Banner",
    wrapper: "w-full max-w-[970px]",
    heightClass: "h-[90px]"
  },
  rectangle: {
    width: 300,
    height: 250,
    label: "Medium Rectangle",
    wrapper: "w-full max-w-[300px]",
    heightClass: "h-[250px]"
  },
  mobile: {
    width: 320,
    height: 50,
    label: "Mobile Banner",
    wrapper: "w-full max-w-[320px]",
    heightClass: "h-[50px]"
  }
};

const DEMO_ADS: DemoContent[] = [
  {
    logoText: "AutoExpert",
    headline: "Avtomobilinizi peşəkar yoxlatdırın",
    sub: "Bakı • 24 saat ərzində nəticə",
    cta: "Rezerv et",
    href: "#",
    accent: "#0057FF"
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

function getDemoAd(slotLabel?: string): DemoContent {
  const idx = slotLabel ? slotLabel.charCodeAt(0) % DEMO_ADS.length : 0;
  return DEMO_ADS[idx];
}

function AdLabel() {
  return (
    <span className="rounded-md bg-slate-900/6 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
      Reklam
    </span>
  );
}

function PlaceholderBanner({
  size,
  slotLabel,
  contactHref = "/advertise",
  placeholderText = "Burda sizin reklamınız ola bilər!"
}: {
  size: AdSize;
  slotLabel?: string;
  contactHref?: string;
  placeholderText?: string;
}) {
  const meta = SIZE_META[size];
  const isCompact = size === "mobile" || size === "leaderboard" || size === "wide";

  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300/80 bg-white/50 backdrop-blur-sm ${meta.heightClass}`}
      data-ad-slot={slotLabel}
    >
      <div className="absolute right-2 top-2">
        <AdLabel />
      </div>

      <div className={`flex items-center gap-3 px-4 text-center ${isCompact ? "flex-row" : "flex-col py-4"}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0057FF]/10 text-[#0057FF]">
          <Megaphone className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className={isCompact ? "text-left" : ""}>
          <p className={`font-semibold text-slate-700 ${size === "mobile" ? "text-xs" : "text-sm"}`}>
            {placeholderText}
          </p>
          {size !== "mobile" && (
            <p className="mt-0.5 text-xs text-slate-400">
              {meta.label} · {meta.width}×{meta.height}
              {slotLabel ? ` · ${slotLabel}` : ""}
            </p>
          )}
        </div>
        {size !== "mobile" && (
          <Link
            href={contactHref}
            className="shrink-0 rounded-lg border border-[#0057FF]/25 bg-[#0057FF]/8 px-3 py-1.5 text-xs font-semibold text-[#0057FF] transition hover:bg-[#0057FF]/15"
          >
            Reklam yerləşdirin
          </Link>
        )}
      </div>
    </div>
  );
}

/** Yüklənmiş reklam şəkli (banner kreativi) — kliklə keçid ilə */
function ImageAdBanner({
  imageUrl,
  linkUrl,
  advertiserName,
  rounded = "rounded-xl"
}: {
  imageUrl: string;
  linkUrl: string;
  advertiserName: string;
  rounded?: string;
}) {
  const inner = (
    <div className={`relative h-full w-full overflow-hidden ${rounded} border border-slate-900/10 bg-white shadow-sm`}>
      <div className="absolute right-2 top-2 z-10">
        <AdLabel />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={advertiserName || "Reklam"} className="h-full w-full object-cover" loading="lazy" />
    </div>
  );
  if (linkUrl) {
    const external = /^https?:\/\//i.test(linkUrl);
    return (
      <Link
        href={linkUrl}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer sponsored" : "sponsored"}
        className="block h-full w-full"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

function LeaderboardDemo({
  content,
  onClose
}: {
  content: DemoContent;
  onClose: () => void;
}) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-between gap-4 overflow-hidden rounded-xl border border-slate-900/10 bg-white/60 px-5 shadow-sm"
      style={{ borderLeftColor: content.accent, borderLeftWidth: 3 }}
    >
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
      <div className="flex shrink-0 items-center gap-3">
        <AdLabel />
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
          className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-900/8 hover:text-slate-500"
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

function RectangleDemo({ content }: { content: DemoContent }) {
  return (
    <div className="glass-panel flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-xl border border-slate-900/10 p-5 shadow-sm">
      <div className="flex w-full items-center justify-between">
        <AdLabel />
        <div className="h-1.5 w-16 rounded-full opacity-40" style={{ backgroundColor: content.accent }} />
      </div>
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm"
          style={{ backgroundColor: content.accent }}
        >
          {content.logoText.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-base font-bold leading-snug text-slate-900">{content.headline}</p>
          <p className="mt-1 text-xs text-slate-400">{content.sub}</p>
        </div>
      </div>
      <Link
        href={content.href}
        className="w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: content.accent }}
      >
        {content.cta}
      </Link>
    </div>
  );
}

/** Standart reklam slotu — IAB ölçüləri ilə */
export function AdBanner({
  size,
  mode = "placeholder",
  slotLabel,
  slotConfig,
  demoContent,
  className = "",
  contactHref,
  placeholderText
}: AdBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (slotConfig && !slotConfig.enabled) return null;

  const resolvedSize = slotConfig?.size ?? size;
  const resolvedLabel = slotConfig?.id ?? slotLabel;

  // Ödənişli kampaniya rejimi — canlıdırsa yüklənmiş şəkil göstərilir, əks halda placeholder-a düşür.
  const campaign = slotConfig?.mode === "campaign" ? slotConfig.campaign : undefined;
  const campaignLive = campaign ? computeAdCampaignStatus(campaign).isLive : false;

  const resolvedMode: AdMode =
    slotConfig?.mode === "custom" ? "demo" : slotConfig?.mode === "campaign" ? "placeholder" : (slotConfig?.mode ?? mode);
  const resolvedPlaceholder = slotConfig?.placeholderText ?? placeholderText;
  const resolvedDemo =
    slotConfig?.mode === "custom" && slotConfig.customContent
      ? slotConfig.customContent
      : demoContent;

  const meta = SIZE_META[resolvedSize];

  if (resolvedMode === "demo" && dismissed) return null;

  if (campaignLive && campaign) {
    return (
      <div
        className={`mx-auto flex justify-center ${meta.wrapper} ${meta.heightClass} ${className}`}
        role="complementary"
        aria-label="Reklam yeri"
      >
        <ImageAdBanner
          imageUrl={campaign.imageUrl}
          linkUrl={campaign.linkUrl}
          advertiserName={campaign.advertiserName}
        />
      </div>
    );
  }

  return (
    <div
      className={`mx-auto flex justify-center ${meta.wrapper} ${meta.heightClass} ${className}`}
      role="complementary"
      aria-label="Reklam yeri"
    >
      {resolvedMode === "placeholder" ? (
        <PlaceholderBanner
          size={resolvedSize}
          slotLabel={resolvedLabel}
          contactHref={contactHref}
          placeholderText={resolvedPlaceholder}
        />
      ) : (
        (() => {
          const content = resolvedDemo ?? getDemoAd(resolvedLabel);
          return resolvedSize === "rectangle" ? (
            <RectangleDemo content={content} />
          ) : (
            <LeaderboardDemo content={content} onClose={() => setDismissed(true)} />
          );
        })()
      )}
    </div>
  );
}

/** Səhifə bölmələri arasında tam genişlikli reklam zolağı */
export function AdSlotRow({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-y border-slate-900/8 bg-white/40 py-4 backdrop-blur-sm ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}

/** Elan kartı formatında native reklam yeri */
export function NativeAdCard({
  slotLabel,
  slotConfig,
  mode = "placeholder",
  contactHref = "/advertise",
  placeholderText
}: {
  slotLabel?: string;
  slotConfig?: AdSlotItem;
  mode?: AdMode;
  contactHref?: string;
  placeholderText?: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (slotConfig && !slotConfig.enabled) return null;

  const resolvedLabel = slotConfig?.id ?? slotLabel;

  const campaign = slotConfig?.mode === "campaign" ? slotConfig.campaign : undefined;
  const campaignLive = campaign ? computeAdCampaignStatus(campaign).isLive : false;

  const resolvedMode: AdMode =
    slotConfig?.mode === "custom" ? "demo" : slotConfig?.mode === "campaign" ? "placeholder" : (slotConfig?.mode ?? mode);
  const resolvedPlaceholder = slotConfig?.placeholderText ?? placeholderText;
  const content =
    slotConfig?.mode === "custom" && slotConfig.customContent
      ? slotConfig.customContent
      : getDemoAd(resolvedLabel);

  if (resolvedMode === "demo" && dismissed) return null;

  if (campaignLive && campaign) {
    return (
      <div
        className="relative min-h-[320px] overflow-hidden rounded-2xl"
        role="complementary"
        aria-label="Reklam yeri"
      >
        <ImageAdBanner
          imageUrl={campaign.imageUrl}
          linkUrl={campaign.linkUrl}
          advertiserName={campaign.advertiserName}
          rounded="rounded-2xl"
        />
      </div>
    );
  }

  if (resolvedMode === "placeholder") {
    return (
      <div
        className="relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-dashed border-slate-300/80 bg-white/50 backdrop-blur-sm"
        data-ad-slot={resolvedLabel}
        role="complementary"
        aria-label="Reklam yeri"
      >
        <div className="absolute right-3 top-3 z-10">
          <AdLabel />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0057FF]/10 text-[#0057FF]">
            <Megaphone className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">{resolvedPlaceholder ?? "Burda sizin reklamınız ola bilər!"}</p>
            <p className="mt-1 text-xs text-slate-400">
              Native kart · 300×250
              {resolvedLabel ? ` · ${resolvedLabel}` : ""}
            </p>
          </div>
          <Link
            href={contactHref}
            className="rounded-xl border border-[#0057FF]/25 bg-[#0057FF]/8 px-5 py-2 text-sm font-semibold text-[#0057FF] transition hover:bg-[#0057FF]/15"
          >
            Reklam yerləşdirin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel relative flex flex-col overflow-hidden rounded-2xl border border-slate-900/10 shadow-sm">
      <div className="absolute right-3 top-3 z-10">
        <AdLabel />
      </div>
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
        className="absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-slate-400 shadow-sm hover:text-slate-600"
        aria-label="Bağla"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
