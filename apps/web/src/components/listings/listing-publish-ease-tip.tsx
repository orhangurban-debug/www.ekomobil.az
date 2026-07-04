interface ListingPublishEaseTipProps {
  variant: "vehicle" | "part" | "part_bulk" | "service";
  className?: string;
}

const COPY: Record<ListingPublishEaseTipProps["variant"], { title: string; steps: string[] }> = {
  vehicle: {
    title: "3 addımda hazırdır",
    steps: [
      "Maşının şəkillərini yükləyin",
      "«AI ilə doldur» düyməsinə basın — biz kömək edəcəyik",
      "Yoxlayın və yerləşdirin"
    ]
  },
  part: {
    title: "3 addımda hazırdır",
    steps: [
      "Hissənin şəkillərini yükləyin",
      "«AI ilə doldur» — ad və qiymət təklif olunur",
      "Yoxlayın və yerləşdirin"
    ]
  },
  part_bulk: {
    title: "Çox məhsul — 3 addım",
    steps: [
      "Bütün məhsul şəkillərini bir dəfəyə yükləyin",
      "AI hər məhsulu ayrıca tanıyır",
      "Yoxlayın və hamısını yerləşdirin"
    ]
  },
  service: {
    title: "3 addımda hazırdır",
    steps: [
      "Servisin şəkillərini yükləyin",
      "AI məlumatları təklif edir",
      "Yoxlayın və göndərin"
    ]
  }
};

export function ListingPublishEaseTip({ variant, className = "" }: ListingPublishEaseTipProps) {
  const content = COPY[variant];
  return (
    <div className={`rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3.5 ${className}`}>
      <p className="text-sm font-semibold text-emerald-800">{content.title}</p>
      <ol className="mt-2 space-y-1.5">
        {content.steps.map((step, index) => (
          <li key={step} className="flex items-start gap-2 text-sm text-emerald-800/90">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
