import Link from "next/link";
import { listListings } from "@/server/listing-store";
import { getCarInsights, getBrandContext, type CarModelInsights, type BrandContext } from "@/lib/car-insights";
import { generateCarInsightsAi } from "@/lib/ai/gemini";
import { getPowertrainInfo, hasElectricComponent, requiresCharging, POWERTRAIN_CATALOG, type PowertrainCategory } from "@/lib/powertrain-types";
import type { ListingSummary } from "@/lib/marketplace-types";

// ── Helpers ───────────────────────────────────────────────────────────────

function RatingBar({ value, max = 10, color = "#0891B2" }: { value: number; max?: number; color?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 overflow-hidden rounded-full bg-slate-100" style={{ height: 6 }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-6 text-right text-xs font-bold tabular-nums text-slate-700">{value}</span>
    </div>
  );
}

function MaintenanceBadge({ cost }: { cost: CarModelInsights["maintenanceCost"] }) {
  const map: Record<CarModelInsights["maintenanceCost"], { label: string; cls: string }> = {
    "aşağı": { label: "Aşağı", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    "orta": { label: "Orta", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    "yüksək": { label: "Yüksək", cls: "bg-orange-50 text-orange-700 border-orange-200" },
    "çox yüksək": { label: "Çox yüksək", cls: "bg-red-50 text-red-700 border-red-200" }
  };
  const { label, cls } = map[cost];
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function SatisfactionArc({ pct }: { pct: number }) {
  const color = pct >= 85 ? "#10b981" : pct >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
      </div>
      <span className="text-[10px] text-slate-400">Sahibkar məmnuniyyəti</span>
    </div>
  );
}

// Highlight which value is "better" in a numeric comparison
function compareNumeric(values: number[]): ("better" | "worse" | "equal")[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) return values.map(() => "equal");
  return values.map((v) => (v === max ? "better" : v === min ? "worse" : "equal"));
}

function compareNumericLow(values: number[]): ("better" | "worse" | "equal")[] {
  // Lower is better (e.g. price, mileage)
  const result = compareNumeric(values);
  return result.map((r) => (r === "better" ? "worse" : r === "worse" ? "better" : "equal"));
}

// ── Section wrapper ───────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
        <span className="text-[#0891B2]">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ── Column header ─────────────────────────────────────────────────────────

function CarHeader({ item }: { item: ListingSummary }) {
  const trustColor = item.trustScore >= 80 ? "text-emerald-600" : item.trustScore >= 60 ? "text-amber-600" : "text-red-500";
  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      <Link
        href={`/listings/${item.id}`}
        className="text-sm font-semibold leading-tight text-slate-900 hover:text-[#0891B2] transition-colors"
      >
        {item.title}
      </Link>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{item.city}</span>
        {item.vinVerified && (
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">VIN ✓</span>
        )}
        {item.planType === "vip" && (
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">VIP</span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold text-[#0891B2]">{item.priceAzn.toLocaleString()} ₼</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${item.trustScore >= 80 ? "bg-emerald-500" : item.trustScore >= 60 ? "bg-amber-500" : "bg-red-400"}`}
            style={{ width: `${item.trustScore}%` }}
          />
        </div>
        <span className={`text-xs font-semibold ${trustColor}`}>Etibar {item.trustScore}/100</span>
      </div>
    </div>
  );
}

// ── Spec row ──────────────────────────────────────────────────────────────

function SpecRow({
  label,
  values,
  highlight
}: {
  label: string;
  values: string[];
  highlight?: ("better" | "worse" | "equal")[];
}) {
  return (
    <tr className="border-b border-slate-50 last:border-0">
      <td className="py-3 pl-5 pr-4 text-xs font-medium text-slate-400 w-28">{label}</td>
      {values.map((val, i) => {
        const h = highlight?.[i];
        return (
          <td
            key={i}
            className={`py-3 px-4 text-sm font-semibold ${
              h === "better" ? "text-emerald-700" : h === "worse" ? "text-red-500" : "text-slate-900"
            }`}
          >
            {h === "better" && <span className="mr-1 text-emerald-500">▲</span>}
            {h === "worse" && <span className="mr-1 text-red-400">▼</span>}
            {val}
          </td>
        );
      })}
    </tr>
  );
}

// ── Rating comparison row ─────────────────────────────────────────────────

function RatingRow({
  label,
  values,
  colors
}: {
  label: string;
  values: (number | undefined)[];
  colors: string[];
}) {
  return (
    <div className="grid items-center py-3" style={{ gridTemplateColumns: `7rem repeat(${values.length}, 1fr)` }}>
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {values.map((v, i) =>
        v !== undefined ? (
          <div key={i} className="px-3">
            <RatingBar value={v} color={colors[i]} />
          </div>
        ) : (
          <div key={i} className="px-3 text-xs text-slate-300">—</div>
        )
      )}
    </div>
  );
}

// ── List column ───────────────────────────────────────────────────────────

function ListColumn({
  items,
  variant
}: {
  items: string[];
  variant: "strength" | "weakness" | "problem";
}) {
  const styles = {
    strength: { dot: "bg-emerald-500", text: "text-slate-700" },
    weakness: { dot: "bg-amber-500", text: "text-slate-700" },
    problem: { dot: "bg-red-400", text: "text-slate-700" }
  }[variant];

  if (!items.length) return <p className="text-xs text-slate-300 px-4 py-2">Məlumat yoxdur</p>;

  return (
    <ul className="space-y-2 px-4 py-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} />
          <span className={`text-xs leading-relaxed ${styles.text}`}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Verdict card ──────────────────────────────────────────────────────────

const TIER_LABELS: Record<BrandContext["reliabilityTier"], { label: string; cls: string }> = {
  top: { label: "Ən yüksək", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  above_avg: { label: "Ortanın üstü", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  average: { label: "Orta", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  below_avg: { label: "Ortanın altı", cls: "bg-red-50 text-red-700 border-red-200" }
};

function VerdictCard({
  item,
  insight,
  brandCtx,
  rank
}: {
  item: ListingSummary;
  insight: CarModelInsights | null;
  brandCtx: BrandContext | null;
  rank: number;
}) {
  const isFirst = rank === 0;
  return (
    <div
      className={`flex-1 rounded-2xl border p-5 ${
        isFirst ? "border-[#0891B2] bg-[#0891B2]/5" : "border-slate-200 bg-white"
      }`}
    >
      {isFirst && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#0891B2] px-3 py-1 text-xs font-semibold text-white">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Tövsiyə edilən seçim
        </div>
      )}
      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
      {insight ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{insight.verdict}</p>
      ) : brandCtx ? (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Marka etibarlılığı:</span>
            <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${TIER_LABELS[brandCtx.reliabilityTier].cls}`}>
              {TIER_LABELS[brandCtx.reliabilityTier].label}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">{brandCtx.note}</p>
        </div>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-slate-400 italic">Bu model üçün beynəlxalq analiz məlumatı hələ əlavə edilməyib.</p>
      )}
      <Link
        href={`/listings/${item.id}`}
        className={`mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          isFirst
            ? "bg-[#0891B2] text-white hover:bg-[#0e7490]"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        Elana bax →
      </Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default async function ComparePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const ids = typeof params.ids === "string" ? params.ids.split(",").filter(Boolean) : [];
  const result = await listListings({ compareIds: ids, page: 1, pageSize: 50, sort: "trust_desc" });
  const items = ids.length > 0 ? result.items.filter((item) => ids.includes(item.id)) : [];

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-16 text-center">
        <div className="w-full rounded-2xl border border-dashed border-slate-200 p-12">
          <svg className="mx-auto mb-4 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h1 className="text-xl font-bold text-slate-900">Müqayisə üçün elan seçilməyib</h1>
          <p className="mt-2 text-sm text-slate-500">
            Elan kartındakı <strong>"Müqayisə et"</strong> düyməsi ilə 2–4 avtomobil seçin.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Seçilmiş modellər üçün texniki məlumat, etibarlılıq analizi, zəif nöqtələr və beynəlxalq sahibkar statistikası göstəriləcək.
          </p>
          <Link href="/listings" className="btn-primary mt-6 inline-flex">
            Elanlara bax
          </Link>
        </div>
      </div>
    );
  }

  // Fetch insights: 1) static DB  2) AI generation  3) brand-level fallback
  const insightsData: (CarModelInsights | null)[] = await Promise.all(
    items.map(async (item) => {
      const static_ = getCarInsights(item.make, item.model, item.year);
      if (static_) return static_;
      // Try AI generation for models not in static DB
      const ai = await generateCarInsightsAi(item.make, item.model, item.year);
      return ai;
    })
  );
  const brandContexts = items.map((item, i) =>
    insightsData[i] === null ? getBrandContext(item.make) : null
  );

  // Column accent colors
  const COLORS = ["#0891B2", "#7c3aed", "#d97706", "#16a34a"];

  // Sort by trust score to determine "best" for verdict
  const ranked = [...items].map((item, i) => ({ item, insight: insightsData[i], i }))
    .sort((a, b) => {
      const aScore = (a.insight?.ratings.reliability ?? 0) * 2 + a.item.trustScore / 10;
      const bScore = (b.insight?.ratings.reliability ?? 0) * 2 + b.item.trustScore / 10;
      return bScore - aScore;
    });

  const rankOrder = ranked.map((r) => r.i);

  const priceHl = compareNumericLow(items.map((i) => i.priceAzn));
  const mileageHl = compareNumericLow(items.map((i) => i.mileageKm));
  const trustHl = compareNumeric(items.map((i) => i.trustScore));
  const yearHl = compareNumeric(items.map((i) => i.year));

  const colCount = items.length;
  const gridTemplate = `7rem repeat(${colCount}, 1fr)`;

  const ratingKeys: Array<{ key: keyof CarModelInsights["ratings"]; label: string }> = [
    { key: "reliability", label: "Etibarlılıq" },
    { key: "comfort", label: "Konfort" },
    { key: "performance", label: "Dinamika" },
    { key: "economy", label: "Yanacaq qənaəti" },
    { key: "safety", label: "Təhlükəsizlik" }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Dərin müqayisə analizi</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                {items.length} avtomobil · Texniki məlumat, beynəlxalq etibarlılıq statistikası, zəif nöqtələr
              </p>
              {insightsData.some((d, i) => d !== null && !getCarInsights(items[i]?.make ?? "", items[i]?.model ?? "", items[i]?.year ?? 0)) && (
                <p className="mt-1 flex items-center gap-1 text-xs text-violet-600">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Bəzi modellər üçün analitika AI tərəfindən yaradılıb
                </p>
              )}
            </div>
            <Link href="/listings" className="btn-secondary hidden shrink-0 text-sm sm:inline-flex">
              ← Elanlara qayıt
            </Link>
          </div>

          {/* Car headers strip */}
          <div className="mt-6 grid gap-3" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
            {items.map((item, i) => (
              <div
                key={item.id}
                className="rounded-2xl border bg-white shadow-sm"
                style={{ borderColor: `${COLORS[i]}40` }}
              >
                <div
                  className="rounded-t-2xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: COLORS[i] }}
                >
                  Avtomobil {i + 1}
                </div>
                <CarHeader item={item} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">

        {/* ── 1. Elan spesifikasiyaları ───────────────────────────────────── */}
        <Section
          title="Elan spesifikasiyaları"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        >
          <table className="w-full text-sm">
            <tbody>
              <SpecRow label="Qiymət" values={items.map((i) => `${i.priceAzn.toLocaleString()} ₼`)} highlight={priceHl} />
              <SpecRow label="İl" values={items.map((i) => String(i.year))} highlight={yearHl} />
              <SpecRow label="Yürüş" values={items.map((i) => `${i.mileageKm.toLocaleString()} km`)} highlight={mileageHl} />
              <SpecRow label="Etibar" values={items.map((i) => `${i.trustScore}/100`)} highlight={trustHl} />
              <SpecRow label="Yanacaq" values={items.map((i) => i.fuelType)} />
              <SpecRow label="Ötürücü" values={items.map((i) => i.transmission)} />
              <SpecRow label="Kuzov" values={items.map((i) => i.bodyType ?? "—")} />
              <SpecRow label="Şəhər" values={items.map((i) => i.city)} />
              <SpecRow label="VIN" values={items.map((i) => (i.vinVerified ? "Bəli ✓" : "Xeyr"))} highlight={items.map((i) => (i.vinVerified ? "better" : "equal"))} />
              <SpecRow label="Satıcı" values={items.map((i) => (i.sellerVerified ? "Doğrulanmış" : "Doğrulanmamış"))} />
            </tbody>
          </table>
          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
            <p className="text-xs text-slate-400">
              <span className="mr-3 font-semibold text-emerald-600">▲ Daha yaxşı</span>
              <span className="font-semibold text-red-500">▼ Daha zəif</span>
              <span className="ml-3">Qiymət və yürüş üçün aşağı dəyər üstünlük hesab olunur.</span>
            </p>
          </div>
        </Section>

        {/* ── 2. Güc sistemi və yanacaq sərfiyyatı ────────────────────────── */}
        {insightsData.some((d) => d?.powertrain) && (() => {
          // Collect unique powertrain categories present in this comparison
          const presentCategories = [...new Set(
            insightsData.map((d) => d?.powertrain?.category).filter(Boolean) as PowertrainCategory[]
          )];
          const hasElectric = presentCategories.some(hasElectricComponent);
          const hasCharging = presentCategories.some(requiresCharging);

          return (
            <Section
              title="Güc sistemi və enerji sərfiyyatı"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            >
              {/* Powertrain type badges */}
              <div className="grid divide-x divide-slate-100 border-b border-slate-100" style={{ gridTemplateColumns: `7rem repeat(${colCount}, 1fr)` }}>
                <span className="pl-5 py-3 text-xs font-medium text-slate-400 flex items-center">Güc sistemi</span>
                {items.map((_, i) => {
                  const pt = insightsData[i]?.powertrain;
                  if (!pt) return <div key={i} className="px-4 py-3 text-xs text-slate-300 italic">—</div>;
                  const info = getPowertrainInfo(pt.category);
                  return (
                    <div key={i} className="px-4 py-3 flex items-center gap-2">
                      <span className="text-base">{info.icon}</span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                        style={{ backgroundColor: info.color }}
                      >
                        {info.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* System power */}
              <div className="grid divide-x divide-slate-100 border-b border-slate-100" style={{ gridTemplateColumns: `7rem repeat(${colCount}, 1fr)` }}>
                <span className="pl-5 py-2.5 text-xs font-medium text-slate-400 flex items-center">Sistem gücü</span>
                {items.map((_, i) => {
                  const hp = insightsData[i]?.powertrain?.systemPowerHp;
                  return (
                    <div key={i} className="px-4 py-2.5 text-sm font-medium text-slate-700">
                      {hp ? `${hp} hp` : "—"}
                    </div>
                  );
                })}
              </div>

              {/* Engine displacement (for ICE) */}
              {insightsData.some((d) => d?.powertrain?.engineCc) && (
                <div className="grid divide-x divide-slate-100 border-b border-slate-100" style={{ gridTemplateColumns: `7rem repeat(${colCount}, 1fr)` }}>
                  <span className="pl-5 py-2.5 text-xs font-medium text-slate-400 flex items-center">Mühərrik həcmi</span>
                  {items.map((_, i) => {
                    const cc = insightsData[i]?.powertrain?.engineCc;
                    return (
                      <div key={i} className="px-4 py-2.5 text-sm text-slate-700">
                        {cc ? `${(cc / 1000).toFixed(1)} L (${cc} cc)` : "—"}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fuel consumption */}
              <div className="grid divide-x divide-slate-100 border-b border-slate-100" style={{ gridTemplateColumns: `7rem repeat(${colCount}, 1fr)` }}>
                <span className="pl-5 py-2.5 text-xs font-medium text-slate-400 flex items-center">Kombinədir</span>
                {items.map((_, i) => {
                  const fc = insightsData[i]?.powertrain?.fuelConsumption;
                  if (!fc) return <div key={i} className="px-4 py-2.5 text-xs text-slate-300 italic">—</div>;
                  const isEV = fc.unit === "kWh/100km";
                  return (
                    <div key={i} className="px-4 py-2.5">
                      <span className="text-sm font-semibold text-slate-800">
                        {fc.combined} {fc.unit}
                      </span>
                      {fc.evOnlyCombined && (
                        <div className="mt-0.5 text-[11px] text-violet-600">
                          EV: {fc.evOnlyCombined} kWh/100km
                        </div>
                      )}
                      {!isEV && fc.city && fc.highway && (
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          Ş: {fc.city} · M: {fc.highway}
                        </div>
                      )}
                      {fc.testCycle && (
                        <div className="text-[10px] text-slate-300">{fc.testCycle}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Electric range & charging for PHEV/BEV */}
              {hasCharging && (
                <>
                  <div className="grid divide-x divide-slate-100 border-b border-slate-100" style={{ gridTemplateColumns: `7rem repeat(${colCount}, 1fr)` }}>
                    <span className="pl-5 py-2.5 text-xs font-medium text-slate-400 flex items-center">Elektrik diapazonu</span>
                    {items.map((_, i) => {
                      const ch = insightsData[i]?.powertrain?.charging;
                      return (
                        <div key={i} className="px-4 py-2.5 text-sm font-semibold" style={{ color: ch?.electricRangeKm ? "#0891B2" : "#94a3b8" }}>
                          {ch?.electricRangeKm ? `${ch.electricRangeKm} km` : "—"}
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid divide-x divide-slate-100 border-b border-slate-100" style={{ gridTemplateColumns: `7rem repeat(${colCount}, 1fr)` }}>
                    <span className="pl-5 py-2.5 text-xs font-medium text-slate-400 flex items-center">Batareya</span>
                    {items.map((_, i) => {
                      const ch = insightsData[i]?.powertrain?.charging;
                      return (
                        <div key={i} className="px-4 py-2.5 text-sm text-slate-700">
                          {ch?.batteryKwh ? `${ch.batteryKwh} kWh` : "—"}
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid divide-x divide-slate-100 border-b border-slate-100" style={{ gridTemplateColumns: `7rem repeat(${colCount}, 1fr)` }}>
                    <span className="pl-5 py-2.5 text-xs font-medium text-slate-400 flex items-center">DC şarj (peak)</span>
                    {items.map((_, i) => {
                      const ch = insightsData[i]?.powertrain?.charging;
                      return (
                        <div key={i} className="px-4 py-2.5 text-sm text-slate-700">
                          {ch?.fastChargeKw ? `${ch.fastChargeKw} kW` : "—"}
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid divide-x divide-slate-100 border-b border-slate-100" style={{ gridTemplateColumns: `7rem repeat(${colCount}, 1fr)` }}>
                    <span className="pl-5 py-2.5 text-xs font-medium text-slate-400 flex items-center">10→80% şarj</span>
                    {items.map((_, i) => {
                      const ch = insightsData[i]?.powertrain?.charging;
                      return (
                        <div key={i} className="px-4 py-2.5 text-sm text-slate-700">
                          {ch?.charge10to80Min ? `~${ch.charge10to80Min} dəq` : "—"}
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid divide-x divide-slate-100" style={{ gridTemplateColumns: `7rem repeat(${colCount}, 1fr)` }}>
                    <span className="pl-5 py-2.5 text-xs font-medium text-slate-400 flex items-center">Konnektoru</span>
                    {items.map((_, i) => {
                      const ch = insightsData[i]?.powertrain?.charging;
                      const connLabel: Record<string, string> = {
                        "CCS": "CCS Combo2", "CHAdeMO": "CHAdeMO", "Type2": "AC Type2",
                        "Tesla-NACS": "Tesla NACS", "Type1": "AC Type1", "GB/T": "GB/T (Çin)"
                      };
                      return (
                        <div key={i} className="px-4 py-2.5 text-xs text-slate-600">
                          {ch?.connectorType ? (connLabel[ch.connectorType] ?? ch.connectorType) : "—"}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Technology education panel */}
              {hasElectric && presentCategories.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-600">Güc sistemi texnologiyaları haqqında:</p>
                  {presentCategories.map((cat) => {
                    const info = getPowertrainInfo(cat);
                    return (
                      <div key={cat} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm">{info.icon}</span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                            style={{ backgroundColor: info.color }}
                          >
                            {info.label}
                          </span>
                          <span className="text-xs font-medium text-slate-600">{info.fullName}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{info.howItWorks}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {info.pros.slice(0, 2).map((p) => (
                            <span key={p} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">✓ {p}</span>
                          ))}
                          {info.cons.slice(0, 1).map((c) => (
                            <span key={c} className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] text-red-600">✗ {c}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-slate-400">
                    Yanacaq sərfiyyatı WLTP/EPA sınaq şəraitinə əsaslanır. Real həyat sərfiyyatı sürüş tərzindən 10–25% yüksək ola bilər.
                  </p>
                </div>
              )}
            </Section>
          );
        })()}

        {/* ── 3. Beynəlxalq etibarlılıq reytinqləri ──────────────────────── */}
        <Section
          title="Beynəlxalq etibarlılıq reytinqləri"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        >
          <div className="divide-y divide-slate-50 px-2 py-2">
            {ratingKeys.map(({ key, label }) => (
              <div key={key} className="grid items-center py-2.5" style={{ gridTemplateColumns: gridTemplate }}>
                <span className="pl-3 text-xs font-medium text-slate-400">{label}</span>
                {items.map((_, i) => {
                  const val = insightsData[i]?.ratings[key];
                  return val !== undefined ? (
                    <div key={i} className="px-3">
                      <RatingBar value={val} color={COLORS[i]} />
                    </div>
                  ) : (
                    <div key={i} className="px-3 text-xs text-slate-300 italic">Məlumat yoxdur</div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Satisfaction arcs */}
          <div className="border-t border-slate-100 bg-slate-50/50">
            <div className="grid py-4" style={{ gridTemplateColumns: gridTemplate }}>
              <div className="pl-5 flex items-center">
                <span className="text-xs font-medium text-slate-400 leading-tight">Sahibkar<br />məmnuniyyəti</span>
              </div>
              {items.map((_, i) => {
                const pct = insightsData[i]?.ownerSatisfaction;
                return (
                  <div key={i} className="flex items-center justify-center">
                    {pct !== undefined ? (
                      <SatisfactionArc pct={pct} />
                    ) : (
                      <span className="text-xs text-slate-300 italic">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Qulluq xərci */}
          <div className="border-t border-slate-100">
            <div className="grid items-center py-3" style={{ gridTemplateColumns: gridTemplate }}>
              <span className="pl-5 text-xs font-medium text-slate-400">Qulluq xərci</span>
              {items.map((_, i) => {
                const cost = insightsData[i]?.maintenanceCost;
                return (
                  <div key={i} className="px-4">
                    {cost ? <MaintenanceBadge cost={cost} /> : <span className="text-xs text-slate-300">—</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Brand context for unmatched models */}
          {brandContexts.some((b) => b !== null) && (
            <div className="border-t border-slate-100 bg-amber-50/60 px-5 py-3">
              <p className="mb-2 text-xs font-semibold text-amber-800">Marka konteksti — model məlumatı olmadan:</p>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
                {items.map((item, i) => {
                  const bc = brandContexts[i];
                  if (!bc) return <div key={i} className="text-xs text-slate-300 italic px-1">Model üçün ətraflı məlumat var ↑</div>;
                  return (
                    <div key={i} className="space-y-1 px-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium" style={{ color: COLORS[i] }}>{item.make}</span>
                        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${TIER_LABELS[bc.reliabilityTier].cls}`}>
                          {TIER_LABELS[bc.reliabilityTier].label}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-700">{bc.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
            <p className="text-xs text-slate-400">
              Mənbə: J.D. Power VDS/IQS · Consumer Reports · TÜV Report · Euro NCAP · ADAC Pannenstatistik.
              Reytinqlər beynəlxalq ortalama göstəricilərdir.
            </p>
          </div>
        </Section>

        {/* ── 3. Güclü tərəflər ──────────────────────────────────────────── */}
        <Section
          title="Güclü tərəflər"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          }
        >
          <div className="grid divide-x divide-slate-100" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
            {items.map((item, i) => (
              <div key={item.id}>
                <div className="px-4 pt-3 pb-1">
                  <span className="text-xs font-semibold" style={{ color: COLORS[i] }}>
                    {item.make} {item.model}
                  </span>
                </div>
                <ListColumn items={insightsData[i]?.strengths ?? []} variant="strength" />
              </div>
            ))}
          </div>
        </Section>

        {/* ── 4. Zəif tərəflər ───────────────────────────────────────────── */}
        <Section
          title="Zəif tərəflər"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        >
          <div className="grid divide-x divide-slate-100" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
            {items.map((item, i) => (
              <div key={item.id}>
                <div className="px-4 pt-3 pb-1">
                  <span className="text-xs font-semibold" style={{ color: COLORS[i] }}>
                    {item.make} {item.model}
                  </span>
                </div>
                <ListColumn items={insightsData[i]?.weaknesses ?? []} variant="weakness" />
              </div>
            ))}
          </div>
        </Section>

        {/* ── 5. Tez-tez rast gəlinən problemlər ────────────────────────── */}
        <Section
          title="Tez-tez rast gəlinən problemlər (yüksək yürüşdə)"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        >
          <div className="grid divide-x divide-slate-100" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
            {items.map((item, i) => (
              <div key={item.id}>
                <div className="px-4 pt-3 pb-1">
                  <span className="text-xs font-semibold" style={{ color: COLORS[i] }}>
                    {item.make} {item.model}
                  </span>
                </div>
                <ListColumn items={insightsData[i]?.commonProblems ?? []} variant="problem" />
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 bg-amber-50/50 px-5 py-3">
            <p className="text-xs text-amber-700">
              ⚠ Bu problemlər statistik olaraq həmin model üçün daha tez rast gəlinir. Fərdi avtomobil ideal vəziyyətdə ola bilər. Alışdan əvvəl servis yoxlaması tövsiyə olunur.
            </p>
          </div>
        </Section>

        {/* ── 6. Qərar yardımı (Verdict) ─────────────────────────────────── */}
        <Section
          title="Qərar yardımı"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row">
            {rankOrder.map((origIdx, rank) => (
              <VerdictCard
                key={items[origIdx].id}
                item={items[origIdx]}
                insight={insightsData[origIdx]}
                brandCtx={brandContexts[origIdx]}
                rank={rank}
              />
            ))}
          </div>
          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-600">Qeyd:</strong> Tövsiyə etibar skoru + beynəlxalq etibarlılıq reytinqi əsasında hesablanır. Yekun qərar fərdi istifadə şərtlərini, büdcəni və üstünlükləri nəzərə almalıdır. Servis yoxlaması hər zaman tövsiyə olunur.
            </p>
          </div>
        </Section>

        {/* Back link */}
        <div className="flex justify-center pb-4">
          <Link href="/listings" className="btn-secondary text-sm">← Bütün elanlara qayıt</Link>
        </div>

      </div>
    </div>
  );
}
