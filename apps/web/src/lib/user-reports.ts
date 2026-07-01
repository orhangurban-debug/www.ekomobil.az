export type UserReportReason =
  | "fraud"
  | "misleading"
  | "stolen"
  | "fake_listing"
  | "harassment"
  | "other";

export const USER_REPORT_REASON_LABELS: Record<UserReportReason, string> = {
  fraud: "Fırıldaqçılıq / dələduzluq",
  stolen: "Oğurlanmış avtomobil / hissə",
  fake_listing: "Saxta və ya mövcud olmayan elan",
  misleading: "Yanlış və ya aldadıcı məlumat",
  harassment: "Təzyiq / təhqir",
  other: "Digər"
};

export const AUTO_INCIDENT_REPORT_REASONS = new Set<UserReportReason>(["fraud", "stolen", "fake_listing"]);

export const USER_REPORT_SEVERITY: Record<UserReportReason, "low" | "medium" | "high" | "critical"> = {
  fraud: "critical",
  stolen: "critical",
  fake_listing: "high",
  misleading: "medium",
  harassment: "high",
  other: "low"
};
