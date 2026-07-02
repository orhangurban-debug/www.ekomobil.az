import Link from "next/link";
import { Car, Gavel, Store, Wrench, ArrowRight } from "lucide-react";

const audiences = [
  {
    icon: Car,
    tone: "teal" as const,
    title: "Alıcılar üçün",
    desc: "VIN yoxlamalı elanlar, etibar xalı, qiymət analizi və müqayisə aləti ilə düzgün maşını tapın.",
    links: [
      { label: "Elanları bax", href: "/listings" },
      { label: "Auksion", href: "/auction" }
    ]
  },
  {
    icon: Store,
    tone: "sky" as const,
    title: "Satıcılar üçün",
    desc: "Pulsuz və ya premium planlarla elan yerləşdirin, irəli çəkin, statistika və sorğu idarə edin.",
    links: [
      { label: "Elan ver", href: "/publish" },
      { label: "Qiymətlər", href: "/pricing" }
    ]
  },
  {
    icon: Gavel,
    tone: "rose" as const,
    title: "Auksion iştirakçıları",
    desc: "Canlı sayğac, avtomatik təklif, depozit sistemi və tam hərrac tarixi ilə şəffaf alqı-satqı.",
    links: [
      { label: "Canlı lotlar", href: "/auction" },
      { label: "Lot sat", href: "/auction/sell" }
    ]
  },
  {
    icon: Wrench,
    tone: "amber" as const,
    title: "Salon & servis",
    desc: "Avtomobil salonu, ehtiyat hissə mağazası və ya servis — biznes profili, analitika və CRM.",
    links: [
      { label: "Salonlar", href: "/dealers" },
      { label: "Servislər", href: "/services" }
    ]
  }
];

export function PlatformAudiences() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0057FF]">Platforma imkanları</p>
          <h2 className="section-title mt-2">Hər kəs üçün bir həll</h2>
          <p className="section-subtitle mx-auto mt-2 max-w-2xl">
            EkoMobil yalnca elan saytı deyil — alıcı, satıcı, auksion iştirakçısı və biznes üçün tam ekosistemdir.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group flex flex-col rounded-2xl border border-slate-900/8 bg-white/70 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#0057FF]/25 hover:shadow-[0_16px_48px_rgba(0,87,255,0.1)]"
              >
                <div className={`icon-tile icon-tile-${item.tone} h-12 w-12 rounded-xl`}>
                  <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{item.desc}</p>
                <div className="mt-4 flex flex-wrap gap-2">
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
