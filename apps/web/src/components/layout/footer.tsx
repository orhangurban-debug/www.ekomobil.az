import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 bg-[#E5D3B3] border-t border-[#d4c4a8]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand – Eko #3E2F28, Mobil #0891B2 */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0891B2]">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h1l1-4h12l1 4h1a1 1 0 010 2h-.5M3 10a1 1 0 000 2h.5M6 14a2 2 0 104 0m4 0a2 2 0 104 0M6 14H5.5M14 14h.5" />
                </svg>
              </div>
              <span className="font-bold">
                <span className="text-[#3E2F28]">Eko</span><span className="text-[#0891B2]">Mobil</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-[#3E2F28]/80 leading-relaxed">
              Azərbaycanda etibar əsaslı avtomobil alqı-satqı platforması.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#3E2F28]">Platform</h4>
            <ul className="mt-3 space-y-2">
              {[
                { href: "/listings", label: "Elanlar" },
                { href: "/publish", label: "Elan yerləşdir" },
                { href: "/pricing", label: "Elan qiymətləri" },
                { href: "/dealer", label: "Salon paneli" }
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[#3E2F28]/80 hover:text-[#0891B2] transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#3E2F28]">Etibar</h4>
            <ul className="mt-3 space-y-2">
              {[
                { href: "/trust#vin-yoxlama", label: "VIN Məlumatı" },
                { href: "/trust#servis-tarixcesi", label: "Servis Tarixçəsi" },
                { href: "/trust#yurus-tesdigi", label: "Yürüş Təsdiqi" },
                { href: "/trust#qeza-arxivi", label: "Qəza Arxivi" }
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-[#3E2F28]/80 hover:text-[#0891B2] transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#3E2F28]">Hüquqi sənədlər</h4>
            <ul className="mt-3 space-y-2">
              {[
                { href: "/rules", label: "Qaydalar" },
                { href: "/terms", label: "İstifadə şərtləri" },
                { href: "/privacy", label: "Məxfilik siyasəti" }
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-[#3E2F28]/80 hover:text-[#0891B2] transition">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#3E2F28]">Əlaqə</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <a href="mailto:info@ekomobil.az" className="text-sm text-[#3E2F28]/80 hover:text-[#0891B2] transition">
                  info@ekomobil.az
                </a>
              </li>
              <li className="text-sm text-[#3E2F28]/80">Bakı, Azərbaycan</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-2 border-t border-[#d4c4a8] pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-[#3E2F28]/70">
            © {new Date().getFullYear()} EkoMobil. Bütün hüquqlar qorunur.
          </p>
        </div>
      </div>
    </footer>
  );
}
