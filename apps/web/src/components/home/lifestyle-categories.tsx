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
  href: string;
  icon: LucideIcon;
  tone: CategoryTone;
  badge?: string;
}

const categories: LifestyleCategory[] = [
  {
    label: "SUV və krossover",
    href: "/listings?bodyType=SUV",
    icon: CarFront,
    tone: "sky"
  },
  {
    label: "Elektrik",
    href: "/listings?fuelType=Elektrik",
    icon: Zap,
    tone: "emerald"
  },
  {
    label: "Sedan",
    href: "/listings?bodyType=Sedan",
    icon: Car,
    tone: "violet"
  },
  {
    label: "10 000 ₼ altı",
    href: "/listings?maxPrice=10000",
    icon: CircleDollarSign,
    tone: "amber"
  },
  {
    label: "VIN Məlumatı",
    href: "/listings?vinProvided=1",
    icon: ShieldCheck,
    tone: "teal"
  },
  {
    label: "Auksion",
    href: "/auction",
    icon: Gavel,
    tone: "rose",
    badge: "Yeni"
  }
];

export function LifestyleCategories() {
  return (
    <section className="surface-muted py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="section-title">Kateqoriyalar</h2>
          <Link href="/listings" className="hidden text-sm font-medium text-[#0057FF] hover:underline sm:block">
            Hamısı →
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
                <div className="text-sm font-semibold text-slate-900">{cat.label}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
