import { parseBranchCitiesFromDescription } from "@/lib/branch-cities";

export interface BusinessProfileBranch {
  city: string;
  label?: string;
  address?: string;
  mapUrl?: string;
  phone?: string;
  workingHours?: string;
}

export const MAX_BUSINESS_BRANCHES = 12;

export function normalizeMapUrl(raw?: string): string | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value.slice(0, 500);
  return `https://${value}`.slice(0, 500);
}

export function isShareableMapUrl(raw?: string): boolean {
  const value = normalizeMapUrl(raw);
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeBusinessBranches(raw: unknown, primaryCity?: string): BusinessProfileBranch[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const branches: BusinessProfileBranch[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const city = typeof item.city === "string" ? item.city.trim() : "";
    if (!city || (primaryCity && city === primaryCity)) continue;
    const key = city.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const branch: BusinessProfileBranch = { city };
    if (typeof item.label === "string" && item.label.trim()) branch.label = item.label.trim().slice(0, 80);
    if (typeof item.address === "string" && item.address.trim()) branch.address = item.address.trim().slice(0, 200);
    const mapUrl = normalizeMapUrl(typeof item.mapUrl === "string" ? item.mapUrl : undefined);
    if (mapUrl && isShareableMapUrl(mapUrl)) branch.mapUrl = mapUrl;
    if (typeof item.phone === "string" && item.phone.trim()) {
      branch.phone = item.phone.trim().replace(/[^\d+]/g, "").slice(0, 30);
    }
    if (typeof item.workingHours === "string" && item.workingHours.trim()) {
      branch.workingHours = item.workingHours.trim().slice(0, 120);
    }
    branches.push(branch);
    if (branches.length >= MAX_BUSINESS_BRANCHES) break;
  }

  return branches;
}

export function parseBranchesFromDb(raw: unknown, description?: string | null, primaryCity?: string): BusinessProfileBranch[] {
  const fromJson = sanitizeBusinessBranches(raw, primaryCity);
  if (fromJson.length > 0) return fromJson;
  const legacyCities = parseBranchCitiesFromDescription(description ?? undefined, primaryCity ?? "");
  return legacyCities.map((city) => ({ city }));
}

export function branchesFromLegacyCities(cities: string[], primaryCity?: string): BusinessProfileBranch[] {
  return sanitizeBusinessBranches(
    cities.map((city) => ({ city })),
    primaryCity
  );
}

export function stripLegacyBranchNote(description?: string | null): string {
  return (description ?? "").replace(/\n\nFiliallar: [^\n]+$/, "").trim();
}
