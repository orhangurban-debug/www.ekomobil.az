import Link from "next/link";
import { notFound } from "next/navigation";
import { getKapitalBankConfig, isKapitalBankLiveReady } from "@/lib/kapital-bank";
import { getBusinessPlanPayment } from "@/server/business-plan-payment-store";
import { DEALER_PLANS } from "@/lib/dealer-plans";
import { PARTS_STORE_PLANS } from "@/lib/parts-store-plans";

function getPlanLabel(businessType: "dealer" | "parts_store", planId: string): string {
  if (businessType === "dealer") {
    return DEALER_PLANS.find((item) => item.id === planId)?.nameAz ?? planId;
  }
  return PARTS_STORE_PLANS.find((item) => item.id === planId)?.nameAz ?? planId;
}

export default async function BusinessPlanPaymentPage({
  params,
  searchParams
}: {
  params: Promise<{ paymentId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { paymentId } = await params;
  const query = await searchParams;
  const payment = await getBusinessPlanPayment(paymentId);
  if (!payment) notFound();

  const config = getKapitalBankConfig();
  const isLiveReady = isKapitalBankLiveReady(config);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-brand-600">Kapital Bank / BirPay</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Biznes plan abunə ödənişi</h1>
          <p className="mt-2 text-sm text-slate-500">
            Salon və mağaza aylıq abunə planları üçün checkout səhifəsi.
          </p>
        </div>

        <dl className="grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Ödəniş ID</dt>
            <dd className="mt-1 font-mono text-slate-900">{payment.id}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-1 font-medium text-slate-900">{payment.status}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Biznes tipi</dt>
            <dd className="mt-1 font-medium text-slate-900">{payment.businessType === "dealer" ? "Salon" : "Mağaza"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Plan</dt>
            <dd className="mt-1 font-medium text-slate-900">{getPlanLabel(payment.businessType, payment.planId)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Məbləğ</dt>
            <dd className="mt-1 font-medium text-slate-900">{payment.amountAzn} ₼</dd>
          </div>
          <div>
            <dt className="text-slate-500">Provider rejimi</dt>
            <dd className="mt-1 font-medium text-slate-900">{payment.providerMode ?? config.mode}</dd>
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
              Abunə ödənişi təsdiqləndi və plan aktivləşdirildi.
            </div>
            <Link href={payment.businessType === "dealer" ? "/dealer" : "/parts"} className="btn-primary">
              Davam et
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {config.mode === "mock" ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <form action={`/api/payments/business-plan/${payment.id}/mock`} method="post" className="flex-1">
                  <input type="hidden" name="status" value="succeeded" />
                  <button type="submit" className="btn-primary w-full justify-center">Mock success</button>
                </form>
                <form action={`/api/payments/business-plan/${payment.id}/mock`} method="post" className="flex-1">
                  <input type="hidden" name="status" value="failed" />
                  <button type="submit" className="btn-secondary w-full justify-center">Mock fail</button>
                </form>
              </div>
            ) : isLiveReady ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Live merchant məlumatları hazırdır. Redirect checkotu ilə bank ödənişini tamamlayın.
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Merchant məlumatları olmadan real checkout mümkün deyil.
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={payment.businessType === "dealer" ? "/dealer" : "/parts"} className="btn-secondary justify-center">
                Geri qayıt
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
