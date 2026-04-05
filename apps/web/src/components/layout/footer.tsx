import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-24 bg-[#E5D3B3] border-t border-[#d4c4a8]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand logo */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/brand/ekomobil-logo.png"
                alt="EkoMobil loqosu"
                width={1024}
                height={768}
                className="h-10 w-auto rounded-md border border-[#0891B2]/20 shadow-sm"
              />
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
                { href: "/parts", label: "Mağaza elanları" },
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
              <li>
                <Link href="/trust#support-request" className="text-sm text-[#3E2F28]/80 hover:text-[#0891B2] transition">
                  Müraciət göndər
                </Link>
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
