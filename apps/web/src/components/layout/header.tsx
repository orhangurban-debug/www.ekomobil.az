"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCompare } from "@/components/compare/compare-context";
import type { UserRole } from "@/lib/auth";

const GLOBAL_NOTICE_VERSION = "v3";
const GLOBAL_NOTICE_STORAGE_KEY = `ekomobil_global_notice_hidden_${GLOBAL_NOTICE_VERSION}`;

const BETA_NOTICE_ENABLED = process.env.NEXT_PUBLIC_PLATFORM_BETA === "true";

const navLinks: Array<{ href: string; label: string; live?: boolean }> = [
  { href: "/listings", label: "Elanlar" },
  { href: "/auction", label: "Auksion", live: true },
  { href: "/services", label: "Servislər" },
  { href: "/dealers", label: "Salonlar" },
  { href: "/parts", label: "Mağaza" },
  { href: "/pricing", label: "Qiymətlər" },
];

const accentBg = "bg-[#0057FF]/12 text-[#0057FF]";
const navIdle = "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900";

/** Build context-aware "Elan ver" dropdown items based on active subscriptions. */
function buildSellItems(hasStorePlan: boolean, hasSalonPlan: boolean) {
  return [
    {
      href: "/publish",
      icon: "🚗",
      label: hasSalonPlan ? "Salon elanı yerləşdir" : "Maşın sat",
      desc: hasSalonPlan ? "Salon inventarına əlavə et" : "Fərdi avtomobil elanı",
    },
    {
      href: hasStorePlan ? "/parts/publish" : "/parts/apply",
      icon: "📦",
      label: hasStorePlan ? "Hissə elanı yerləşdir" : "Hissə sat",
      desc: hasStorePlan ? "Mağaza inventarına əlavə et" : "Fərdi elan və ya mağaza aç",
    },
    // Salon row — show panel if active, else apply
    hasSalonPlan
      ? {
          href: "/dealer",
          icon: "🏢",
          label: "Salon paneli",
          desc: "Salonunuzu idarə edin",
        }
      : {
          href: "/dealer/apply",
          icon: "🏢",
          label: "Salon müraciəti",
          desc: "Avtomobil satış salonu",
        },
    // Store panel — only show if active (otherwise it's already in parts row above)
    ...(hasStorePlan
      ? [{ href: "/parts/store", icon: "📦", label: "Mağaza paneli", desc: "Mağazanızı idarə edin" }]
      : []),
    {
      href: "/partners/inspection",
      icon: "🔧",
      label: "Servis profili yarat",
      desc: "Mexanik, elektrik, ekspertiza…",
    },
  ] as { href: string | null; icon: string; label: string; desc: string }[];
}

export function Header({
  userEmail,
  userRole,
  logoUrl,
  hasStorePlan,
  hasSalonPlan,
}: {
  userEmail?: string;
  userRole?: UserRole;
  logoUrl: string;
  hasStorePlan?: boolean;
  hasSalonPlan?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { ids: compareIds } = useCompare();
  const compareHref = compareIds.length > 0 ? `/compare?ids=${compareIds.join(",")}` : "/compare";
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sellMenuRef = useRef<HTMLDivElement>(null);

  const sellItems = buildSellItems(!!hasStorePlan, !!hasSalonPlan);

  function hideNotice() {
    setNoticeVisible(false);
    window.localStorage.setItem(GLOBAL_NOTICE_STORAGE_KEY, "1");
  }

  useEffect(() => {
    setMounted(true);
    setNoticeVisible(
      BETA_NOTICE_ENABLED && window.localStorage.getItem(GLOBAL_NOTICE_STORAGE_KEY) !== "1"
    );
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  // Close hamburger on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (mobileMenuRef.current?.contains(target) || menuButtonRef.current?.contains(target)) return;
      setMenuOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  // Close sell dropdown on outside click / Escape
  useEffect(() => {
    if (!sellOpen) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      if (sellMenuRef.current?.contains(e.target as Node)) return;
      setSellOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSellOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sellOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setSellOpen(false);
  }, [pathname]);

  async function onLogout() {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
    } finally {
      router.push("/login");
      router.refresh();
      setLogoutLoading(false);
    }
  }

  return (
    <header className="glass-nav sticky top-0 z-50">
      {BETA_NOTICE_ENABLED && noticeVisible && (
        <div className="border-b border-amber-500/25 bg-amber-50/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-start justify-between gap-3 px-4 py-2.5 text-xs text-amber-800 sm:px-6 lg:px-8">
            <p className="leading-5">
              <span className="font-semibold">Qeyd:</span> Platforma yeni istifadəyə verilib. Bəzi funksiyalar
              mərhələli şəkildə təkmilləşdirilir.{" "}
              <span className="font-semibold">Suallarınız üçün dəstək ilə əlaqə saxlayın.</span>{" "}
              Ətraflı üçün{" "}
              <Link href="/pricing" className="font-semibold underline decoration-dotted underline-offset-2">Qiymətlər</Link>{" "}
              və{" "}
              <Link href="/terms" className="font-semibold underline decoration-dotted underline-offset-2">Şərtlər</Link>{" "}
              səhifələrini izləyin.
            </p>
            <button
              type="button"
              onClick={hideNotice}
              aria-label="Bildirişi bağla"
              className="shrink-0 rounded-md border border-amber-400/50 bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-amber-800 transition hover:bg-white"
            >
              Bağla
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo logoUrl={logoUrl} />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === link.href ? accentBg : navIdle
              }`}
            >
              {link.live && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
              )}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right section */}
        <div className="flex items-center gap-2">
          {/* Favorites */}
          <Link
            href="/favorites"
            aria-label="Favorilər"
            className={`hidden md:flex h-11 w-11 items-center justify-center rounded-lg transition ${
              pathname === "/favorites" ? accentBg : navIdle
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </Link>

          {/* Compare */}
          <Link
            href={compareHref}
            aria-label="Müqayisə"
            className={`relative hidden md:flex h-11 w-11 items-center justify-center rounded-lg transition ${
              pathname.startsWith("/compare") ? accentBg : navIdle
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            {mounted && compareIds.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0057FF] text-[10px] font-bold text-white">
                {compareIds.length}
              </span>
            )}
          </Link>

          {/* Auth */}
          {userEmail ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/me" className={`flex h-9 items-center rounded-lg px-3 text-sm font-medium transition ${navIdle}`}>
                Profil
              </Link>
              {(userRole === "admin" || userRole === "support") && (
                <Link href="/admin" className="btn-secondary text-xs px-3 py-1.5">Admin</Link>
              )}
              <button
                type="button"
                onClick={() => void onLogout()}
                disabled={logoutLoading}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-60"
              >
                {logoutLoading ? "Çıxılır..." : "Çıxış"}
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login" className={`flex h-9 items-center rounded-lg px-3 text-sm font-medium transition ${navIdle}`}>
                Daxil ol
              </Link>
              <Link href="/register" className="btn-secondary text-sm px-3 py-1.5">
                Qeydiyyat
              </Link>
            </div>
          )}

          {/* "Elan ver" — permanent dropdown, always visible on desktop */}
          <div ref={sellMenuRef} className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setSellOpen((v) => !v)}
              className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2"
              aria-expanded={sellOpen}
              aria-haspopup="true"
            >
              Elan ver
              <svg
                className={`h-3.5 w-3.5 transition-transform ${sellOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {sellOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-900/10 bg-white/95 py-2 shadow-xl backdrop-blur-xl">
                {sellItems.map((item) =>
                  item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50"
                      onClick={() => setSellOpen(false)}
                    >
                      <span className="mt-0.5 text-lg leading-none">{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </Link>
                  ) : (
                    <div key={item.label} className="flex items-start gap-3 px-4 py-3 opacity-40 cursor-not-allowed select-none">
                      <span className="mt-0.5 text-lg leading-none">{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Menyunu bağla" : "Menyunu aç"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-900/10 bg-white/60 text-slate-900 md:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-nav-menu"
          ref={mobileMenuRef}
          className="border-t border-slate-900/8 bg-white/95 px-4 py-3 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-1">
            {/* Browse nav links */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium ${
                  pathname === link.href ? accentBg : "text-slate-700 hover:bg-slate-900/5"
                }`}
              >
                {link.live && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                )}
                {link.label}
              </Link>
            ))}
            <Link
              href="/favorites"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium ${
                pathname === "/favorites" ? accentBg : "text-slate-700 hover:bg-slate-900/5"
              }`}
            >
              Favorilər
            </Link>
            <Link
              href={compareHref}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium ${
                pathname.startsWith("/compare") ? accentBg : "text-slate-700 hover:bg-slate-900/5"
              }`}
            >
              Müqayisə
              {mounted && compareIds.length > 0 && (
                <span className="rounded-full bg-[#0057FF] px-2 py-0.5 text-xs font-semibold text-white">
                  {compareIds.length}
                </span>
              )}
            </Link>

            {/* "Elan ver" section in mobile menu */}
            <div className="mt-2 border-t border-slate-900/8 pt-3">
              <p className="mb-1.5 px-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Elan ver
              </p>
              {sellItems.map((item) =>
                item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-900/5"
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                ) : (
                  <div key={item.label} className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 opacity-50 cursor-not-allowed">
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide">Tezliklə</span>
                  </div>
                )
              )}
            </div>

            {/* Auth section */}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-900/8 pt-3">
              {userEmail ? (
                <>
                  <Link href="/me" onClick={() => setMenuOpen(false)} className="btn-secondary text-center">Profil</Link>
                  {(userRole === "admin" || userRole === "support") && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)} className="btn-secondary text-center">Admin paneli</Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void onLogout()}
                    disabled={logoutLoading}
                    className="btn-secondary w-full disabled:opacity-60"
                  >
                    {logoutLoading ? "Çıxılır..." : "Çıxış"}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-center">Qeydiyyat</Link>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-center">Daxil ol</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
