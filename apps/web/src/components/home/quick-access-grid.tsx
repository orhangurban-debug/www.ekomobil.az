import Link from "next/link";

const QUICK_LINKS = [
  {
    href: "/listings",
    emoji: "🚗",
    label: "Elanlar",
    sub: "Alqı-satqı",
    color: "bg-[#0057FF]/8 hover:bg-[#0057FF]/14 border-[#0057FF]/15"
  },
  {
    href: "/auction",
    emoji: "🔨",
    label: "Auksion",
    sub: "Canlı lotlar",
    color: "bg-rose-500/8 hover:bg-rose-500/14 border-rose-500/15"
  },
  {
    href: "/dealers",
    emoji: "🏢",
    label: "Salonlar",
    sub: "Avtomobil satıcıları",
    color: "bg-sky-500/8 hover:bg-sky-500/14 border-sky-500/15"
  },
  {
    href: "/services?category=service_center",
    emoji: "🔧",
    label: "Servislər",
    sub: "Texniki xidmət",
    color: "bg-amber-500/8 hover:bg-amber-500/14 border-amber-500/15"
  },
  {
    href: "/services?category=expertise",
    emoji: "🔍",
    label: "Ekspertiza",
    sub: "Avtomobil qiymətləndirmə",
    color: "bg-emerald-500/8 hover:bg-emerald-500/14 border-emerald-500/15"
  },
  {
    href: "/services?category=mechanic",
    emoji: "🔩",
    label: "Ustalar",
    sub: "Müstəqil mexaniklər",
    color: "bg-violet-500/8 hover:bg-violet-500/14 border-violet-500/15"
  },
  {
    href: "/parts",
    emoji: "📦",
    label: "Ehtiyat hissə",
    sub: "SKU kataloqu",
    color: "bg-orange-500/8 hover:bg-orange-500/14 border-orange-500/15"
  },
  {
    href: "/services?category=car_wash",
    emoji: "✨",
    label: "Deteylinq",
    sub: "Yuma & bərpa",
    color: "bg-cyan-500/8 hover:bg-cyan-500/14 border-cyan-500/15"
  }
];

export function QuickAccessGrid() {
  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-4 md:grid-cols-8">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition ${item.color}`}
            >
              <span className="text-2xl leading-none" aria-hidden="true">{item.emoji}</span>
              <span className="text-xs font-semibold text-slate-900 leading-tight">{item.label}</span>
              <span className="hidden text-[10px] text-slate-500 leading-tight sm:block">{item.sub}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
