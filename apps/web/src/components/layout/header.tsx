"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCompare } from "@/components/compare/compare-context";

const navLinks: Array<{ href: string; label: string; live?: boolean }> = [
  { href: "/listings", label: "Elanlar" },
  { href: "/auction", label: "Auksion", live: true },
  { href: "/publish", label: "Elan yerləşdir" },
  { href: "/pricing", label: "Qiymətlər" },
  { href: "/dealer", label: "Salon paneli" },
  { href: "/favorites", label: "Favorilər" }
];

export function Header({ userEmail, userRole }: { userEmail?: string; userRole?: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { ids: compareIds } = useCompare();
  const compareHref = compareIds.length > 0 ? `/compare?ids=${compareIds.join(",")}` : "/compare";

  return (
    <header className="sticky top-0 z-50 border-b border-soft-brown bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo – Eko #3E2F28, Mobil #0891B2 */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0891B2] shadow-sm group-hover:bg-[#0e7490] transition">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h1l1-4h12l1 4h1a1 1 0 010 2h-.5M3 10a1 1 0 000 2h.5M6 14a2 2 0 104 0m4 0a2 2 0 104 0M6 14H5.5M14 14h.5" />
            </svg>
          </div>
          <span className="text-xl font-bold">
            <span className="text-[#3E2F28]">Eko</span><span className="text-[#0891B2]">Mobil</span>
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
              <Link href="/me" className="text-sm text-[#3E2F28] hover:text-[#0891B2]">
                Profil
              </Link>
              <span className="text-sm text-slate-500">{userEmail}</span>
              {userRole === "admin" || userRole === "support" ? (
                <Link href="/ops/reviews" className="btn-secondary text-xs px-3 py-1.5">
                  Ops
                </Link>
              ) : null}
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="btn-secondary text-xs px-3 py-1.5">
                  Çıxış
                </button>
              </form>
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
                  <Link href="/me" className="btn-secondary text-center">Profil</Link>
                  <form action="/api/auth/logout" method="POST">
                    <button type="submit" className="btn-secondary w-full">Çıxış</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/register" className="btn-secondary text-center">Qeydiyyat</Link>
                  <Link href="/login" className="btn-secondary text-center">Daxil ol</Link>
                  <Link href="/publish" className="btn-primary text-center">Elan yerləşdir</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
