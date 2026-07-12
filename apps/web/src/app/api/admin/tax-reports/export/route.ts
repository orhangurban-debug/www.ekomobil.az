import { NextResponse } from "next/server";
import { requireAdminCapability } from "@/lib/rbac";
import type { TaxExportFormat } from "@/lib/tax-reporting";
import { buildTaxReportCsv, getTaxReportSummary } from "@/server/tax-report-store";

const FORMATS: TaxExportFormat[] = ["payment_register", "vat_sales", "invoice_register", "summary"];

function parseDateParam(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

export async function GET(req: Request) {
  const auth = await requireAdminCapability(req, "finance.manage");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const from = parseDateParam(url.searchParams.get("from"));
  const to = parseDateParam(url.searchParams.get("to"));
  const format = url.searchParams.get("format") as TaxExportFormat | null;

  if (!from || !to) {
    return NextResponse.json({ ok: false, error: "from və to parametrləri (YYYY-MM-DD) tələb olunur." }, { status: 400 });
  }
  if (from > to) {
    return NextResponse.json({ ok: false, error: "Başlanğıc tarixi bitmə tarixindən sonra ola bilməz." }, { status: 400 });
  }
  if (!format || !FORMATS.includes(format)) {
    return NextResponse.json({ ok: false, error: "Yanlış format." }, { status: 400 });
  }

  if (url.searchParams.get("preview") === "1") {
    const summary = await getTaxReportSummary(from, to);
    return NextResponse.json({ ok: true, summary });
  }

  const { filename, content } = await buildTaxReportCsv(format, from, to);
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
