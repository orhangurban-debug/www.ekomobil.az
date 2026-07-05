import type { TrustBadge } from "@/lib/seller-trust";
import { computeTrustScore, trustTierLabel } from "@/lib/seller-trust";

const COLOR_MAP = {
  emerald: { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  amber:   { bar: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50 border-amber-200"     },
  slate:   { bar: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-50 border-slate-200"     },
};

/** Compact inline badges — for seller card on listing detail / public profile header */
export function TrustBadgeRow({ badges, max = 4 }: { badges: TrustBadge[]; max?: number }) {
  const shown = badges.slice(0, max);
  const rest  = badges.length - shown.length;

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((b) => (
        <span
          key={b.key}
          title={b.description}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 shadow-sm"
        >
          <span className="text-sm leading-none">{b.icon}</span>
          {b.label}
        </span>
      ))}
      {rest > 0 && (
        <span className="text-xs text-slate-400">+{rest}</span>
      )}
    </div>
  );
}

/** Score bar + tier label — for public profile header */
export function TrustScoreBar({ badges }: { badges: TrustBadge[] }) {
  const score  = computeTrustScore(badges);
  const tier   = trustTierLabel(score);
  const colors = COLOR_MAP[tier.color as keyof typeof COLOR_MAP];

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className={`font-semibold ${colors.text}`}>{tier.label}</span>
          <span className="text-slate-400">{score}/100</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100">
          <div
            className={`h-1.5 rounded-full transition-all ${colors.bar}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/** Full panel with score, badges, and missing items — for /me page */
export function TrustCompletenessPanel({
  badges,
  missing,
}: {
  badges: TrustBadge[];
  missing: { icon: string; label: string; href: string }[];
}) {
  const score  = computeTrustScore(badges);
  const tier   = trustTierLabel(score);
  const colors = COLOR_MAP[tier.color as keyof typeof COLOR_MAP];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">Profil etibarlılığı</h2>
      </div>

      <div className="p-5 space-y-4">
        {/* Score bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className={`font-semibold ${colors.text}`}>{tier.label}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${colors.bg} ${colors.text}`}>
              {score}/100
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full transition-all ${colors.bar}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Earned badges */}
        {badges.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Qazanılmış nişanlar</p>
            <div className="flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span
                  key={b.key}
                  title={b.description}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                >
                  <span>{b.icon}</span>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing items */}
        {missing.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Xalı artırmaq üçün
            </p>
            <div className="space-y-1.5">
              {missing.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 transition hover:border-[#0057FF]/30 hover:bg-[#0057FF]/3 hover:text-[#0057FF]"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  <span className="text-slate-300">→</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
