const BRANCH_NOTE_RE = /\n\nFiliallar: ([^\n]+)$/;

export function parseBranchCitiesFromDescription(
  description: string | undefined,
  primaryCity: string
): string[] {
  if (!description) return [];
  const match = description.match(BRANCH_NOTE_RE);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((city) => city.trim())
    .filter(Boolean)
    .filter((city) => city !== primaryCity);
}

export function mergeDescriptionWithBranches(
  description: string,
  branchCities: string[],
  primaryCity: string
): string {
  const base = description.replace(BRANCH_NOTE_RE, "").trim();
  const extra = branchCities.filter((city) => city && city !== primaryCity);
  if (extra.length === 0) return base;
  const note = `Filiallar: ${extra.join(", ")}`;
  return base ? `${base}\n\n${note}` : note;
}

export function formatBranchCitiesForMessage(branchCities: string[] | undefined, primaryCity: string): string {
  const extra = (branchCities ?? []).filter((city) => city && city !== primaryCity);
  return extra.length > 0 ? extra.join(", ") : "—";
}
