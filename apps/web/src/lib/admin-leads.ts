export const LEAD_STAGE_OPTIONS = [
  { value: "new", label: "Yeni" },
  { value: "contacted", label: "Əlaqə qurulub" },
  { value: "visit_booked", label: "Baxış / görüş" },
  { value: "closed", label: "Bağlanıb" }
] as const;

export const LEAD_STAGE_LABELS: Record<string, string> = Object.fromEntries(
  LEAD_STAGE_OPTIONS.map((item) => [item.value, item.label])
);
