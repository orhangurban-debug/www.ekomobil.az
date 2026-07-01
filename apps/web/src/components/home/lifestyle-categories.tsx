import Link from "next/link";
import {
  CarFront,
  Zap,
  Car,
  CircleDollarSign,
  ShieldCheck,
  Gavel,
  type LucideIcon
} from "lucide-react";

type CategoryTone = "sky" | "emerald" | "violet" | "amber" | "teal" | "rose";

interface LifestyleCategory {
  label: string;
  sub: string;
  href: string;
  icon: LucideIcon;
  tone: CategoryTone;
  badge?: string;
}

const categories: LifestyleCategory[] = [
  {
    label: "SUV & Krossover",
    sub: "Ailə üçün ideal",
    href: "/listings?bodyType=SUV",
    icon: CarFront,
    tone: "sky"
  },
  {
    label: "Elektrik",
    sub: "Sıfır emissiya",
    href: "/listings?fuelType=Elektrik",
    icon: Zap,
    tone: "emerald"
  },
  {
    label: "Sedan",
    sub: "Klassik zövq",
    href: "/listings?bodyType=Sedan",
    icon: Car,
    tone: "violet"
  },
  {
    label: "10 000 ₼ altı",
    sub: "Sərfəli seçimlər",
    href: "/listings?maxPrice=10000",
    icon: CircleDollarSign,
    tone: "amber"
  },
  {
    label: "VIN Məlumatı",
    sub: "VIN təqdim edilmiş elanlar",
    href: "/listings?vinProvided=1",
    icon: ShieldCheck,
    tone: "teal"
  },
  {
    label: "Auksion",
    sub: "Canlı hərrac",
    href: "/auction",
    icon: Gavel,
    tone: "rose",
    badge: "Yeni"
  }
];

export function LifestyleCategories() {
  return (
    <section className="surface-muted py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="section-title">Nə axtarırsınız?</h2>
            <p className="section-subtitle mt-1">Həyat tərzinizə uyğun kateqoriyanı seçin</p>
          </div>
          <Link href="/listings" className="hidden text-sm font-medium text-brand-600 hover:underline sm:block">
            Bütün elanlar →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.label} href={cat.href} className="category-card group">
                {cat.badge && <span className="category-badge">{cat.badge}</span>}
                <div className={`icon-tile icon-tile-${cat.tone}`}>
                  <Icon className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
                </div>
                <div className="mt-1 text-center">
                  <div className="text-sm font-semibold text-slate-900">{cat.label}</div>
                  <div className="mt-0.5 text-xs leading-snug text-slate-500">{cat.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
