import Link from "next/link";
import { notFound } from "next/navigation";
import { getKapitalBankConfig, isKapitalBankLiveReady } from "@/lib/kapital-bank";
import { getAuctionDeposit } from "@/server/auction-payment-store";

function getStatusLabel(status: string): string {
  switch (status) {
    case "held":
      return "Deposit təsdiqləndi";
    case "failed":
      return "Deposit uğursuz oldu";
    case "cancelled":
      return "Deposit ləğv edildi";
    case "redirect_ready":
      return "Checkout hazırdır";
    default:
      return "Deposit gözlənilir";
  }
}

export default async function AuctionDepositPage({
  params,
  searchParams
}: {
  params: Promise<{ depositId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { depositId } = await params;
  const query = await searchParams;
  const deposit = await getAuctionDeposit(depositId);
  if (!deposit) notFound();

  const config = getKapitalBankConfig();
  const isLiveReady = isKapitalBankLiveReady(config);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-brand-600">Kapital Bank skeleton</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Auksion bidder deposit</h1>
          <p className="mt-2 text-sm text-slate-500">
            Bu deposit əsas avtomobil ödənişi deyil. Yalnız auksion iştirak intizamı üçün xidmət ödənişidir.
          </p>
        </div>

        <dl className="grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Deposit ID</dt>
            <dd className="mt-1 font-mono text-slate-900">{deposit.id}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-1 font-medium text-slate-900">{getStatusLabel(deposit.status)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Provider rejimi</dt>
            <dd className="mt-1 font-medium text-slate-900">{deposit.providerMode ?? config.mode}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Auction ID</dt>
            <dd className="mt-1 font-mono text-slate-900">{deposit.auctionId}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Məbləğ</dt>
            <dd className="mt-1 font-medium text-slate-900">{deposit.amountAzn} ₼</dd>
          </div>
        </dl>

        {deposit.providerPayload && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Hosted redirect konteksti hazırlanıb. `liveReady`: {deposit.providerPayload.liveReady ? "bəli" : "xeyr"}.
          </div>
        )}

        {query.status && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Son cavab: {query.status}
          </div>
        )}

        {deposit.status === "held" ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Deposit təsdiqləndi. Əsas avtomobil ödənişi sonradan birbaşa satıcıya ediləcək.
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
                  `KAPITAL_BANK_MODE=mock` aktivdir. Aşağıdakı düymələr test məqsədi ilə deposit nəticəsini simulyasiya edir.
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <form action={`/api/payments/auction-deposit/${deposit.id}/mock`} method="post" className="flex-1">
                    <input type="hidden" name="status" value="succeeded" />
                    <button type="submit" className="btn-primary w-full justify-center">
                      Mock success
                    </button>
                  </form>
                  <form action={`/api/payments/auction-deposit/${deposit.id}/mock`} method="post" className="flex-1">
                    <input type="hidden" name="status" value="failed" />
                    <button type="submit" className="btn-secondary w-full justify-center">
                      Mock fail
                    </button>
                  </form>
                </div>
              </>
            ) : isLiveReady ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Real bank redirect inteqrasiyası bu skeleton-un növbəti mərhələsində qoşulacaq.
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
