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
        <p className="text-sm font-medium text-brand-600">Auksion Seller Flow</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Lot yarat</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          EkoMobil yalnız auksion infrastrukturunu və trust qatını təqdim edir. Avtomobilin əsas satış ödənişi
          platformadan keçmir; qalib alıcı onu birbaşa satıcıya ödəyir.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        <div className="font-semibold text-slate-900">Lot üçün ilkin şərtlər</div>
        <p className="mt-2 text-xs text-slate-500">
          Aşağıdakı siyahı seçdiyiniz elanın növünə uyğundur (avtomobil və ya hissə).
        </p>
        {checklistVehicle && (
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li className="font-medium text-slate-800">Avtomobil elanı</li>
            <li className="ml-0">VIN doğrulaması tamamlanmış olmalıdır</li>
            <li className="ml-0">Satıcı doğrulaması tamamlanmış olmalıdır</li>
            <li className="ml-0">Media checklist tam olmalıdır</li>
          </ul>
        )}
        {checklistPart && (
          <ul className={`mt-3 list-disc space-y-1 pl-5 ${checklistVehicle ? "border-t border-slate-200 pt-3" : ""}`}>
            <li className="font-medium text-slate-800">Avtomobil hissəsi elanı</li>
            <li className="ml-0">VIN tələb olunmur</li>
            <li className="ml-0">Satıcı doğrulaması tamamlanmış olmalıdır</li>
            <li className="ml-0">Media checklist tam olmalıdır</li>
          </ul>
        )}
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Lot haqqı ödənmədən hərrac aktivləşmir</li>
          <li>Yüksək dəyərli lotlarda deep KYC və ya satıcı performans bond tələb oluna bilər</li>
          <li>Satışın daha sürətli getməsi üçün VIN məlumat linki və servis tarixçə linki əlavə etmək tövsiyə olunur</li>
        </ul>
      </div>

      <div className="mb-6 rounded-2xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-5 text-sm text-slate-700">
        <div className="font-semibold text-slate-900">Sənədlər</div>
        <p className="mt-2 leading-relaxed">
          Tələb olunan sənədləri <strong>satıcı özü yükləyir və təqdim edir</strong>; platforma onları toplamır. Tərəfimizdən
          təhlükəsiz saxlama, moderasiya və auksion üçün uyğunluq yoxlaması tətbiq olunur. Elan üzrə etibar siqnalları (VIN
          avtomobil üçün, satıcı, media) tamamlanmalıdır. Lot yaradıldıqdan sonra həmin lotun ID-si ilə{" "}
          <span className="font-medium text-slate-800">/auction/&lt;lot-id&gt;/documents</span> səhifəsindən sənəd yükləyə
          bilərsiniz.
        </p>
        <p className="mt-3">
          <Link href="/rules/auction" className="font-medium text-[#0891B2] hover:underline">
            Auksion çərçivəsi — sənəd siyasəti
          </Link>
          <span className="text-slate-400"> · </span>
          <Link href="/publish" className="font-medium text-[#0891B2] hover:underline">
            Elan yarat / yenilə
          </Link>
          <span className="text-slate-400"> · </span>
          <Link href="/me" className="font-medium text-[#0891B2] hover:underline">
            Profil və elanlarım
          </Link>
        </p>
      </div>

      <AuctionSellForm
        deepKycApproved={deepKycApproved}
        listings={listings.map((item) => ({
          id: item.id,
          title: item.title,
          priceAzn: item.priceAzn,
          status: item.status,
          listingKind: item.listingKind ?? "vehicle",
          vinVerified: item.vinVerified,
          sellerVerified: item.sellerVerified,
          mediaComplete: item.mediaComplete
        }))}
      />
    </div>
  );
}
