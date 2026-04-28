import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/auth";
import { getInvoice } from "@/server/invoice-store";
import { PrintButton } from "@/components/invoice/print-button";

const PAYMENT_TYPE_LABELS = {
  listing_plan: "Elan planı",
  business_plan: "Biznes planı",
  auction_deposit: "Auksion depoziti",
  listing_boost: "Elan boost paketi"
} as const;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoicePrintPage({ params }: Props) {
  const { id } = await params;
  const user = await getServerSessionUser();
  if (!user) redirect(`/login?next=/me/invoices/${id}`);

  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  // Users can only view their own invoices (admins can view all via /admin/invoices)
  if (invoice.userId !== user.id && user.role !== "admin" && user.role !== "support") {
    notFound();
  }

  const issuedDate = new Date(invoice.issuedAt).toLocaleDateString("az-AZ", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toolbar - hidden on print */}
      <div className="print:hidden sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/me/payments" className="btn-secondary text-sm">← Ödənişlərə qayıt</Link>
            <span className="text-sm text-slate-500">{invoice.invoiceNumber}</span>
          </div>
          <PrintButton />
        </div>
      </div>

      {/* Invoice document */}
      <div className="mx-auto max-w-3xl px-4 py-10 print:py-0 print:max-w-none print:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm print:shadow-none print:border-none">

          {/* Header */}
          <div className="rounded-t-2xl bg-slate-900 px-10 py-8 print:rounded-none">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-bold text-white">
                  Ekomobil<span className="text-sky-400">.az</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">Azərbaycanın avtomobil marketplace-i</div>
                <div className="mt-3 text-xs text-slate-400">support@ekomobil.az</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-widest text-sky-400">İnvoys</div>
                <div className="mt-1 text-2xl font-extrabold text-white">{invoice.invoiceNumber}</div>
                <div className="mt-2 text-xs text-slate-400">Tarix: {issuedDate}</div>
              </div>
            </div>
          </div>

          {/* Bill to / meta */}
          <div className="flex items-start justify-between gap-8 border-b border-slate-100 px-10 py-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kiminə</div>
              <div className="mt-2 font-semibold text-slate-900">{invoice.userName || invoice.userEmail}</div>
              <div className="mt-0.5 text-sm text-slate-500">{invoice.userEmail}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ödəniş statusu</div>
              <div className="mt-2">
                <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                  Ödənilib
                </span>
              </div>
              {invoice.paymentReference && (
                <div className="mt-2 text-xs text-slate-400">Ref: {invoice.paymentReference}</div>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className="px-10 py-6">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-3 pl-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Xidmət</th>
                  <th className="py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Miqdar</th>
                  <th className="py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Vahid qiymət</th>
                  <th className="py-3 pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Cəmi</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-4 pl-4 text-slate-800">
                    <div className="font-medium">{PAYMENT_TYPE_LABELS[invoice.paymentType] ?? invoice.paymentType}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{invoice.description}</div>
                  </td>
                  <td className="py-4 text-center text-slate-600">1</td>
                  <td className="py-4 text-right text-slate-600">{invoice.amountAzn.toFixed(2)} ₼</td>
                  <td className="py-4 pr-4 text-right font-semibold text-slate-900">{invoice.amountAzn.toFixed(2)} ₼</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="px-10 pb-8">
            <div className="ml-auto w-64">
              <div className="flex items-center justify-between border-t-2 border-slate-900 pt-4">
                <span className="font-bold text-slate-900">Ümumi məbləğ</span>
                <span className="text-xl font-extrabold text-slate-900">{invoice.amountAzn.toFixed(2)} ₼</span>
              </div>
              <div className="mt-3 rounded-xl bg-emerald-50 py-2 text-center">
                <span className="text-sm font-bold text-emerald-700">Ödəniş təsdiqləndi</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="rounded-b-2xl border-t border-slate-100 px-10 py-5 text-center print:rounded-none">
            <p className="text-xs text-slate-400">
              Ekomobil.az · Bakı, Azərbaycan · support@ekomobil.az
            </p>
            <p className="mt-1 text-xs text-slate-300">
              Bu invoys {issuedDate} tarixində avtomatik olaraq yaradılmışdır.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
