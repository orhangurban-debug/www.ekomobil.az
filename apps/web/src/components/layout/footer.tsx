import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ContactActionButton } from "@/components/support/contact-action-button";

export function Footer({ logoUrl }: { logoUrl: string }) {
  return (
    <footer className="mt-24 border-t border-slate-900/8 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <BrandLogo logoUrl={logoUrl} size="footer" />
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platforma</h4>
            <ul className="mt-3 space-y-2">
              {[
                { href: "/listings", label: "Elanlar" },
                { href: "/parts", label: "Mağaza elanları" },
                { href: "/services", label: "Servislər və ustalar" },
                { href: "/publish", label: "Elan yerləşdir" },
                { href: "/pricing", label: "Elan qiymətləri" },
                { href: "/dealers", label: "Salonlar" },
                { href: "/advertise", label: "Reklam ver" }
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-500 transition hover:text-[#0057FF]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Etibar</h4>
            <ul className="mt-3 space-y-2">
              {[
                { href: "/trust#vin-yoxlama", label: "VIN Məlumatı" },
                { href: "/trust#servis-tarixcesi", label: "Servis Tarixçəsi" },
                { href: "/trust#yurus-tesdigi", label: "Yürüş Təsdiqi" },
                { href: "/trust#qeza-arxivi", label: "Qəza Arxivi" }
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-500 transition hover:text-[#0057FF]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hüquqi sənədlər</h4>
            <ul className="mt-3 space-y-2">
              {[
                { href: "/rules", label: "Qaydalar" },
                { href: "/terms", label: "İstifadə şərtləri" },
                { href: "/privacy", label: "Məxfilik siyasəti" },
                { href: "/legal", label: "Hüquqi məlumat" },
                { href: "/refund-policy", label: "Geri qaytarma siyasəti" }
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-500 transition hover:text-[#0057FF]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Əlaqə</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <ContactActionButton intent="support" className="text-sm text-slate-500 transition hover:text-[#0057FF] !bg-transparent !border-0 !p-0 !shadow-none font-normal" variant="link" />
              </li>
              <li className="text-sm text-slate-500">Bakı, Azərbaycan</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-2 border-t border-slate-900/8 pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} EkoMobil. Bütün hüquqlar qorunur.
          </p>
        </div>
      </div>
    </footer>
  );
}
