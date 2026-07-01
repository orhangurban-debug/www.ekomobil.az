interface ListingPublishEaseTipProps {
  variant: "vehicle" | "part" | "part_bulk" | "service";
  className?: string;
}

const COPY: Record<ListingPublishEaseTipProps["variant"], { title: string; steps: string[] }> = {
  vehicle: {
    title: "Sürətli elan — 3 addım",
    steps: [
      "Avtomobilin şəkillərini yükləyin",
      "AI marka, model və digər sahələri təklif etsin",
      "Yoxlayın, redaktə edin və yerləşdirin"
    ]
  },
  part: {
    title: "Sürətli elan — 3 addım",
    steps: [
      "Məhsulun şəkillərini yükləyin (eyni SKU)",
      "Standart ad, təsvir və axtarış teqləri yaransın",
      "Yoxlayın və elanı yerləşdirin"
    ]
  },
  part_bulk: {
    title: "Toplu elan — 3 addım",
    steps: [
      "Fərqli məhsulların şəkillərini bir dəfəyə yükləyin",
      "AI hər məhsulu ayrı elan kimi qruplaşdırsın",
      "Hər elanı yoxlayın və toplu yerləşdirin"
    ]
  },
  service: {
    title: "Sürətli profil — 3 addım",
    steps: [
      "Emalatxana/servis şəkillərini yükləyin",
      "AI xidmət tipi və teqləri təklif etsin",
      "Yoxlayın və müraciəti göndərin"
    ]
  }
};

export function ListingPublishEaseTip({ variant, className = "" }: ListingPublishEaseTipProps) {
  const content = COPY[variant];
  return (
    <div className={`rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3.5 ${className}`}>
      <p className="text-sm font-semibold text-emerald-300">{content.title}</p>
      <ol className="mt-2 space-y-1">
        {content.steps.map((step, index) => (
          <li key={step} className="flex items-start gap-2 text-xs text-emerald-300/90">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[11px] text-emerald-300/70">
        AI yalnız köməkçidir — son qərar və dəqiqlik sizdədir.
      </p>
    </div>
  );
}
