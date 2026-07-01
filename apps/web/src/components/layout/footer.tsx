import Link from "next/link";
import Image from "next/image";
import { ContactActionButton } from "@/components/support/contact-action-button";

export function Footer({ logoUrl }: { logoUrl: string }) {
  return (
    <footer className="mt-24 border-t border-white/10 bg-[#0a0a0f]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="brand-logo-surface brand-logo-surface-soft">
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
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">Platforma</h4>
            <ul className="mt-3 space-y-2">
              {[
                { href: "/listings", label: "Elanlar" },
                { href: "/parts", label: "Mağaza elanları" },
                { href: "/services", label: "Servislər və ustalar" },
                { href: "/publish", label: "Elan yerləşdir" },
                { href: "/pricing", label: "Elan qiymətləri" },
                { href: "/dealers", label: "Salonlar" }
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 transition hover:text-[#0057FF]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">Etibar</h4>
            <ul className="mt-3 space-y-2">
              {[
                { href: "/trust#vin-yoxlama", label: "VIN Məlumatı" },
                { href: "/trust#servis-tarixcesi", label: "Servis Tarixçəsi" },
                { href: "/trust#yurus-tesdigi", label: "Yürüş Təsdiqi" },
                { href: "/trust#qeza-arxivi", label: "Qəza Arxivi" }
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/60 transition hover:text-[#0057FF]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">Hüquqi sənədlər</h4>
            <ul className="mt-3 space-y-2">
              {[
                { href: "/rules", label: "Qaydalar" },
                { href: "/terms", label: "İstifadə şərtləri" },
                { href: "/privacy", label: "Məxfilik siyasəti" },
                { href: "/legal", label: "Hüquqi məlumat" },
                { href: "/refund-policy", label: "Geri qaytarma siyasəti" }
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/60 transition hover:text-[#0057FF]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">Əlaqə</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <ContactActionButton intent="support" className="text-sm text-white/60 transition hover:text-[#0057FF] !bg-transparent !border-0 !p-0 !shadow-none font-normal" variant="link" />
              </li>
              <li className="text-sm text-white/60">Bakı, Azərbaycan</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-2 border-t border-white/10 pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} EkoMobil. Bütün hüquqlar qorunur.
          </p>
        </div>
      </div>
    </footer>
  );
}
