import Link from "next/link";
import { LISTING_PLANS } from "@/lib/listing-plans";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="mb-8 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Ana səhifə</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Elan qiymətləri</span>
      </nav>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900">Elan qiymət planları</h1>
        <p className="mt-3 text-slate-600">
          Elanınızı daha çox alıcıya çatdırmaq üçün plan seçin. Hər elan 30 gün aktivdir.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {LISTING_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`card p-6 flex flex-col ${
              plan.id === "vip"
                ? "ring-2 ring-[#0891B2] relative"
                : ""
            }`}
          >
            {plan.id === "vip" && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0891B2] px-3 py-0.5 text-xs font-semibold text-white">
                Ən populyar
              </span>
            )}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">{plan.nameAz}</h2>
              <div className="mt-2">
                <span className="text-3xl font-bold text-[#0891B2]">
                  {plan.priceAzn === 0 ? "Pulsuz" : `${plan.priceAzn} ₼`}
                </span>
                {plan.priceAzn > 0 && (
                  <span className="text-slate-500 text-sm"> / 30 gün</span>
                )}
              </div>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 flex-1">
              {plan.id === "free" && (
                <>
                  <li>✓ Standart sıralanma</li>
                  <li>✓ 30 gün aktiv</li>
                  <li>✓ Əsas axtarış nəticələrində görünmə</li>
                </>
              )}
              {plan.id === "standard" && (
                <>
                  <li>✓ Vurğulanmış kart</li>
                  <li>✓ 1.5x prioritet sıralamada</li>
                  <li>✓ Baxış statistikası</li>
                  <li>✓ 30 gün aktiv</li>
                </>
              )}
              {plan.id === "vip" && (
                <>
                  <li>✓ Ön səhifədə üstünlük</li>
                  <li>✓ 3x prioritet sıralamada</li>
                  <li>✓ Vurğulanmış görünüş</li>
                  <li>✓ Baxış statistikası</li>
                  <li>✓ 30 gün aktiv</li>
                </>
              )}
            </ul>
            <Link
              href="/publish"
              className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                plan.id === "free"
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-[#0891B2] text-white hover:bg-[#0e7490]"
              }`}
            >
              {plan.priceAzn === 0 ? "Pulsuz yerləşdir" : "Plan seç"}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="font-semibold text-slate-900">Mövcud elanı irəli çəkmək</h2>
        <p className="mt-2 text-sm text-slate-600">
          Artıq yerləşdirdiyiniz elanı Standart və ya VIP plana yüksəltə bilərsiniz. Elan səhifəsində və ya{" "}
          <Link href="/me" className="text-[#0891B2] hover:underline">profil panelinizdə</Link>{" "}
          &quot;İrəli çək&quot; düyməsindən istifadə edin.
        </p>
      </div>

      <div className="mt-8">
        <Link href="/publish" className="btn-primary">
          Elan yerləşdir
        </Link>
      </div>
    </div>
  );
}
