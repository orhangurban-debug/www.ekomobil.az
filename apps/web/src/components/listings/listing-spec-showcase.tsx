interface SpecBlock {
  value: string;
  unit: string;
  label: string;
}

interface ListingSpecShowcaseProps {
  specs: SpecBlock[];
}

export function ListingSpecShowcase({ specs }: ListingSpecShowcaseProps) {
  const visible = specs.filter((s) => s.value && s.value !== "—");
  if (visible.length === 0) return null;

  return (
    <section className="py-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((spec) => (
          <div
            key={spec.label}
            className="glass-panel flex flex-col items-center justify-center px-6 py-10 text-center"
          >
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {spec.value}
              </span>
              {spec.unit && (
                <span className="text-lg font-semibold uppercase tracking-wider text-[#0057FF]">
                  {spec.unit}
                </span>
              )}
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.15em] text-white/45">
              {spec.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
