import Link from "next/link";
import { LISTING_PLANS } from "@/lib/listing-plans";
import { DEALER_PLANS } from "@/lib/dealer-plans";
import type { ListingKind } from "@/lib/marketplace-types";
import {
  AUCTION_FEES,
  calcSellerCommission,
  calcTotalSellerCost,
  getLotListingFeeAzn,
  getNoShowPenaltyAzn,
  getSellerBreachPenaltyAzn
} from "@/lib/auction-fees";

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function SectionHeader({ label, title, sub }: { label: string; title: string; sub: string }) {
  return (
    <div className="mb-10 text-center">
      <span className="inline-block rounded-full bg-[#0891B2]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#0891B2]">
        {label}
      </span>
      <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
      <p className="mt-2 text-slate-500">{sub}</p>
    </div>
  );
}

type AuctionCategoryStyle = {
  headerClass: string;
  borderClass: string;
  ringClass: string;
};

const AUCTION_CATEGORY_STYLES: Record<ListingKind, AuctionCategoryStyle> = {
  vehicle: {
    headerClass: "bg-[#0891B2]/10 border-[#0891B2]/20",
    borderClass: "border-[#0891B2]/25",
    ringClass: "ring-1 ring-[#0891B2]/15"
  },
  part: {
    headerClass: "bg-fuchsia-500/10 border-fuchsia-500/20",
    borderClass: "border-fuchsia-500/25",
    ringClass: "ring-1 ring-fuchsia-500/15"
  }
};

function AuctionFeeRow({
  title,
  value,
  who,
  desc
}: {
  title: string;
  value: string;
  who: string;
  desc: string;
}) {
  return (
    <div className="py-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-600">{who}</p>
          <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{desc}</p>
        </div>
        <div className="shrink-0 text-xl font-bold tabular-nums text-slate-900 sm:text-right sm:pt-0.5">
          {value}
        </div>
      </div>
    </div>
  );
}

function NumberedSteps({ title, id, steps }: { title: string; id: string; steps: string[] }) {
  return (
    <div id={id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-slate-600 marker:font-semibold marker:text-[#0891B2]">
        {steps.map((s) => (
          <li key={s} className="leading-relaxed">
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

function AuctionCategoryPanel({
  kind,
  title,
  subtitle,
  exampleSaleAzn,
  exampleLabel
}: {
  kind: ListingKind;
  title: string;
  subtitle: string;
  exampleSaleAzn: number;
  exampleLabel: string;
}) {
  const s = AUCTION_CATEGORY_STYLES[kind];
  const lot = getLotListingFeeAzn(kind);
  const comm = calcSellerCommission(exampleSaleAzn, kind);
  const total = calcTotalSellerCost(exampleSaleAzn, kind);
  const ratePct =
    kind === "vehicle"
      ? (AUCTION_FEES.SELLER_COMMISSION_VEHICLE_RATE * 100).toFixed(1)
      : (AUCTION_FEES.SELLER_COMMISSION_PART_RATE * 100).toFixed(1);
  const minCap =
    kind === "vehicle"
      ? `${AUCTION_FEES.SELLER_COMMISSION_VEHICLE_MIN_AZN} ₼, max ${AUCTION_FEES.SELLER_COMMISSION_VEHICLE_CAP_AZN} ₼`
      : `${AUCTION_FEES.SELLER_COMMISSION_PART_MIN_AZN} ₼, max ${AUCTION_FEES.SELLER_COMMISSION_PART_CAP_AZN} ₼`;

  return (
    <div
      id={kind === "vehicle" ? "auction-vehicle" : "auction-part"}
      className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-white shadow-sm ${s.borderClass} ${s.ringClass}`}
    >
      <div className={`border-b px-5 py-4 ${s.headerClass}`}>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>

      <div className="divide-y divide-slate-100 px-5">
        <AuctionFeeRow
          title="Lot yerləşdirmə"
          value={`${lot} ₼`}
          who="Satıcı ödəyir"
          desc={
            kind === "vehicle"
              ? "VIN yoxlama + ekspertiza axını üçün"
              : "Hissə elanları üçün aşağı giriş xərci"
          }
        />
        <AuctionFeeRow
          title="Satış komisyonu"
          value={`${ratePct}%`}
          who="Satıcıdan — yalnız uğurlu satışda"
          desc={`Min ${minCap}`}
        />
        <AuctionFeeRow
          title="No-show cəriməsi"
          value={`${getNoShowPenaltyAzn(kind)} ₼`}
          who="Qalib alıcı (ödənişi o, linki satıcı yarada bilər)"
          desc="Təhvil/ödəniş öhdəliyi pozulduqda. Tutulma: aşağıdakı “Intizam ödənişləri”."
        />
        <AuctionFeeRow
          title="Satıcı pozuntusu"
          value={`${getSellerBreachPenaltyAzn(kind)} ₼`}
          who="Satıcı (ödənişi o, linki qalib alıcı yarada bilər)"
          desc="Satış öhdəliyi pozulduqda. Tutulma: eyni bölmədə."
        />
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nümunə hesab</p>
        <p className="mt-1 text-xs text-slate-500">{exampleLabel}</p>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-white px-2 py-2 shadow-sm ring-1 ring-slate-100">
            <dt className="text-[10px] text-slate-400">Lot</dt>
            <dd className="mt-0.5 text-sm font-bold text-slate-900">{lot.toLocaleString("az-AZ")} ₼</dd>
          </div>
          <div className="rounded-lg bg-white px-2 py-2 shadow-sm ring-1 ring-slate-100">
            <dt className="text-[10px] text-slate-400">Komisyon</dt>
            <dd className="mt-0.5 text-sm font-bold text-slate-900">{comm.toLocaleString("az-AZ")} ₼</dd>
          </div>
          <div className="rounded-lg bg-white px-2 py-2 shadow-sm ring-1 ring-slate-100">
            <dt className="text-[10px] text-slate-400">Cəmi</dt>
            <dd className="mt-0.5 text-sm font-bold text-slate-900">{total.toLocaleString("az-AZ")} ₼</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="bg-slate-50">
      {/* ─── Page hero ─────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white px-4 py-14 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Şəffaf qiymət siyasəti
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-500">
          Sadə və aydın qiymətlər. Gizli ödəniş yoxdur.
        </p>
      </div>

      <div className="mx-auto max-w-5xl space-y-20 px-4 py-16 sm:px-6 lg:px-8">

        {/* ─── 1. Listing plans ──────────────────────────────────────── */}
        <section id="listings" className="scroll-mt-20">
          <SectionHeader
            label="Fərdi & dealer elanları"
            title="Elan qiymət planları"
            sub="Elanınızı daha çox alıcıya çatdırmaq üçün plan seçin. Hər elan 30 gün aktivdir."
          />

          <div className="grid gap-5 sm:grid-cols-3">
            {LISTING_PLANS.map((plan) => {
              const isVip = plan.id === "vip";
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
                    isVip
                      ? "border-[#0891B2] shadow-[0_0_0_1px_rgba(8,145,178,0.4),0_8px_32px_rgba(8,145,178,0.12)]"
                      : "border-slate-200 shadow-sm"
                  }`}
                >
                  {isVip && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0891B2] px-3 py-1 text-xs font-bold text-white shadow">
                      Ən populyar
                    </span>
                  )}
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-slate-900">{plan.nameAz}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className={`text-3xl font-bold ${isVip ? "text-[#0891B2]" : "text-slate-900"}`}>
                        {plan.priceAzn === 0 ? "Pulsuz" : `${plan.priceAzn} ₼`}
                      </span>
                      {plan.priceAzn > 0 && (
                        <span className="text-sm text-slate-400">/ 30 gün</span>
                      )}
                    </div>
                  </div>

                  <ul className="flex-1 space-y-2.5 text-sm text-slate-600">
                    {plan.id === "free" && (
                      <>
                        <li className="flex items-center gap-2"><CheckIcon />Standart sıralanma</li>
                        <li className="flex items-center gap-2"><CheckIcon />30 gün aktiv</li>
                        <li className="flex items-center gap-2"><CheckIcon />Əsas axtarış görünüşü</li>
                      </>
                    )}
                    {plan.id === "standard" && (
                      <>
                        <li className="flex items-center gap-2"><CheckIcon />Vurğulanmış kart</li>
                        <li className="flex items-center gap-2"><CheckIcon />1.5× prioritet sıralama</li>
                        <li className="flex items-center gap-2"><CheckIcon />Baxış statistikası</li>
                        <li className="flex items-center gap-2"><CheckIcon />30 gün aktiv</li>
                      </>
                    )}
                    {plan.id === "vip" && (
                      <>
                        <li className="flex items-center gap-2"><CheckIcon />Ön səhifə üstünlüyü</li>
                        <li className="flex items-center gap-2"><CheckIcon />3× prioritet sıralama</li>
                        <li className="flex items-center gap-2"><CheckIcon />Vurğulanmış görünüş + ribbon</li>
                        <li className="flex items-center gap-2"><CheckIcon />Baxış & klik statistikası</li>
                        <li className="flex items-center gap-2"><CheckIcon />30 gün aktiv</li>
                      </>
                    )}
                  </ul>

                  <Link
                    href="/publish"
                    className={`mt-6 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                      plan.priceAzn === 0
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-[#0891B2] text-white hover:bg-[#0e7490]"
                    }`}
                  >
                    {plan.priceAzn === 0 ? "Pulsuz yerləşdir" : "Plan seç"}
                  </Link>
                </div>
              );
            })}
          </div>

        </section>

        {/* ─── 2. Dealer plans ───────────────────────────────────────── */}
        <section id="dealer" className="scroll-mt-20">
          <SectionHeader
            label="Avtomobil salonları"
            title="Salon abunə planları"
            sub="Aylıq sabit ödəniş ilə bütün inventarınızı idarə edin. Elan boost-ları ayrıca hesablanır."
          />

          <div className="grid gap-5 sm:grid-cols-3">
            {DEALER_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
                  plan.highlight
                    ? "border-[#0891B2] shadow-[0_0_0_1px_rgba(8,145,178,0.4),0_8px_32px_rgba(8,145,178,0.12)]"
                    : "border-slate-200 shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0891B2] px-3 py-1 text-xs font-bold text-white shadow">
                    Ən populyar
                  </span>
                )}
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-slate-900">{plan.nameAz}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${plan.highlight ? "text-[#0891B2]" : "text-slate-900"}`}>
                      {plan.priceAzn === 0 ? "Pulsuz" : `${plan.priceAzn} ₼`}
                    </span>
                    {plan.priceAzn > 0 && (
                      <span className="text-sm text-slate-400">/ ay</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {plan.maxListings === null
                      ? "Limitsiz aktiv elan"
                      : `Aylıq ${plan.maxListings} aktiv elan`}
                  </p>
                </div>

                <ul className="flex-1 space-y-2.5 text-sm text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckIcon />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/dealer"
                  className={`mt-6 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                    plan.priceAzn === 0
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "bg-[#0891B2] text-white hover:bg-[#0e7490]"
                  }`}
                >
                  {plan.priceAzn === 0 ? "Pulsuz başla" : "Abunə ol"}
                </Link>
              </div>
            ))}
          </div>

        </section>

        {/* ─── 3. Auction fees ───────────────────────────────────────── */}
        <section id="auction" className="scroll-mt-20">
          <SectionHeader
            label="Canlı hərrac"
            title="Auksion haqq strukturu"
            sub="Şəffaf, ədalətli, əvvəlcədən bəlli qiymətlər. Gizli rüsum yoxdur."
          />

          <div className="mb-6 rounded-2xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-5 text-sm text-slate-700">
            EkoMobil avtomobilin əsas satış ödənişini qəbul etmir. Qalib alıcı avtomobilin tam məbləğini birbaşa
            satıcıya ödəyir. Aşağıdakı haqlar yalnız platforma xidmətlərinə aiddir.
          </div>

          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm sm:p-6">
            <h3 className="text-base font-semibold text-slate-900">Auksion axını və intizam ödənişləri</h3>
            <p className="mt-3 leading-relaxed">
              <span className="font-medium text-slate-800">Təkrarlanan görünüş.</span> Aşağıdakı iki kart eyni
              quruluşdadır: məqsəd avtomobil ilə hissəni bir-birinə müqayisə etməkdir. Yalnız rəqəmlər və qısa kontekst
              fərqlənir — eyni məlumatı iki dəfə “fərqli qayda” kimi təqdim etmirik.
            </p>
            <p className="mt-3 leading-relaxed">
              <span className="font-medium text-slate-800">No-show cəriməsi alıcıdan necə tutulur?</span> Platforma bu
              məbləği kartdan avtomatik çıxarmır və bidder deposit-i birbaşa cəriməyə çevirmir. Satıcı auksion bitəndən
              sonra təsdiq pəncərəsində alıcı no-show bildirdikdə status yenilənir; satıcı sistemdə{" "}
              <span className="font-medium text-slate-800">no-show üçün ödəniş səhifəsi (Kapital Bank checkout)</span>{" "}
              yaradır. Ödənişi hüquqi olaraq <span className="font-medium text-slate-800">qalib alıcı</span> etməlidir —
              linki alıcı ilə paylaşıb bank ödənişini tamamlayırsınız. Satıcı pozuntusu üçün də eyni prinsipdir: checkout
              linkini <span className="font-medium text-slate-800">qalib alıcı</span> yaradır, ödənişi{" "}
              <span className="font-medium text-slate-800">satıcı</span> edir.
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Ətraflı hüquqi çərçivə və SLA üçün <Link href="/rules/auction" className="font-medium text-[#0891B2] underline underline-offset-2">Auksion qaydaları</Link> səhifəsinə baxın.
            </p>
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <NumberedSteps
              id="auction-seller-steps"
              title="Satıcı üçün addımlar (A–Z)"
              steps={[
                "Etibar tələblərini tamamla: satıcı doğrulaması, media; avtomobil lotları üçün VIN axını.",
                "Lot yarat: /auction/sell səhifəsindən elan seç, lot parametrlərini təsdiqlə.",
                "Lot haqqı (və tələb olunduqda satıcı performans bond) üçün bank checkout-u tamamla — ödənilməyən lot aktivləşmir.",
                "Lazım gəlsə lot üçün sənədləri auksion lotunun sənəd yükləmə səhifəsindən əlavə et.",
                "Canlı hərracı izlə; bitəndə təsdiq pəncərəsində satıcı kimi nəticəni qeyd et (uğurlu satış, alıcı no-show, mübahisə və s.).",
                "Uğurlu satışda əsas məbləği alıcı sənə birbaşa ödəyir; platforma uğur komisyonu üçün ayrıca checkout göstərilir.",
                "Alıcı no-show bildirdikdə: sistemdə cərimə üçün ödəniş səhifəsi yaradırsan; ödənişi qalib alıcı bankda edir (yuxarıdakı izah)."
              ]}
            />
            <NumberedSteps
              id="auction-buyer-steps"
              title="Alıcı üçün addımlar (A–Z)"
              steps={[
                "Hesabınla daxil ol; lotda “Deposit” işarəsi varsa təklifə qoşulmazdan əvvəl bidder deposit üçün bank checkout-u tamamla.",
                "Auksion qaydalarını təsdiqlə, təklif ver; qalib olanda təsdiq pəncərəsini izlə.",
                "Uğurlu satışda əsas məbləği satıcıya birbaşa ödə; platformada satışın off-platform tamamlandığını təsdiqlə.",
                "Öhdəlikləri pozmamağa çalış: əks halda satıcı no-show bildirə bilər; no-show statusunda səndən intizam cəriməsi ödənilməsi gözlənilir (ayrıca checkout).",
                "Satıcı öhdəliyini pozduğunu düşünürsənsə, təsdiq pəncərəsində müvafiq seçimlə bildir; satıcı pozuntusu cəriməsi üçün checkout linkini sən yaradırsan, ödənişi satıcı edir."
              ]}
            />
          </div>

          <p className="mb-4 text-center text-sm text-slate-500">
            Aşağıda hər lot növü üçün yerləşdirmə, komisyon və intizam haqları cədvəl kimi verilib.
          </p>

          <div className="mb-8 flex flex-wrap items-center justify-center gap-2 text-sm">
            <a
              href="#auction-vehicle"
              className="rounded-full border border-[#0891B2]/30 bg-white px-3 py-1.5 font-medium text-[#0e7490] shadow-sm hover:bg-[#0891B2]/5"
            >
              Avtomobil haqları
            </a>
            <a
              href="#auction-part"
              className="rounded-full border border-fuchsia-500/30 bg-white px-3 py-1.5 font-medium text-fuchsia-800 shadow-sm hover:bg-fuchsia-500/5"
            >
              Hissə haqları
            </a>
            <a
              href="#auction-seller-steps"
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 shadow-sm hover:bg-slate-50"
            >
              Satıcı addımları
            </a>
            <a
              href="#auction-buyer-steps"
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 shadow-sm hover:bg-slate-50"
            >
              Alıcı addımları
            </a>
          </div>

          {/* Alıcı — bütün lot növləri üçün eyni */}
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Alıcı premium</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Pilot / açıq beta: bütün lot növlərində alıcıdan əlavə rüsum tutulmur.
                </p>
              </div>
              <div className="shrink-0 text-2xl font-bold text-emerald-600">Pulsuz</div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Gələcəkdə elan ediləcək faiz dərəcəsi ayrıca bildiriləcək.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
            <AuctionCategoryPanel
              kind="vehicle"
              title="Avtomobil"
              subtitle="Tam nəqliyyat vasitəsi lotları — VIN və ekspertiza axını"
              exampleSaleAzn={70_000}
              exampleLabel="Satış qiyməti 70 000 ₼ olduqda satıcının lot + komisyon xərci"
            />
            <AuctionCategoryPanel
              kind="part"
              title="Hissə"
              subtitle="Ehtiyat hissə və aksesuar lotları"
              exampleSaleAzn={300}
              exampleLabel="Satış qiyməti 300 ₼ olduqda satıcının lot + komisyon xərci"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/auction" className="btn-primary">Auksiona bax</Link>
          </div>
        </section>

        {/* ─── FAQ ───────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Tez-tez soruşulan suallar</h2>
          <div className="space-y-5 divide-y divide-slate-100">
            {[
              {
                q: "Auksion lotunu uduzsam lot haqqı geri qaytarılırmı?",
                a: "Xeyr. Lot haqqı geri qaytarılmır. Komisyon yalnız satış olarsa tutulur."
              },
              {
                q: "Auksiona alıcı qatılmasa nə olur?",
                a: "Auksion bitir, satış olmur. Lot qalır, komisyon tutulmur."
              },
              {
                q: "Satış alınmasa eyni elanla yenidən auksion aça bilərəm?",
                a: "Bəli. Eyni elanla yeni lot yaradıb yenidən auksion aça bilərsiniz."
              },
              {
                q: "Avtomobilin əsas ödənişini EkoMobil qəbul edirmi?",
                a: "Xeyr. Əsas məbləğ alıcıdan satıcıya birbaşa ödənilir."
              }
            ].map((item) => (
              <div key={item.q} className="pt-5 first:pt-0">
                <p className="font-medium text-slate-900">{item.q}</p>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
