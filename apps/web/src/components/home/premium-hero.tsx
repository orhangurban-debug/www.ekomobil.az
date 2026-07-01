import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Search } from "lucide-react";

interface PremiumHeroProps {
  activeCount?: number;
}

export function PremiumHero({ activeCount }: PremiumHeroProps) {
  return (
    <section className="relative flex min-h-[100dvh] flex-col justify-end overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-premium.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/40 via-[#0a0a0f]/60 to-[#0a0a0f]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(0,87,255,0.15),transparent)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 pb-8 pt-28 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-white/50">
            Ekoloji. Eleqant. Ekomobil.
          </p>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-7xl">
            Gələcəyin Nəqliyyatı.
            <br />
            <span className="text-white/90">İndi.</span>
          </h1>
          <div className="mt-8 flex flex-wrap items-center gap-4">
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
          className="glass-panel mt-10 flex max-w-2xl flex-col gap-3 p-2 sm:flex-row sm:items-center sm:gap-0 sm:p-1.5"
        >
          <div className="flex flex-1 items-center gap-2 px-4 py-2">
            <Search className="h-5 w-5 shrink-0 text-white/40" aria-hidden="true" />
            <input
              type="text"
              name="q"
              placeholder="Marka, model, VIN..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/35 outline-none"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0 px-8 py-3">
            Axtar
          </button>
        </form>
      </div>

      <div className="relative flex justify-center pb-8">
        <Link
          href="#featured"
          aria-label="Aşağı sürüşdür"
          className="flex flex-col items-center gap-1 text-white/40 transition hover:text-white/70"
        >
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </Link>
      </div>
    </section>
  );
}
