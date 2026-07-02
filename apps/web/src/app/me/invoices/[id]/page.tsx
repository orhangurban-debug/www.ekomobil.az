import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/auth";
import { getInvoice } from "@/server/invoice-store";
import { INVOICE_PAYMENT_TYPE_LABELS } from "@/lib/invoice-labels";
import { PLATFORM_COMPANY } from "@/lib/tax-reporting";
import { PrintButton } from "@/components/invoice/print-button";

const PAYMENT_TYPE_LABELS = INVOICE_PAYMENT_TYPE_LABELS;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoicePrintPage({ params }: Props) {
  const { id } = await params;
  const user = await getServerSessionUser();
  if (!user) redirect(`/login?next=/me/invoices/${id}`);

  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  if (invoice.userId !== user.id && user.role !== "admin" && user.role !== "support") {
    notFound();
  }

  const issuedDate = new Date(invoice.issuedAt).toLocaleDateString("az-AZ", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="min-h-screen bg-white/60">
      <div className="print:hidden sticky top-0 z-10 border-b glass-panel border-slate-900/10 px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/me/payments" className="btn-secondary text-sm">← Ödənişlərə qayıt</Link>
            <span className="text-sm text-slate-500">{invoice.invoiceNumber}</span>
          </div>
          <PrintButton />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 print:py-0 print:max-w-none print:px-8">
        <div className="rounded-2xl border glass-panel border-slate-900/10 shadow-sm print:shadow-none print:border-none">
          <div className="rounded-t-2xl bg-slate-900 px-10 py-8 print:rounded-none">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-bold text-white">
                  Ekomobil<span className="text-sky-400">.az</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">{PLATFORM_COMPANY.name}</div>
                {PLATFORM_COMPANY.voen && (
                  <div className="mt-1 text-xs text-slate-400">VÖEN: {PLATFORM_COMPANY.voen}</div>
                )}
                <div className="mt-2 text-xs text-slate-400">{PLATFORM_COMPANY.email}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-widest text-sky-400">İnvoys / Faktura</div>
                <div className="mt-1 text-2xl font-extrabold text-white">{invoice.invoiceNumber}</div>
                <div className="mt-2 text-xs text-slate-400">Tarix: {issuedDate}</div>
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-8 border-b border-slate-900/10 px-10 py-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Alıcı</div>
              <div className="mt-2 font-semibold text-slate-900">{invoice.userName || invoice.userEmail}</div>
              <div className="mt-0.5 text-sm text-slate-500">{invoice.userEmail}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</div>
              <div className="mt-2">
                <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                  Ödənilib
                </span>
              </div>
              {invoice.paymentReference && (
                <div className="mt-2 text-xs text-slate-400">Bank ref: {invoice.paymentReference}</div>
              )}
            </div>
          </div>

          <div className="px-10 py-6">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-900/10 bg-white/60">
                  <th className="py-3 pl-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Xidmət</th>
                  <th className="py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Miqdar</th>
                  <th className="py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Net (₼)</th>
                  <th className="py-3 pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Cəmi (₼)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-900/10">
                  <td className="py-4 pl-4 text-slate-900">
                    <div className="font-medium">{PAYMENT_TYPE_LABELS[invoice.paymentType] ?? invoice.paymentType}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{invoice.description}</div>
                  </td>
                  <td className="py-4 text-center text-slate-600">1</td>
                  <td className="py-4 text-right text-slate-600">{invoice.netAmountAzn.toFixed(2)}</td>
                  <td className="py-4 pr-4 text-right font-semibold text-slate-900">{invoice.amountAzn.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="px-10 pb-8">
            <div className="ml-auto w-72 space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Net məbləğ</span>
                <span>{invoice.netAmountAzn.toFixed(2)} ₼</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>ƏDV ({invoice.vatRate}%)</span>
                <span>{invoice.vatAmountAzn.toFixed(2)} ₼</span>
              </div>
              <div className="flex items-center justify-between border-t-2 border-slate-900 pt-4">
                <span className="font-bold text-slate-900">Ümumi (ƏDV daxil)</span>
                <span className="text-xl font-extrabold text-slate-900">{invoice.amountAzn.toFixed(2)} ₼</span>
              </div>
              <div className="rounded-xl bg-emerald-500/10 py-2 text-center">
                <span className="text-sm font-bold text-emerald-700">Ödəniş təsdiqləndi</span>
              </div>
            </div>
          </div>

          <div className="rounded-b-2xl border-t border-slate-900/10 px-10 py-5 text-center print:rounded-none">
            <p className="text-xs text-slate-400">
              {PLATFORM_COMPANY.name} · {PLATFORM_COMPANY.address} · {PLATFORM_COMPANY.email}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Bu invoys {issuedDate} tarixində avtomatik olaraq yaradılmışdır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
