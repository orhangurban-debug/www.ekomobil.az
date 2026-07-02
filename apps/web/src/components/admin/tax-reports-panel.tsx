"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Info } from "lucide-react";
import { TAX_EXPORT_META, TAX_REQUIRED_DOCUMENTS, PLATFORM_COMPANY } from "@/lib/tax-reporting";

function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function prevMonthRange(): { from: string; to: string } {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const to = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  return { from, to };
}

export function TaxReportsPanel() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayIso());

  const exportLinks = useMemo(
    () =>
      (Object.keys(TAX_EXPORT_META) as Array<keyof typeof TAX_EXPORT_META>).map((format) => ({
        format,
        meta: TAX_EXPORT_META[format],
        href: `/api/admin/tax-reports/export?from=${from}&to=${to}&format=${format}`
      })),
    [from, to]
  );

  function applyPreset(preset: "this_month" | "last_month" | "this_quarter") {
    const now = new Date();
    if (preset === "this_month") {
      setFrom(monthStart());
      setTo(todayIso());
      return;
    }
    if (preset === "last_month") {
      const r = prevMonthRange();
      setFrom(r.from);
      setTo(r.to);
      return;
    }
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const fromDate = new Date(now.getFullYear(), quarterStartMonth, 1);
    setFrom(
      `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}-01`
    );
    setTo(todayIso());
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0891B2]" />
          <div className="text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Vergi hesabatı üçün hazırlıq</p>
            <p className="mt-1">
              Platforma ödənişləri <strong>ƏDV daxil (18%)</strong> hesablanır. Aşağıdakı CSV faylları Excel və
              mühasibat proqramlarına import üçün UTF-8 BOM ilə hazırlanır.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Şirkət: {PLATFORM_COMPANY.name}
              {PLATFORM_COMPANY.voen ? ` · VÖEN: ${PLATFORM_COMPANY.voen}` : " · VÖEN: PLATFORM_VOEN env ilə təyin edin"}
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Hesabat dövrü</h3>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="text-slate-500">Başlanğıc</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-500">Bitmə</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => applyPreset("this_month")} className="btn-secondary text-xs">
              Bu ay
            </button>
            <button type="button" onClick={() => applyPreset("last_month")} className="btn-secondary text-xs">
              Keçən ay
            </button>
            <button type="button" onClick={() => applyPreset("this_quarter")} className="btn-secondary text-xs">
              Bu rüb
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {exportLinks.map(({ format, meta, href }) => (
          <div key={format} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-[#0891B2]" />
                  <h4 className="font-semibold text-slate-900">{meta.title}</h4>
                </div>
                <p className="mt-2 text-sm text-slate-600">{meta.description}</p>
                <p className="mt-2 font-mono text-xs text-slate-400">{meta.filename}_{from}_{to}.csv</p>
              </div>
              <a
                href={href}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0891B2] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0891B2]/90"
              >
                <Download className="h-3.5 w-3.5" />
                Yüklə
              </a>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Tələb olunan sənədlər (vergi hesabatı paketi)
        </h3>
        <div className="mt-4 space-y-3">
          {TAX_REQUIRED_DOCUMENTS.map((doc) => (
            <div key={doc.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <span
                className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  doc.source === "platform"
                    ? "bg-emerald-100 text-emerald-700"
                    : doc.source === "kapital_bank"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {doc.source === "platform" ? "Platforma" : doc.source === "kapital_bank" ? "Bank" : "Xarici"}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{doc.title}</p>
                <p className="mt-1 text-xs text-slate-600">{doc.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
