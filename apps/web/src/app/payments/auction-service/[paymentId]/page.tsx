import Link from "next/link";
import { notFound } from "next/navigation";
import { getKapitalBankConfig, isKapitalBankLiveReady } from "@/lib/kapital-bank";
import { getAuctionServicePayment } from "@/server/auction-payment-store";
import { signInternalCallback } from "@/server/payments/kapital-bank-callback";

function getStatusLabel(status: string): string {
  switch (status) {
    case "succeeded": return "Ödəniş təsdiqləndi";
    case "failed": return "Ödəniş uğursuz oldu";
    case "cancelled": return "Ödəniş ləğv edildi";
    case "redirect_ready": return "Checkout hazırdır";
    default: return "Ödəniş gözlənilir";
  }
}

function getEventLabel(eventType: string): string {
  switch (eventType) {
    case "lot_fee": return "Auksion lot haqqı";
    case "seller_success_fee": return "Success fee invoice";
    case "no_show_penalty": return "No-show cəriməsi";
    case "seller_breach_penalty": return "Satıcı öhdəliyi pozulması — platforma cəriməsi";
    default: return eventType;
  }
}

export default async function AuctionServicePaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ paymentId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { paymentId } = await params;
  const query = await searchParams;
  const payment = await getAuctionServicePayment(paymentId);
  if (!payment) notFound();

  const config = getKapitalBankConfig();
  const isLiveReady = isKapitalBankLiveReady(config);

  // Pre-compute signed mock tokens server-side (never expose in client JS)
  const mockSuccessSig = signInternalCallback(payment.id, "succeeded");
  const mockFailSig = signInternalCallback(payment.id, "failed");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-brand-600">Kapital Bank skeleton</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{getEventLabel(payment.eventType)}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Bu səhifə auksion xidmət ödənişləri üçün daxili checkout placeholder rolunu oynayır.
          </p>
        </div>

        <dl className="grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Ödəniş ID</dt>
            <dd className="mt-1 font-mono text-slate-900">{payment.id}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-1 font-medium text-slate-900">{getStatusLabel(payment.status)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Provider rejimi</dt>
            <dd className="mt-1 font-medium text-slate-900">{payment.providerMode ?? config.mode}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Növ</dt>
            <dd className="mt-1 font-medium text-slate-900">{getEventLabel(payment.eventType)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Məbləğ</dt>
            <dd className="mt-1 font-medium text-slate-900">{payment.amountAzn} ₼</dd>
          </div>
        </dl>

        {query.status && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Son cavab: {query.status}
          </div>
        )}

        {payment.status === "succeeded" ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Xidmət ödənişi təsdiqləndi.
            </div>
            <Link href="/auction" className="btn-primary">
              Auksiona qayıt
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {config.mode === "mock" ? (
              <>
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  <code>KAPITAL_BANK_MODE=mock</code> aktivdir. Düymələr test üçün callback nəticəsini simulyasiya edir.
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <form action={`/api/payments/auction-service/${payment.id}/mock`} method="post" className="flex-1">
                    <input type="hidden" name="status" value="succeeded" />
                    <input type="hidden" name="signature" value={mockSuccessSig} />
                    <button type="submit" className="btn-primary w-full justify-center">
                      Mock success
                    </button>
                  </form>
                  <form action={`/api/payments/auction-service/${payment.id}/mock`} method="post" className="flex-1">
                    <input type="hidden" name="status" value="failed" />
                    <input type="hidden" name="signature" value={mockFailSig} />
                    <button type="submit" className="btn-secondary w-full justify-center">
                      Mock fail
                    </button>
                  </form>
                </div>
              </>
            ) : isLiveReady ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Real Kapital Bank redirect bu skeleton-un növbəti mərhələsində qoşulacaq.
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Merchant məlumatları hələ əlavə olunmayıb. Bank inteqrasiyası hazır olduqdan sonra bu səhifə real checkout ilə əvəz olunacaq.
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/auction" className="btn-secondary justify-center">
                Auksiona qayıt
              </Link>
              <Link href="/pricing#auction" className="btn-secondary justify-center">
                Haqlara bax
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
