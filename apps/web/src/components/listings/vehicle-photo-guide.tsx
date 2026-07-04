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
  const [open, setOpen] = useState(false);
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
    <div className={`rounded-2xl border border-slate-900/10 bg-white/80 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
      >
        <div>
          <p className="text-sm font-semibold text-slate-800">Hansı şəkillər yaxşıdır?</p>
          <p className="mt-0.5 text-xs text-slate-500">İstəyə bağlı — bilmirsinizsə, sadəcə maşını müxtəlif tərəfdən çəkin</p>
        </div>
        <span className="shrink-0 text-xs font-medium text-[#0057FF]">{open ? "Bağla" : "Bax"}</span>
      </button>

      {open && (
        <div className="border-t border-slate-900/10">
          <div className="border-b border-slate-900/8 px-4 py-3 sm:px-5">
            <p className="text-xs text-slate-600">{activeMeta.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {VEHICLE_PHOTO_GUIDE_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectCategory(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    category === item.id
                      ? "border-[#0057FF] bg-[#0057FF]/10 text-[#0057FF]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-[#0057FF]/30"
                  }`}
                >
                  <span aria-hidden>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
            {shots.map((shot) => {
              const accent = priorityAccent(shot.priority);
              return (
                <article
                  key={shot.id}
                  className="rounded-xl border border-slate-900/8 bg-white p-3"
                >
                  <div className="flex gap-3">
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                      <PhotoGuideIllustration id={shot.illustration} category={category} accent={accent} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800">
                        {shot.order}. {shot.label}
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                          shot.priority === "essential"
                            ? "bg-[#0057FF]/10 text-[#0057FF]"
                            : shot.priority === "important"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {PHOTO_GUIDE_PRIORITY_LABELS[shot.priority]}
                      </span>
                      <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{shot.tip}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
