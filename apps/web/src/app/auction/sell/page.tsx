import Link from "next/link";
import { getServerSessionUser } from "@/lib/auth";
import { AuctionSellForm } from "@/components/auction/auction-sell-form";
import { listListingsForUser } from "@/server/listing-store";

export default async function AuctionSellPage() {
  const user = await getServerSessionUser();
  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4">
        <div className="card p-10 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Auksion lotu yarat</h1>
          <p className="mt-3 text-sm text-slate-500">
            Auksion lotu yaratmaq üçün əvvəlcə hesabınıza daxil olun.
          </p>
          <Link href="/login?next=%2Fauction%2Fsell" className="btn-primary mt-6 w-full justify-center">
            Daxil ol
          </Link>
        </div>
      </div>
    );
  }

  const listings = (await listListingsForUser(user.id)).filter(
    (item) => item.status !== "sold" && item.vinVerified && item.sellerVerified && item.mediaComplete
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-brand-600">Auksion Seller Flow</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Lot yarat</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          EkoMobil yalnız auksion infrastrukturunu və trust qatını təqdim edir. Avtomobilin əsas satış ödənişi
          platformadan keçmir; qalib alıcı onu birbaşa satıcıya ödəyir.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        <div className="font-semibold text-slate-900">Lot üçün ilkin şərtlər</div>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>VIN doğrulaması tamamlanmış olmalıdır</li>
          <li>Satıcı doğrulaması tamamlanmış olmalıdır</li>
          <li>Media checklist tam olmalıdır</li>
          <li>Lot haqqı ödənmədən hərrac aktivləşmir</li>
        </ul>
      </div>

      <AuctionSellForm
        listings={listings.map((item) => ({
          id: item.id,
          title: item.title,
          priceAzn: item.priceAzn,
          status: item.status,
          vinVerified: item.vinVerified,
          sellerVerified: item.sellerVerified,
          mediaComplete: item.mediaComplete
        }))}
      />
    </div>
  );
}
