import Link from "next/link";
import { Car, Gavel, Store, Wrench, ArrowRight } from "lucide-react";

const audiences = [
  {
    icon: Car,
    tone: "teal" as const,
    title: "Alıcılar",
    links: [
      { label: "Elanları bax", href: "/listings" },
      { label: "Auksion", href: "/auction" }
    ]
  },
  {
    icon: Store,
    tone: "sky" as const,
    title: "Satıcılar",
    links: [
      { label: "Elan ver", href: "/publish" },
      { label: "Qiymətlər", href: "/pricing" }
    ]
  },
  {
    icon: Gavel,
    tone: "rose" as const,
    title: "Auksion",
    links: [
      { label: "Canlı lotlar", href: "/auction" },
      { label: "Lot sat", href: "/auction/sell" }
    ]
  },
  {
    icon: Wrench,
    tone: "amber" as const,
    title: "Biznes & Salon",
    links: [
      { label: "Salonlar", href: "/dealers" },
      { label: "Servislər", href: "/services" }
    ]
  }
];

export function PlatformAudiences() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group flex flex-col rounded-2xl border border-slate-900/8 bg-white/70 p-5 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#0057FF]/25 hover:shadow-[0_12px_40px_rgba(0,87,255,0.08)]"
              >
                <div className={`icon-tile icon-tile-${item.tone} h-11 w-11 rounded-xl`}>
                  <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{item.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0057FF] transition group-hover:gap-1.5"
                    >
                      {link.label}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
