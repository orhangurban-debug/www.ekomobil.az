/**
 * Azərbaycan vergi hesabatı üçün yardımçılar.
 * Platforma xidmətləri üzrə ƏDV (standart 18%) hesablaması və export formatları.
 */

export const DEFAULT_VAT_RATE_PERCENT = Number(process.env.PLATFORM_VAT_RATE ?? 18);

export const PLATFORM_COMPANY = {
  name: process.env.PLATFORM_COMPANY_NAME ?? "EkoMobil MMC",
  voen: process.env.PLATFORM_VOEN ?? "",
  address: process.env.PLATFORM_COMPANY_ADDRESS ?? "Bakı, Azərbaycan",
  email: process.env.PLATFORM_COMPANY_EMAIL ?? "info@ekomobil.az"
};

export interface VatBreakdown {
  grossAzn: number;
  netAzn: number;
  vatAzn: number;
  vatRatePercent: number;
}

/** Müştərinin ödədiyi məbləğ (ümumi/brüt) ƏDV daxil hesablanır. */
export function splitGrossWithVat(grossAzn: number, vatRatePercent = DEFAULT_VAT_RATE_PERCENT): VatBreakdown {
  const rate = Math.max(0, vatRatePercent);
  if (rate === 0 || grossAzn <= 0) {
    return { grossAzn, netAzn: grossAzn, vatAzn: 0, vatRatePercent: rate };
  }
  const netAzn = roundAzn(grossAzn / (1 + rate / 100));
  const vatAzn = roundAzn(grossAzn - netAzn);
  return { grossAzn: roundAzn(grossAzn), netAzn, vatAzn, vatRatePercent: rate };
}

function roundAzn(value: number): number {
  return Math.round(value * 100) / 100;
}

/** CSV sahələrində vergül və dırnaq problemlərini aradan qaldırır. */
export function csvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function buildCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const bom = "\uFEFF"; // Excel UTF-8
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(","))
  ];
  return bom + lines.join("\r\n");
}

export type TaxExportFormat = "payment_register" | "vat_sales" | "invoice_register" | "summary";

export const TAX_EXPORT_META: Record<
  TaxExportFormat,
  { filename: string; title: string; description: string }
> = {
  payment_register: {
    filename: "odenis_reyestri",
    title: "Ödəniş reyestri",
    description:
      "Dövr üzrə bütün uğurlu ödənişlər — bank çıxarışı və Kapital Bank settlement ilə uzlaşdırma üçün."
  },
  vat_sales: {
    filename: "edv_satis_reyestri",
    title: "ƏDV satış reyestri",
    description:
      "ƏDV bəyannaməsi üçün sətir-sətir satış qeydləri: net məbləğ, ƏDV, brüt cəmi."
  },
  invoice_register: {
    filename: "invoys_reyestri",
    title: "İnvoys reyestri",
    description: "Rəsmi invoys siyahısı — mühasibat və audit üçün."
  },
  summary: {
    filename: "vergi_xulase",
    title: "Dövr xülasəsi",
    description: "Seçilmiş dövr üzrə cəmi gəlir, ƏDV və invoys sayı."
  }
};

/** Admin paneldə göstərilən tələb olunan sənədlər siyahısı. */
export const TAX_REQUIRED_DOCUMENTS = [
  {
    id: "payment_register",
    title: "Ödəniş reyestri (CSV)",
    source: "platform",
    note: "Bu paneldən yüklənir — bütün uğurlu ödənişlər, bank ref və invoys № ilə."
  },
  {
    id: "vat_sales",
    title: "ƏDV satış reyestri (CSV)",
    source: "platform",
    note: "ƏDV bəyannaməsi üçün — net/ƏDV/brüt sütunları ilə."
  },
  {
    id: "invoice_register",
    title: "İnvoys reyestri (CSV)",
    source: "platform",
    note: "Verilmiş invoysların tam siyahısı."
  },
  {
    id: "bank_statement",
    title: "Bank çıxarışı",
    source: "kapital_bank",
    note: "Kapital Bank biznes hesabından dövr üzrə çıxarış — platforma reyestri ilə uzlaşdırın."
  },
  {
    id: "gateway_settlement",
    title: "Ödəniş provayder settlement hesabatı",
    source: "kapital_bank",
    note: "Admin → Ödəniş test hazırlığı bölməsindəki order CSV ilə tamamlayın."
  },
  {
    id: "vat_declaration",
    title: "ƏDV bəyannaməsi (rəsmi)",
    source: "vergi_orqani",
    note: "Satış reyestrindən əldə olunan cəmlər əsasında vergi orqanına təqdim olunur."
  },
  {
    id: "profit_tax",
    title: "Mənfəət vergisi hesabatı",
    source: "muhasib",
    note: "Platforma komissiya gəliri minus xərclər — mühasib tərəfindən hazırlanır."
  }
] as const;
