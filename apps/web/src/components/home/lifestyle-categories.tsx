import Link from "next/link";
import {
  CarFront,
  Zap,
  Car,
  CircleDollarSign,
  ShieldCheck,
  Gavel,
  Wrench,
  Truck,
  Star,
  type LucideIcon
} from "lucide-react";
import type { HomeCategory, HomeCategoryIcon } from "@/lib/home-content";
import { DEFAULT_HOME_CONTENT } from "@/lib/home-content";

const ICON_MAP: Record<HomeCategoryIcon, LucideIcon> = {
  suv: CarFront,
  electric: Zap,
  sedan: Car,
  budget: CircleDollarSign,
  vin: ShieldCheck,
  auction: Gavel,
  parts: Wrench,
  truck: Truck,
  star: Star
};

export function LifestyleCategories({ categories: categoriesProp }: { categories?: HomeCategory[] }) {
  const categories =
    categoriesProp && categoriesProp.length > 0 ? categoriesProp : DEFAULT_HOME_CONTENT.categories;

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
            const Icon = ICON_MAP[cat.icon] ?? Star;
            return (
              <Link key={cat.id} href={cat.href} className="category-card group">
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
