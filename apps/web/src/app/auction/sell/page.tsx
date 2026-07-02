import Link from "next/link";
import { getServerSessionUser } from "@/lib/auth";
import { AuctionSellForm } from "@/components/auction/auction-sell-form";
import { meetsAuctionListingTrustGate } from "@/server/auction-store";
import { listListingsForUser } from "@/server/listing-store";
import { getDeepKycStatus } from "@/server/user-kyc-store";

export default async function AuctionSellPage() {
  const user = await getServerSessionUser();
  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm items-center justify-center px-4">
        <div className="card p-10 text-center">
          <h1 className="text-xl font-bold text-slate-900">Giriş tələb olunur</h1>
          <p className="mt-2 text-sm text-slate-500">Lot yaratmaq üçün hesabınıza daxil olun.</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/login?next=/auction/sell" className="btn-primary w-full justify-center">
              Daxil ol
            </Link>
            <Link href="/register" className="btn-secondary w-full justify-center">
              Qeydiyyat
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const listings = (await listListingsForUser(user.id)).filter(
    (item) => item.status !== "sold" && meetsAuctionListingTrustGate(item)
  );

  const listingKinds = new Set(listings.map((item) => item.listingKind ?? "vehicle"));
  const checklistVehicle = listingKinds.has("vehicle");
  const checklistPart = listingKinds.has("part");
  const deepKycStatus = await getDeepKycStatus(user.id);
  const deepKycApproved = deepKycStatus === "approved";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Lot yarat</h1>
        <p className="mt-2 text-sm text-slate-500">
          Lot məlumatlarının düzgünlüyü satıcının məsuliyyətindədir. Qalib alıcı ödənişi birbaşa satıcıya edir.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-900/10 bg-white/60 p-4 text-sm text-slate-600">
        <div className="flex flex-wrap gap-x-6 gap-y-1.5">
          {checklistVehicle && (
            <>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" />VIN daxil edilmiş olmalıdır (məcburi)</span>
            </>
          )}
          {checklistPart && (
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" />Hissə: VIN tələb olunmur</span>
          )}
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" />Media checklist tam olmalıdır (məcburi)</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" />Lot haqqı ödənməlidir</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" />Ödənilməmiş öhdəlik balansı varsa yeni lot bloklana bilər</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" />Yüksək risk lotlarda ekspertiza sənədi tələb oluna bilər</span>
        </div>
        <div className="mt-3 flex gap-4 text-xs">
          <Link href="/rules/auction" className="text-[#0057FF] hover:underline">Qaydalar</Link>
          <Link href="/partners/inspection" className="text-[#0057FF] hover:underline">Ekspertiza tərəfdaşı ol</Link>
          <Link href="/publish" className="text-[#0057FF] hover:underline">Elan yarat</Link>
          <Link href="/me" className="text-[#0057FF] hover:underline">Elanlarım</Link>
        </div>
      </div>

      <AuctionSellForm
        deepKycApproved={deepKycApproved}
        listings={listings.map((item) => ({
          id: item.id,
          title: item.title,
          priceAzn: item.priceAzn,
          status: item.status,
          make: item.make,
          model: item.model,
          year: item.year,
          city: item.city,
          mileageKm: item.mileageKm,
          fuelType: item.fuelType,
          transmission: item.transmission,
          vinProvided: Boolean(item.vinProvided),
          trustScore: item.trustScore,
          planType: item.planType,
          listingKind: item.listingKind ?? "vehicle",
          vinVerified: item.vinVerified,
          sellerVerified: item.sellerVerified,
          mediaComplete: item.mediaComplete
        }))}
      />
    </div>
  );
}
