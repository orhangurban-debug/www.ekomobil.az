import {
  PRIORITY_LABELS,
  REQUEST_TYPE_LABELS,
  STATUS_LABELS
} from "@/lib/support-contact";

export type SupportRiskFlag = "none" | "watch" | "abuse" | "legal";

export const RISK_FLAG_LABELS: Record<SupportRiskFlag, string> = {
  none: "Normal",
  watch: "Nəzarət",
  abuse: "Sui-istifadə",
  legal: "Hüquqi arxiv"
};

export const REQUEST_TYPE_GROUPS: Array<{
  id: string;
  label: string;
  types: string[];
}> = [
  { id: "support", label: "Dəstək", types: ["question", "problem"] },
  { id: "disputes", label: "Mübahisə / şikayət", types: ["complaint"] },
  { id: "partnership", label: "Tərəfdaşlıq", types: ["partnership", "inspection_partner"] },
  {
    id: "privacy",
    label: "Məxfilik / GDPR",
    types: ["data_export", "data_rectification", "data_deletion", "data_processing_objection"]
  },
  { id: "other", label: "Digər", types: ["other"] }
];

export function requestTypeGroupLabel(requestType: string): string {
  const group = REQUEST_TYPE_GROUPS.find((item) => item.types.includes(requestType));
  return group?.label ?? "Digər";
}

export function requestTypeBadgeClass(requestType: string): string {
  if (["complaint"].includes(requestType)) return "bg-rose-50 text-rose-700 ring-rose-200";
  if (["problem", "question"].includes(requestType)) return "bg-sky-50 text-sky-700 ring-sky-200";
  if (["partnership", "inspection_partner"].includes(requestType)) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (requestType.startsWith("data_")) return "bg-violet-50 text-violet-700 ring-violet-200";
  return "bg-slate-50 text-slate-600 ring-slate-200";
}

export function riskFlagBadgeClass(flag: SupportRiskFlag): string {
  switch (flag) {
    case "watch":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "abuse":
      return "bg-orange-50 text-orange-800 ring-orange-200";
    case "legal":
      return "bg-rose-50 text-rose-800 ring-rose-200";
    default:
      return "bg-slate-50 text-slate-500 ring-slate-200";
  }
}

export function defaultPriorityForRequestType(requestType: string): string {
  switch (requestType) {
    case "complaint":
    case "data_deletion":
    case "data_export":
      return "high";
    case "problem":
    case "data_rectification":
    case "data_processing_objection":
      return "normal";
    case "partnership":
    case "inspection_partner":
      return "normal";
    default:
      return "normal";
  }
}

export function shouldElevateRiskForType(requestType: string): boolean {
  return requestType === "complaint";
}

export interface SupportExportPayload {
  exportedAt: string;
  platform: string;
  request: Record<string, unknown>;
  reporterContext?: Record<string, unknown>;
  legalNotice: string;
}

export function buildSupportExportDocument(input: {
  request: Record<string, unknown>;
  reporterContext?: Record<string, unknown>;
}): SupportExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    platform: "EkoMobil.az",
    request: input.request,
    reporterContext: input.reporterContext,
    legalNotice:
      "Bu sənəd EkoMobil.az platformasının daxili müraciət qeydiyyatından çıxarılıb. " +
      "Müvafiq qanunvericiliyə əsasən hüquq mühafizə orqanlarına təqdim oluna bilər."
  };
}

export function buildSupportPrintHtml(input: {
  request: Record<string, unknown>;
  reporterContext?: Record<string, unknown>;
}): string {
  const doc = buildSupportExportDocument(input);
  const req = doc.request;
  const ctx = doc.reporterContext ?? {};
  const line = (label: string, value: unknown) =>
    `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;color:#475569;width:200px;">${label}</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#0f172a;">${String(value ?? "—").replace(/</g, "&lt;")}</td></tr>`;

  return `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <title>Müraciət ${req.id ?? ""}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #0f172a; padding: 32px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; margin: 28px 0 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .box { white-space: pre-wrap; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #f8fafc; }
    .notice { margin-top: 24px; font-size: 12px; color: #64748b; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>EkoMobil — Müraciət arxivi</h1>
  <p style="color:#64748b;font-size:13px;">Export tarixi: ${doc.exportedAt}</p>

  <h2>Müraciət</h2>
  <table>
    ${line("ID", req.id)}
    ${line("Tip", REQUEST_TYPE_LABELS[String(req.requestType)] ?? req.requestType)}
    ${line("Kateqoriya", requestTypeGroupLabel(String(req.requestType ?? "")))}
    ${line("Mövzu", req.subject)}
    ${line("Status", STATUS_LABELS[String(req.status)] ?? req.status)}
    ${line("Prioritet", PRIORITY_LABELS[String(req.priority)] ?? req.priority)}
    ${line("Risk", RISK_FLAG_LABELS[(req.riskFlag as SupportRiskFlag) ?? "none"])}
    ${line("Yaradılıb", req.createdAt)}
    ${line("Son aktivlik", req.lastActivityAt)}
    ${line("Cavab tarixi", req.responseAt)}
  </table>

  <h2>Müraciət mətni</h2>
  <div class="box">${String(req.message ?? "").replace(/</g, "&lt;")}</div>

  <h2>Admin cavabı</h2>
  <div class="box">${String(req.adminResponse ?? "—").replace(/</g, "&lt;")}</div>

  <h2>Müraciətçi</h2>
  <table>
    ${line("Ad", req.reporterName)}
    ${line("E-poçt", req.reporterEmail)}
    ${line("Telefon", req.reporterPhone)}
    ${line("İstifadəçi ID", req.reporterUserId)}
    ${line("IP ünvanı", req.reporterIp)}
    ${line("User-Agent", req.reporterUserAgent)}
    ${line("Elan ID", req.listingId)}
  </table>

  <h2>İstifadəçi konteksti</h2>
  <table>
    ${line("Hesab statusu", ctx.accountStatus)}
    ${line("Hesab e-poçtu", ctx.accountEmail)}
    ${line("Rol", ctx.accountRole)}
    ${line("Qeydiyyat tarixi", ctx.accountCreatedAt)}
    ${line("Cərimə balansı", ctx.penaltyBalanceAzn != null ? `${ctx.penaltyBalanceAzn} ₼` : "—")}
    ${line("Digər müraciətlər", ctx.otherRequestCount)}
    ${line("Açıq incident", ctx.openIncidentCount)}
  </table>

  <h2>Daxili qeydlər</h2>
  <div class="box">${String(req.internalNotes ?? "—").replace(/</g, "&lt;")}</div>

  <p class="notice">${doc.legalNotice}</p>
</body>
</html>`;
}
