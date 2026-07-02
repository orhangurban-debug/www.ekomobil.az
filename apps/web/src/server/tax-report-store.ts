import type { InvoiceRecord } from "@/server/invoice-store";
import { listInvoicesForPeriod } from "@/server/invoice-store";
import {
  buildCsv,
  PLATFORM_COMPANY,
  TAX_EXPORT_META,
  type TaxExportFormat
} from "@/lib/tax-reporting";
import { INVOICE_PAYMENT_TYPE_LABELS } from "@/lib/invoice-labels";

export interface TaxReportSummary {
  from: string;
  to: string;
  invoiceCount: number;
  grossTotalAzn: number;
  netTotalAzn: number;
  vatTotalAzn: number;
  byPaymentType: Array<{
    paymentType: string;
    label: string;
    count: number;
    grossAzn: number;
    vatAzn: number;
  }>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("az-AZ");
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("az-AZ");
}

export async function getTaxReportSummary(from: string, to: string): Promise<TaxReportSummary> {
  const invoices = await listInvoicesForPeriod({ from, to });
  const byType = new Map<string, { count: number; grossAzn: number; vatAzn: number }>();

  let grossTotalAzn = 0;
  let netTotalAzn = 0;
  let vatTotalAzn = 0;

  for (const inv of invoices) {
    grossTotalAzn += inv.amountAzn;
    netTotalAzn += inv.netAmountAzn;
    vatTotalAzn += inv.vatAmountAzn;
    const bucket = byType.get(inv.paymentType) ?? { count: 0, grossAzn: 0, vatAzn: 0 };
    bucket.count += 1;
    bucket.grossAzn += inv.amountAzn;
    bucket.vatAzn += inv.vatAmountAzn;
    byType.set(inv.paymentType, bucket);
  }

  return {
    from,
    to,
    invoiceCount: invoices.length,
    grossTotalAzn: round(grossTotalAzn),
    netTotalAzn: round(netTotalAzn),
    vatTotalAzn: round(vatTotalAzn),
    byPaymentType: Array.from(byType.entries()).map(([paymentType, stats]) => ({
      paymentType,
      label: INVOICE_PAYMENT_TYPE_LABELS[paymentType as keyof typeof INVOICE_PAYMENT_TYPE_LABELS] ?? paymentType,
      count: stats.count,
      grossAzn: round(stats.grossAzn),
      vatAzn: round(stats.vatAzn)
    }))
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function buildTaxReportCsv(
  format: TaxExportFormat,
  from: string,
  to: string
): Promise<{ filename: string; content: string }> {
  const invoices = await listInvoicesForPeriod({ from, to });
  const meta = TAX_EXPORT_META[format];
  const periodSuffix = `${from}_${to}`;

  if (format === "summary") {
    const summary = await getTaxReportSummary(from, to);
    const headers = ["Göstərici", "Dəyər"];
    const rows: Array<Array<string | number>> = [
      ["Şirkət", PLATFORM_COMPANY.name],
      ["VÖEN", PLATFORM_COMPANY.voen || "—"],
      ["Dövr başlanğıcı", from],
      ["Dövr sonu", to],
      ["İnvoys sayı", summary.invoiceCount],
      ["Brüt cəmi (₼)", summary.grossTotalAzn],
      ["Net cəmi (₼)", summary.netTotalAzn],
      ["ƏDV cəmi (₼)", summary.vatTotalAzn],
      ["", ""],
      ["Ödəniş növü", "Say", "Brüt (₼)", "ƏDV (₼)"],
      ...summary.byPaymentType.map((row) => [row.label, row.count, row.grossAzn, row.vatAzn])
    ];
    return {
      filename: `${meta.filename}_${periodSuffix}.csv`,
      content: buildCsv(headers, rows)
    };
  }

  if (format === "payment_register") {
    const headers = [
      "Tarix",
      "İnvoys №",
      "İstifadəçi",
      "Email",
      "Ödəniş növü",
      "Təsvir",
      "Brüt (₼)",
      "Net (₼)",
      "ƏDV (₼)",
      "ƏDV %",
      "Bank ref",
      "Ödəniş ID"
    ];
    const rows = invoices.map((inv) => paymentRegisterRow(inv));
    return {
      filename: `${meta.filename}_${periodSuffix}.csv`,
      content: buildCsv(headers, rows)
    };
  }

  if (format === "vat_sales") {
    const headers = [
      "Sətir №",
      "Tarix",
      "İnvoys №",
      "Alıcı",
      "Email",
      "Xidmət növü",
      "Təsvir",
      "Net məbləğ (₼)",
      "ƏDV məbləği (₼)",
      "Brüt məbləğ (₼)",
      "ƏDV dərəcəsi (%)",
      "Satıcı VÖEN",
      "Satıcı adı"
    ];
    const rows = invoices.map((inv, index) => [
      index + 1,
      formatDate(inv.issuedAt),
      inv.invoiceNumber,
      inv.userName || inv.userEmail,
      inv.userEmail,
      INVOICE_PAYMENT_TYPE_LABELS[inv.paymentType] ?? inv.paymentType,
      inv.description,
      inv.netAmountAzn,
      inv.vatAmountAzn,
      inv.amountAzn,
      inv.vatRate,
      PLATFORM_COMPANY.voen,
      PLATFORM_COMPANY.name
    ]);
    return {
      filename: `${meta.filename}_${periodSuffix}.csv`,
      content: buildCsv(headers, rows)
    };
  }

  // invoice_register
  const headers = [
    "İnvoys №",
    "Tarix",
    "İstifadəçi ID",
    "Alıcı adı",
    "Email",
    "Ödəniş növü",
    "Təsvir",
    "Brüt (₼)",
    "Net (₼)",
    "ƏDV (₼)",
    "Bank ref",
    "E-poçt göndərildi"
  ];
  const rows = invoices.map((inv) => [
    inv.invoiceNumber,
    formatDateTime(inv.issuedAt),
    inv.userId,
    inv.userName,
    inv.userEmail,
    INVOICE_PAYMENT_TYPE_LABELS[inv.paymentType] ?? inv.paymentType,
    inv.description,
    inv.amountAzn,
    inv.netAmountAzn,
    inv.vatAmountAzn,
    inv.paymentReference ?? "",
    inv.emailSentAt ? "Bəli" : "Xeyr"
  ]);
  return {
    filename: `${meta.filename}_${periodSuffix}.csv`,
    content: buildCsv(headers, rows)
  };
}

function paymentRegisterRow(inv: InvoiceRecord): Array<string | number> {
  return [
    formatDateTime(inv.issuedAt),
    inv.invoiceNumber,
    inv.userName || inv.userEmail,
    inv.userEmail,
    INVOICE_PAYMENT_TYPE_LABELS[inv.paymentType] ?? inv.paymentType,
    inv.description,
    inv.amountAzn,
    inv.netAmountAzn,
    inv.vatAmountAzn,
    inv.vatRate,
    inv.paymentReference ?? "",
    inv.paymentId
  ];
}
