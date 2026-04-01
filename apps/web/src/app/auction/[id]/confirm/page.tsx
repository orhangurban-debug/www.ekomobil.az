import Link from "next/link";
import { notFound } from "next/navigation";
import { AuctionConfirmationPanel } from "@/components/auction/auction-confirmation-panel";
import { DisputeEvidenceManager } from "@/components/auction/dispute-evidence-manager";
import { getServerSessionUser } from "@/lib/auth";
import { getAuctionStatusLabel } from "@/lib/auction";
import { getAuctionListingForRead } from "@/server/auction-read-model";

export default async function AuctionConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [auction, user] = await Promise.all([
    getAuctionListingForRead(id),
    getServerSessionUser(),
  ]);
  if (!auction) notFound();

  const winnerUserId = auction.winnerUserId ?? auction.currentBidderUserId;
  const canActAsBuyer = Boolean(user && winnerUserId && user.id === winnerUserId);
  const canActAsSeller = Boolean(user && user.id === auction.sellerUserId);
  const isDisputed = auction.status === "disputed";
  const relistAllowedStatuses = new Set([
    "ended_pending_confirmation",
    "completed",
    "not_met_reserve",
    "pending_seller_approval",
    "no_show",
    "seller_breach",
    "disputed",
    "cancelled"
  ]);
  const canRelist = canActAsSeller && relistAllowedStatuses.has(auction.status);

  const uploaderRole = canActAsBuyer ? "buyer" : canActAsSeller ? "seller" : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-brand-600">Post-auction settlement</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Satış nəticəsini təsdiqlə</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Bu ekran avtomobilin tam ödənişini qəbul etmir. Burada yalnız alıcı və satıcı off-platform
            satışın nəticəsini qeyd edir. Platforma yalnız öz xidmət haqları üzrə tərəfdir.
          </p>
        </div>

        <dl className="grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Auksion ID</dt>
            <dd className="mt-1 font-mono text-slate-900">{auction.id}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-1 font-medium text-slate-900">{getAuctionStatusLabel(auction.status)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Lot</dt>
            <dd className="mt-1 font-medium text-slate-900">{auction.titleSnapshot}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Cari / qalib bid</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {(auction.currentBidAzn ?? auction.startingBidAzn).toLocaleString("az-AZ")} ₼
            </dd>
          </div>
        </dl>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Əsas satış ödənişi bank köçürməsi, notariat və ya tərəflərin razılaşdığı birbaşa üsulla
          tamamlanmalıdır. EkoMobil bu məbləği qəbul etmir və saxlamır.
        </div>

        <div className="mt-6">
          <AuctionConfirmationPanel
            auctionId={auction.id}
            auctionStatus={auction.status}
            canActAsBuyer={canActAsBuyer}
            canActAsSeller={canActAsSeller}
            canRelist={canRelist}
          />
        </div>

        {/* Dispute evidence section — visible only when disputed and user is a party */}
        {isDisputed && uploaderRole && (
          <div className="mt-8">
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <p className="font-semibold">Mübahisə açıqdır</p>
              <p className="mt-1 text-red-800">
                Aşağıdan mübahisənizi dəstəkləyən sübut faylları (foto, PDF, mesaj ekranı s.) yükləyin.
                Ops komandası hər iki tərəfin sübutlarını nəzərdən keçirəcək.
              </p>
            </div>
            <h2 className="mb-4 text-base font-semibold text-slate-900">Mübahisə sübutları</h2>
            <DisputeEvidenceManager auctionId={auction.id} uploaderRole={uploaderRole} />
          </div>
        )}

        {!canActAsBuyer && !canActAsSeller && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Bu təsdiq addımı yalnız qalib alıcı və ya satıcı üçün açıqdır.
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/auction" className="btn-secondary">
            Auksiona qayıt
          </Link>
          <Link href="/pricing#auction" className="btn-secondary">
            Haq strukturu
          </Link>
        </div>
      </div>
    </div>
  );
}
