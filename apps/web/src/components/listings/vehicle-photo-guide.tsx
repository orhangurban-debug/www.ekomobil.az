"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PHOTO_GUIDE_PRIORITY_LABELS,
  VEHICLE_PHOTO_GUIDE_CATEGORIES,
  VEHICLE_PHOTO_GUIDE_SHOTS,
  photoGuideCategoryFromBodyType,
  type VehiclePhotoGuideCategory
} from "@/lib/vehicle-photo-guide";
import { PhotoGuideIllustration, priorityAccent } from "@/components/listings/photo-guide-illustration";

interface VehiclePhotoGuideProps {
  bodyType?: string;
  category?: VehiclePhotoGuideCategory;
  onCategoryChange?: (category: VehiclePhotoGuideCategory) => void;
  className?: string;
}

export function VehiclePhotoGuide({
  bodyType,
  category: controlledCategory,
  onCategoryChange,
  className = ""
}: VehiclePhotoGuideProps) {
  const [internalCategory, setInternalCategory] = useState<VehiclePhotoGuideCategory>("car");
  const category = controlledCategory ?? internalCategory;

  useEffect(() => {
    const inferred = photoGuideCategoryFromBodyType(bodyType ?? "");
    if (inferred) {
      if (onCategoryChange) onCategoryChange(inferred);
      else setInternalCategory(inferred);
    }
  }, [bodyType, onCategoryChange]);

  const shots = useMemo(() => VEHICLE_PHOTO_GUIDE_SHOTS[category], [category]);
  const activeMeta = VEHICLE_PHOTO_GUIDE_CATEGORIES.find((item) => item.id === category)!;

  function selectCategory(next: VehiclePhotoGuideCategory) {
    if (onCategoryChange) onCategoryChange(next);
    else setInternalCategory(next);
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-[#0057FF]/15 bg-gradient-to-br from-[#0057FF]/[0.04] via-white to-slate-50/80 ${className}`}>
      <div className="border-b border-[#0057FF]/10 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Peşəkar şəkil protokolu</p>
            <p className="mt-1 text-xs text-slate-500">
              {activeMeta.description} — bu ardıcıllıqla çəksəniz, elanınız daha etibarlı görünəcək.
            </p>
          </div>
          <span className="rounded-full bg-[#0057FF]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0057FF]">
            {shots.length} tövsiyə
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {VEHICLE_PHOTO_GUIDE_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectCategory(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                category === item.id
                  ? "border-[#0057FF] bg-[#0057FF]/10 text-[#0057FF] shadow-sm"
                  : "border-slate-900/10 bg-white/70 text-slate-600 hover:border-[#0057FF]/30 hover:text-[#0057FF]"
              }`}
            >
              <span aria-hidden className="text-base leading-none">
                {item.icon}
              </span>
              <span>
                <span className="block leading-tight">{item.label}</span>
                <span className="mt-0.5 block text-[10px] font-normal opacity-80">{item.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="hidden px-5 pt-4 sm:block">
        <div className="flex items-center gap-1">
          {shots.map((shot, index) => (
            <div key={shot.id} className="flex min-w-0 flex-1 items-center">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  shot.priority === "essential"
                    ? "bg-[#0057FF] text-white"
                    : shot.priority === "important"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {shot.order}
              </div>
              {index < shots.length - 1 && <div className="mx-0.5 h-px min-w-2 flex-1 bg-slate-200" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-4">
        {shots.map((shot) => {
          const accent = priorityAccent(shot.priority);
          return (
            <article
              key={shot.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-900/8 bg-white/80 shadow-sm transition hover:border-[#0057FF]/25 hover:shadow-md"
            >
              <div className="absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white shadow">
                {shot.order}
              </div>

              <div className="relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-white px-6 pt-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,87,255,0.08),transparent_65%)]" />
                <PhotoGuideIllustration id={shot.illustration} category={category} accent={accent} />
              </div>

              <div className="space-y-2 p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">{shot.label}</h4>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      shot.priority === "essential"
                        ? "bg-[#0057FF]/10 text-[#0057FF]"
                        : shot.priority === "important"
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-amber-500/10 text-amber-700"
                    }`}
                  >
                    {PHOTO_GUIDE_PRIORITY_LABELS[shot.priority]}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">{shot.tip}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="border-t border-[#0057FF]/10 bg-[#0057FF]/[0.03] px-4 py-3 sm:px-5">
        <p className="text-[11px] leading-relaxed text-slate-600">
          <span className="font-semibold text-[#0057FF]">Məsləhət:</span> Xarici şəkilləri gündüz, kölgəsiz mühitdə çəkin.
          Salon, mühərrik və yük sahəsi fotolarını yaxşı işıqlandırılmış mühitdə çəkmək alıcı marağını xeyli artırır.
        </p>
      </div>
    </div>
  );
}
