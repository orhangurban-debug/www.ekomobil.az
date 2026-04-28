import Link from "next/link";
import { listAllInvoices, countAllInvoices } from "@/server/invoice-store";

const PAYMENT_TYPE_LABELS = {
  listing_plan: "Elan planı",
  business_plan: "Biznes planı",
  auction_deposit: "Auksion depoziti",
  listing_boost: "Elan boost paketi"
} as const;

export default async function AdminInvoicesPage() {
  const [invoices, total] = await Promise.all([
    listAllInvoices(100, 0),
    countAllInvoices()
  ]);

  const totalRevenueAzn = invoices.reduce((sum, inv) => sum + inv.amountAzn, 0);
  const sentCount = invoices.filter((inv) => inv.emailSentAt).length;
  const failedCount = invoices.filter((inv) => inv.emailError && !inv.emailSentAt).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">İnvoys idarəsi</h2>
        <p className="mt-1 text-sm text-slate-500">Bütün ödəniş invoysları və e-poçt göndərmə statusu</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ümumi invoys</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ümumi məbləğ</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalRevenueAzn.toFixed(2)} ₼</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">E-poçt göndərildi</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{sentCount}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Göndərilmədi</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{failedCount}</p>
        </div>
      </div>

      {/* Invoices table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {invoices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">Hələ heç bir invoys yoxdur</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">İnvoys №</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">İstifadəçi</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Növ</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Məbləğ</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">E-poçt</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Tarix</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const emailOk = !!inv.emailSentAt;
                const emailFail = !!inv.emailError && !inv.emailSentAt;
                return (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-slate-900 truncate max-w-[160px]">{inv.userName || inv.userEmail}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{inv.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {PAYMENT_TYPE_LABELS[inv.paymentType] ?? inv.paymentType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{inv.amountAzn.toFixed(2)} ₼</td>
                    <td className="px-4 py-3 text-center">
                      {emailOk ? (
                        <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Göndərildi</span>
                      ) : emailFail ? (
                        <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700" title={inv.emailError}>
                          Yenidən göndəriləcək
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">Gözləyir</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400">
                      {new Date(inv.issuedAt).toLocaleDateString("az-AZ")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/me/invoices/${inv.id}`}
                        className="text-xs font-medium text-brand-600 hover:underline"
                        target="_blank"
                      >
                        Aç →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
