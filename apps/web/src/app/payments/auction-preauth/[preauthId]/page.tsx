import Link from "next/link";
import { notFound } from "next/navigation";
import { getKapitalBankConfig, isKapitalBankLiveReady } from "@/lib/kapital-bank";
import { getAuctionPreauth } from "@/server/auction-preauth-store";
import { signInternalCallback } from "@/server/payments/kapital-bank-callback";

function getStatusLabel(status: string): string {
  switch (status) {
    case "held": return "Kart hold təsdiqləndi";
    case "failed": return "Kart hold uğursuz oldu";
    case "voided": return "Kart hold ləğv edildi";
    default: return "Kart hold gözlənilir";
  }
}

export default async function AuctionPreauthPage({
  params,
  searchParams,
}: {
  params: Promise<{ preauthId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { preauthId } = await params;
  const query = await searchParams;
  const preauth = await getAuctionPreauth(preauthId);
  if (!preauth) notFound();

  const config = getKapitalBankConfig();
  const isLiveReady = isKapitalBankLiveReady(config);
  const mockSuccessSig = signInternalCallback(preauth.id, "held");
  const mockFailSig = signInternalCallback(preauth.id, "failed");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-brand-600">Auksion pre-auth</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Bid üçün kart hold</h1>
          <p className="mt-2 text-sm text-slate-500">
            Bu əməliyyat əsas satış ödənişi deyil. Yalnız auksion iştirak öhdəliyini təsdiqləyən kart hold əməliyyatıdır.
          </p>
        </div>

        <dl className="grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Pre-auth ID</dt>
            <dd className="mt-1 font-mono text-slate-900">{preauth.id}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-1 font-medium text-slate-900">{getStatusLabel(preauth.status)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Auction ID</dt>
            <dd className="mt-1 font-mono text-slate-900">{preauth.auctionId}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Məbləğ</dt>
            <dd className="mt-1 font-medium text-slate-900">{preauth.amountAzn} ₼</dd>
          </div>
        </dl>

        {query.status && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Son cavab: {query.status}
          </div>
        )}

        {preauth.status === "held" ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Kart hold təsdiqləndi. İndi lot səhifəsinə qayıdıb bid verə bilərsiniz.
            </div>
            <Link href={`/auction/${preauth.auctionId}`} className="btn-primary">
              Lota qayıt
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {config.mode === "mock" ? (
              <>
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  <code>KAPITAL_BANK_MODE=mock</code> aktivdir. Düymələr test üçün kart hold nəticəsini simulyasiya edir.
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <form action={`/api/payments/auction-preauth/${preauth.id}/mock`} method="post" className="flex-1">
                    <input type="hidden" name="status" value="held" />
                    <input type="hidden" name="signature" value={mockSuccessSig} />
                    <button type="submit" className="btn-primary w-full justify-center">
                      Mock success
                    </button>
                  </form>
                  <form action={`/api/payments/auction-preauth/${preauth.id}/mock`} method="post" className="flex-1">
                    <input type="hidden" name="status" value="failed" />
                    <input type="hidden" name="signature" value={mockFailSig} />
                    <button type="submit" className="btn-secondary w-full justify-center">
                      Mock fail
                    </button>
                  </form>
                </div>
              </>
            ) : isLiveReady && preauth.checkoutUrl ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Real checkout hazırdır. Bank səhifəsində kart hold əməliyyatını tamamlayın.
                </div>
                <Link href={preauth.checkoutUrl} className="btn-primary">
                  Bank checkout-a keç
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Merchant məlumatları hələ əlavə olunmayıb. Bank inteqrasiyası hazır olduqdan sonra bu səhifə real checkout ilə işləyəcək.
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={`/auction/${preauth.auctionId}`} className="btn-secondary justify-center">
                Lota qayıt
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
