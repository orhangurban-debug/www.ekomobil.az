"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useCompare } from "@/components/compare/compare-context";

const GLOBAL_NOTICE_VERSION = "v2";
const GLOBAL_NOTICE_STORAGE_KEY = `ekomobil_global_notice_hidden_${GLOBAL_NOTICE_VERSION}`;

const navLinks: Array<{ href: string; label: string; live?: boolean }> = [
  { href: "/listings", label: "Elanlar" },
  { href: "/parts", label: "Mağaza" },
  { href: "/auction", label: "Auksion", live: true },
  { href: "/pricing", label: "Qiymətlər" },
  { href: "/dealer", label: "Salon paneli" },
  { href: "/favorites", label: "Favorilər" }
];

export function Header({
  userEmail,
  userRole,
  logoUrl
}: {
  userEmail?: string;
  userRole?: string;
  logoUrl: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(GLOBAL_NOTICE_STORAGE_KEY) !== "1";
  });
  const { ids: compareIds } = useCompare();
  const compareHref = compareIds.length > 0 ? `/compare?ids=${compareIds.join(",")}` : "/compare";

  function hideNotice() {
    setNoticeVisible(false);
    window.localStorage.setItem(GLOBAL_NOTICE_STORAGE_KEY, "1");
  }

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
    <header className="sticky top-0 z-50 border-b border-soft-brown bg-white">
      {noticeVisible && (
        <div className="border-b border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="mx-auto flex max-w-7xl items-start justify-between gap-3 px-4 py-2.5 text-xs text-amber-900 sm:px-6 lg:px-8">
            <p className="leading-5">
              <span className="font-semibold">Diqqət:</span> Platforma hələ tam aktiv deyil. Yanlış əməliyyatların
              qarşısını almaq üçün qeydiyyat, ödəniş və auksion funksiyaları mərhələli şəkildə açılır. Zəhmət olmasa
              hələ ödəniş etməyin —{" "}
              <span className="font-semibold">EkoMobil tezliklə tam istifadəyə veriləcək.</span>{" "}
              Yeniliklər üçün{" "}
              <Link href="/pricing" className="font-semibold underline decoration-dotted underline-offset-2">
                Qiymətlər
              </Link>{" "}
              və{" "}
              <Link href="/terms" className="font-semibold underline decoration-dotted underline-offset-2">
                Şərtlər
              </Link>{" "}
              səhifələrini izləyin.
            </p>
            <button
              type="button"
              onClick={hideNotice}
              aria-label="Bildirişi bağla"
              className="shrink-0 rounded-md border border-amber-400/50 bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-amber-900 transition hover:bg-white"
            >
              Bağla
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brend loqo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="brand-logo-surface brand-logo-surface-light transition group-hover:border-[#0891B2]/40">
            <Image
              src={logoUrl}
              alt="EkoMobil loqosu"
              width={144}
              height={40}
              unoptimized
              className="h-10 w-auto rounded-md object-contain"
            />
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-[#0891B2]/10 text-[#0891B2]"
                  : "text-[#3E2F28] hover:bg-[#E5D3B3]/30 hover:text-[#0891B2]"
              }`}
            >
              {link.live && (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
              {link.label}
            </Link>
          ))}
          <Link
            href={compareHref}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition flex items-center gap-1.5 ${
              pathname.startsWith("/compare")
                ? "bg-[#0891B2]/10 text-[#0891B2]"
                : "text-[#3E2F28] hover:bg-[#E5D3B3]/30 hover:text-[#0891B2]"
            }`}
          >
            Müqayisə
            {compareIds.length > 0 && (
              <span className="min-w-[1.25rem] rounded-full bg-[#0891B2] px-1.5 py-0.5 text-xs font-semibold text-white">
                {compareIds.length}
              </span>
            )}
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {userEmail ? (
            <div className="hidden md:flex items-center gap-3">
              <Link href="/publish" className="btn-primary text-sm px-4 py-2">
                Elan yerləşdir
              </Link>
              <Link href="/me" className="text-sm text-[#3E2F28] hover:text-[#0891B2]">
                Profil
              </Link>
              {userRole === "admin" || userRole === "support" ? (
                <Link href="/admin" className="btn-secondary text-xs px-3 py-1.5">
                  Admin
                </Link>
              ) : null}
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
              <Link href="/register" className="btn-secondary text-sm">
                Qeydiyyat
              </Link>
              <Link href="/login" className="btn-secondary text-sm">
                Daxil ol
              </Link>
              <Link href="/publish" className="btn-primary text-sm">
                Elan yerləşdir
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-soft-brown md:hidden text-[#3E2F28]"
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
        <div className="border-t border-soft-brown bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium ${
                  pathname === link.href ? "bg-[#0891B2]/10 text-[#0891B2]" : "text-[#3E2F28] hover:bg-[#E5D3B3]/30"
                }`}
              >
                {link.live && (
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                )}
                {link.label}
              </Link>
            ))}
            <Link
              href={compareHref}
              onClick={() => setMenuOpen(false)}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium flex items-center justify-between ${
                pathname.startsWith("/compare") ? "bg-[#0891B2]/10 text-[#0891B2]" : "text-[#3E2F28] hover:bg-[#E5D3B3]/30"
              }`}
            >
              Müqayisə
              {compareIds.length > 0 && (
                <span className="rounded-full bg-[#0891B2] px-2 py-0.5 text-xs font-semibold text-white">
                  {compareIds.length}
                </span>
              )}
            </Link>
            <div className="mt-2 flex flex-col gap-2 border-t border-soft-brown pt-2">
              {userEmail ? (
                <>
                  <Link href="/publish" onClick={() => setMenuOpen(false)} className="btn-primary text-center">Elan yerləşdir</Link>
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
                  <Link href="/register" onClick={() => setMenuOpen(false)} className="btn-secondary text-center">Qeydiyyat</Link>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-center">Daxil ol</Link>
                  <Link href="/publish" onClick={() => setMenuOpen(false)} className="btn-primary text-center">Elan yerləşdir</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
