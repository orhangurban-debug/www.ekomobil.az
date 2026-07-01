import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";

interface PremiumHeroProps {
  activeCount?: number;
}

export function PremiumHero({ activeCount }: PremiumHeroProps) {
  return (
    <section className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#050508]">
      {/* Ambient background — no mockup screenshot */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(0,87,255,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_50%,rgba(0,87,255,0.12),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent" />
        {/* Abstract car silhouette */}
        <div className="absolute bottom-[8%] left-1/2 h-[42%] w-[min(920px,95vw)] -translate-x-1/2">
          <div className="absolute inset-x-[10%] bottom-[18%] h-[3px] rounded-full bg-[#0057FF]/40 blur-sm" />
          <div
            className="absolute inset-x-[5%] bottom-[20%] h-[38%] rounded-[3rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[0_40px_120px_rgba(0,87,255,0.25)]"
            style={{ clipPath: "polygon(8% 100%, 0% 55%, 12% 35%, 28% 22%, 72% 22%, 88% 35%, 100% 55%, 92% 100%)" }}
          />
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 pb-10 pt-32 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-[#0057FF]">
            Ekoloji · Eleqant · Ekomobil
          </p>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-7xl">
            Gələcəyin Nəqliyyatı.
            <br />
            <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">İndi.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
            VIN yoxlamalı, şəffaf qiymətli və etibarlı avtomobil bazarı — Azərbaycanda.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/listings" className="btn-primary px-8 py-3.5 text-base">
              Kəşf Et
            </Link>
            <Link href="/publish" className="btn-secondary px-8 py-3.5 text-base">
              Elan yerləşdir
            </Link>
          </div>
          {activeCount !== undefined && activeCount > 0 && (
            <p className="mt-6 text-sm text-white/40">
              {activeCount.toLocaleString("az-AZ")} aktiv elan
            </p>
          )}
        </div>

        <form
          action="/listings"
          method="GET"
          className="mt-10 flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/10 bg-[#141419]/90 p-2 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:flex-row sm:items-center sm:p-1.5"
        >
          <div className="flex flex-1 items-center gap-2 px-4 py-2.5">
            <Search className="h-5 w-5 shrink-0 text-white/35" aria-hidden="true" />
            <input
              type="text"
              name="q"
              placeholder="Marka, model, VIN..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0 px-8 py-3">
            Axtar
          </button>
        </form>
      </div>

      <div className="relative flex justify-center pb-10">
        <Link
          href="#featured"
          aria-label="Aşağı sürüşdür"
          className="flex flex-col items-center gap-1 text-white/30 transition hover:text-white/60"
        >
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </Link>
      </div>
    </section>
  );
}
