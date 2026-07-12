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

function telHref(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return `tel:${phone}`;
  return phone.trim().startsWith("+") ? `tel:+${digits}` : `tel:${digits}`;
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
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-slate-900">{location.title}</p>
              {location.isPrimary && (
                <span className="rounded bg-[#0057FF]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0057FF]">
                  Əsas
                </span>
              )}
              <span className="text-xs text-slate-500">{location.city}</span>
            </div>

            {location.address && (
              <p className="mt-1.5 text-sm text-slate-600">{location.address}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              {location.phone && (
                <a href={telHref(location.phone)} className="font-medium text-slate-800 hover:text-[#0057FF]">
                  {location.phone}
                </a>
              )}
              {location.workingHours && <span>{location.workingHours}</span>}
              {location.mapUrl && isShareableMapUrl(location.mapUrl) && (
                <a
                  href={location.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#0057FF] hover:underline"
                >
                  Xəritədə aç
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
