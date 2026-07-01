import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getKapitalBankConfig, getKapitalBankStatusLabel, isKapitalBankLiveReady } from "@/lib/kapital-bank";
import { getPlanById } from "@/lib/listing-plans";
import { getListingPlanPayment } from "@/server/payment-store";

export default async function ListingPlanPaymentPage({
  params,
  searchParams
}: {
  params: Promise<{ paymentId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { paymentId } = await params;
  const query = await searchParams;
  const payment = await getListingPlanPayment(paymentId);
  if (!payment) notFound();

  const config = getKapitalBankConfig();
  const plan = getPlanById(payment.planType);
  const isLiveReady = isKapitalBankLiveReady(config);
  const hostedPaymentUrl =
    !query.status && payment.status === "redirect_ready"
      ? payment.providerPayload?.paymentPageUrl
      : undefined;

  if (hostedPaymentUrl) {
    redirect(hostedPaymentUrl);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border glass-panel border-white/10 p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-[#0057FF]">Kapital Bank checkout</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Elan planı ödənişi</h1>
          <p className="mt-2 text-sm text-white/50">
            Ödəniş statusunu bu səhifədən izləyə bilərsiniz. Hosted checkout hazır olduqda bank səhifəsinə avtomatik yönləndirmə edilir.
          </p>
        </div>

        <dl className="grid gap-4 rounded-xl bg-white/5 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-white/50">Ödəniş ID</dt>
            <dd className="mt-1 font-mono text-white">{payment.id}</dd>
          </div>
          <div>
            <dt className="text-white/50">Status</dt>
            <dd className="mt-1 font-medium text-white">{getKapitalBankStatusLabel(payment)}</dd>
          </div>
          <div>
            <dt className="text-white/50">Provider rejimi</dt>
            <dd className="mt-1 font-medium text-white">{payment.providerMode ?? config.mode}</dd>
          </div>
          <div>
            <dt className="text-white/50">Plan</dt>
            <dd className="mt-1 font-medium text-white">{plan?.nameAz ?? payment.planType}</dd>
          </div>
          <div>
            <dt className="text-white/50">Məbləğ</dt>
            <dd className="mt-1 font-medium text-white">{payment.amountAzn} ₼</dd>
          </div>
        </dl>

        {payment.providerPayload && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
            Hosted redirect konteksti hazırlanıb. `liveReady`: {payment.providerPayload.liveReady ? "bəli" : "xeyr"}.
          </div>
        )}

        {query.status && (
          <div className="mt-4 rounded-xl alert-warning border px-4 py-3 text-sm text-amber-200">
            Son cavab: {query.status}
          </div>
        )}

        {payment.status === "succeeded" ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              Ödəniş təsdiqləndi. Elan planı aktivləşdirildi.
            </div>
            <Link href={`/listings/${payment.listingId}`} className="btn-primary">
              Elana keç
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {config.mode === "mock" ? (
              <>
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  `KAPITAL_BANK_MODE=mock` aktivdir. Aşağıdakı düymələr test məqsədi ilə callback nəticəsini simulyasiya edir.
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <form action={`/api/payments/listing-plan/${payment.id}/mock`} method="post" className="flex-1">
                    <input type="hidden" name="status" value="succeeded" />
                    <button type="submit" className="btn-primary w-full justify-center">
                      Mock success
                    </button>
                  </form>
                  <form action={`/api/payments/listing-plan/${payment.id}/mock`} method="post" className="flex-1">
                    <input type="hidden" name="status" value="failed" />
                    <button type="submit" className="btn-secondary w-full justify-center">
                      Mock fail
                    </button>
                  </form>
                </div>
              </>
            ) : isLiveReady ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                Ödəniş bankda tamamlandıqdan sonra status callback ilə yenilənir və plan avtomatik tətbiq olunur.
              </div>
            ) : (
              <div className="rounded-xl alert-warning border px-4 py-3 text-sm text-amber-200">
                Merchant məlumatları hələ əlavə olunmayıb. Bankla merchant reuse təsdiqlənən kimi bu checkout səhifəsi real
                Kapital Bank redirect axını ilə əvəz olunacaq.
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={`/listings/${payment.listingId}`} className="btn-secondary justify-center">
                Elana qayıt
              </Link>
              <Link href="/pricing" className="btn-secondary justify-center">
                Planlara bax
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
