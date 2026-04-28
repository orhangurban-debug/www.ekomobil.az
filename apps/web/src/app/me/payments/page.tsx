import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/auth";
import { listInvoicesForUser } from "@/server/invoice-store";

const PAYMENT_TYPE_LABELS = {
  listing_plan: "Elan planı",
  business_plan: "Biznes planı",
  auction_deposit: "Auksion depoziti"
} as const;

const STATUS_BADGE = {
  sent: { label: "Göndərilib", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Gözləyir", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  failed: { label: "Xəta", cls: "bg-red-50 text-red-700 border-red-200" }
};

export default async function PaymentsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/me/payments");

  const invoices = await listInvoicesForUser(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ödənişlərim</h1>
          <p className="mt-1 text-sm text-slate-500">Bütün tamamlanmış ödənişləriniz və invoyslarınız</p>
        </div>
        <Link href="/me" className="btn-secondary text-sm">Profilə qayıt</Link>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <div className="text-4xl">🧾</div>
          <p className="mt-4 font-medium text-slate-700">Hələ ödənişiniz yoxdur</p>
          <p className="mt-1 text-sm text-slate-500">Ödəniş etdikdən sonra invoyslarınız burada görünəcək</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const emailStatus = inv.emailSentAt ? "sent" : inv.emailError ? "failed" : "pending";
            const badge = STATUS_BADGE[emailStatus];
            return (
              <div key={inv.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{inv.invoiceNumber}</span>
                      <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 border-slate-200">
                        {PAYMENT_TYPE_LABELS[inv.paymentType] ?? inv.paymentType}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600 truncate">{inv.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                      <span>{new Date(inv.issuedAt).toLocaleDateString("az-AZ", { year: "numeric", month: "long", day: "numeric" })}</span>
                      {inv.paymentReference && <span>Ref: {inv.paymentReference}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <span className="text-lg font-bold text-slate-900">{inv.amountAzn.toFixed(2)} ₼</span>
                    <Link
                      href={`/me/invoices/${inv.id}`}
                      className="btn-secondary text-xs"
                    >
                      İnvoysı bax
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
