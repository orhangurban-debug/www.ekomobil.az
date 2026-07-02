import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface PagePublishStripProps {
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  icon: LucideIcon;
  tone?: "teal" | "violet" | "amber" | "rose";
}

export function PagePublishStrip({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  icon: Icon,
  tone = "teal"
}: PagePublishStripProps) {
  const showPrimary = Boolean(primaryLabel && primaryHref);
  const showSecondary = Boolean(secondaryLabel && secondaryHref);
  const showActions = showPrimary || showSecondary;

  return (
    <div className="publish-strip">
      <div className={`icon-tile icon-tile-${tone} shrink-0`}>
        <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
      {showActions && (
        <div className="flex shrink-0 flex-wrap gap-2">
          {showPrimary && (
            <Link href={primaryHref!} className="btn-primary text-sm">
              {primaryLabel}
            </Link>
          )}
          {showSecondary && (
            <Link href={secondaryHref!} className="btn-secondary text-sm">
              {secondaryLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
