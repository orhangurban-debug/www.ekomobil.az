import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getKapitalBankConfig, isKapitalBankLiveReady } from "@/lib/kapital-bank";
import { getBoostPackageById } from "@/server/listing-boost-store";
import { getListingBoostPayment } from "@/server/listing-boost-payment-store";

export default async function ListingBoostPaymentPage({
  params,
  searchParams
}: {
  params: Promise<{ paymentId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { paymentId } = await params;
  const query = await searchParams;
  const payment = await getListingBoostPayment(paymentId);
  if (!payment) notFound();

  const config = getKapitalBankConfig();
  const pkg = getBoostPackageById(payment.boostPackageId);
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
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-brand-600">Kapital Bank checkout</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Elan boost ödənişi</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ödəniş statusunu bu səhifədən izləyə bilərsiniz. Hosted checkout hazır olduqda bank səhifəsinə avtomatik yönləndirmə edilir.
          </p>
        </div>

        <dl className="grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Ödəniş ID</dt>
            <dd className="mt-1 font-mono text-slate-900">{payment.id}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-1 font-medium capitalize text-slate-900">{payment.status.replaceAll("_", " ")}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Provider rejimi</dt>
            <dd className="mt-1 font-medium text-slate-900">{payment.providerMode ?? config.mode}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Paket</dt>
            <dd className="mt-1 font-medium text-slate-900">{pkg?.nameAz ?? payment.boostPackageId}</dd>
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
              Ödəniş təsdiqləndi. Boost paketi aktivləşdirildi.
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
                  <form action={`/api/payments/listing-boost/${payment.id}/mock`} method="post" className="flex-1">
                    <input type="hidden" name="status" value="succeeded" />
                    <button type="submit" className="btn-primary w-full justify-center">
                      Mock success
                    </button>
                  </form>
                  <form action={`/api/payments/listing-boost/${payment.id}/mock`} method="post" className="flex-1">
                    <input type="hidden" name="status" value="failed" />
                    <button type="submit" className="btn-secondary w-full justify-center">
                      Mock fail
                    </button>
                  </form>
                </div>
              </>
            ) : isLiveReady ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Ödəniş bankda tamamlandıqdan sonra status callback ilə yenilənir və boost paketi avtomatik tətbiq olunur.
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Merchant məlumatları hələ əlavə olunmayıb. Parametrləri tamamladıqdan sonra hosted redirect işə düşəcək.
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={`/listings/${payment.listingId}`} className="btn-secondary justify-center">
                Elana qayıt
              </Link>
              <Link href="/pricing#boost" className="btn-secondary justify-center">
                Paketlərə bax
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
