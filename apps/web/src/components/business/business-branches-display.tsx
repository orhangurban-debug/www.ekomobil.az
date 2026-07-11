import type { BusinessProfileBranch } from "@/lib/business-branches";
import { isShareableMapUrl, normalizeMapUrl } from "@/lib/business-branches";

export interface BusinessLocationCard {
  title: string;
  city: string;
  address?: string;
  mapUrl?: string;
  phone?: string;
  workingHours?: string;
  isPrimary?: boolean;
}

export function buildBusinessLocations(input: {
  primaryCity: string;
  primaryLabel: string;
  primaryAddress?: string;
  primaryMapUrl?: string;
  primaryPhone?: string;
  primaryWorkingHours?: string;
  branches?: BusinessProfileBranch[];
}): BusinessLocationCard[] {
  const locations: BusinessLocationCard[] = [];

  if (input.primaryCity) {
    locations.push({
      title: input.primaryLabel,
      city: input.primaryCity,
      address: input.primaryAddress,
      mapUrl: normalizeMapUrl(input.primaryMapUrl),
      phone: input.primaryPhone,
      workingHours: input.primaryWorkingHours,
      isPrimary: true
    });
  }

  for (const branch of input.branches ?? []) {
    if (!branch.city || branch.city === input.primaryCity) continue;
    locations.push({
      title: branch.label?.trim() || `${branch.city} filialı`,
      city: branch.city,
      address: branch.address,
      mapUrl: normalizeMapUrl(branch.mapUrl),
      phone: branch.phone,
      workingHours: branch.workingHours
    });
  }

  return locations;
}

export function BusinessBranchesDisplay({
  locations,
  className = ""
}: {
  locations: BusinessLocationCard[];
  className?: string;
}) {
  if (locations.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-900">Ünvanlar və filiallar</h3>
      <div className="space-y-3">
        {locations.map((location) => (
          <div
            key={`${location.isPrimary ? "primary" : "branch"}-${location.city}-${location.title}`}
            className="rounded-xl border border-slate-200 bg-white/80 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-slate-900">{location.title}</p>
              {location.isPrimary && (
                <span className="rounded-full bg-[#0057FF]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0057FF]">
                  Əsas
                </span>
              )}
              <span className="text-xs text-slate-500">{location.city}</span>
            </div>

            {location.address && <p className="mt-2 text-sm text-slate-600">{location.address}</p>}

            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              {location.phone && <span>📞 {location.phone}</span>}
              {location.workingHours && <span>🕒 {location.workingHours}</span>}
            </div>

            {location.mapUrl && isShareableMapUrl(location.mapUrl) && (
              <a
                href={location.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-lg border border-[#0057FF]/20 bg-[#0057FF]/5 px-3 py-1.5 text-xs font-semibold text-[#0057FF] hover:bg-[#0057FF]/10"
              >
                Xəritədə aç / paylaş
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
