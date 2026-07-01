export const LEAD_STAGE_OPTIONS = [
  { value: "new", label: "Yeni" },
  { value: "in_progress", label: "İcrada" },
  { value: "test_drive", label: "Test sürüşü" },
  { value: "offer", label: "Təklif verildi" },
  { value: "won", label: "Uğurlu satış" },
  { value: "closed", label: "Bağlanıb" }
] as const;

export const LEAD_STAGE_LABELS: Record<string, string> = Object.fromEntries(
  LEAD_STAGE_OPTIONS.map((item) => [item.value, item.label])
);
