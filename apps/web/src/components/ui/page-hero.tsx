import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  actions?: ReactNode;
  variant?: "light" | "dark";
}

export function PageHero({ title, subtitle, icon: Icon, badge, actions, variant = "dark" }: PageHeroProps) {
  const isDark = variant === "dark";

  return (
    <div className={isDark ? "page-hero page-hero-dark" : "page-hero"}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            {Icon && (
              <div className={`icon-tile shrink-0 ${isDark ? "icon-tile-teal" : "icon-tile-teal"}`}>
                <Icon className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
              </div>
            )}
            <div>
              {badge && (
                <span className={`mb-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${isDark ? "bg-[#0057FF]/15 text-[#93c5fd]" : "bg-brand-50 text-brand-700"}`}>
                  {badge}
                </span>
              )}
              <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${isDark ? "text-white" : "text-slate-900"}`}>
                {title}
              </h1>
              {subtitle && (
                <p className={`mt-1.5 text-sm sm:text-base ${isDark ? "text-white/65" : "text-slate-500"}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
