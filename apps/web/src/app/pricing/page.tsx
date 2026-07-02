import type { ReactNode } from "react";
import Link from "next/link";
import { PricingNav } from "./pricing-nav";
import { LISTING_PLANS, PRICING_TIERS, listingPlanMinFee } from "@/lib/listing-plans";
import { BUMP_PACKAGES, VIP_PACKAGES, PREMIUM_PACKAGES } from "@/lib/listing-boost-plans";
import { getServicePlanCategoriesWithOverrides } from "@/lib/service-plans";
import type { ListingKind } from "@/lib/marketplace-types";
import {
  AUCTION_FEES,
  calcSellerCommission,
  calcTotalSellerCost,
  getLotListingFeeAzn,
  getNoShowPenaltyAzn,
  getSellerBreachPenaltyAzn
} from "@/lib/auction-fees";
import { getDealerPlanCatalog, getPartsPlanCatalog } from "@/server/business-plan-store";
import { getPricingPlanAdminConfig } from "@/server/system-settings-store";

const AUCTION_SELLER_STEPS_AZ = [
  "Etibar tələblərini tamamla: satıcı doğrulaması, media; avtomobil lotları üçün VIN axını.",
  "Lot yarat: /auction/sell səhifəsindən elan seç, lot parametrlərini təsdiqlə.",
  "Lot haqqı (və tələb olunduqda satıcı performans girovluğu) üçün bank ödənişini tamamla — ödənilməyən lot aktivləşmir.",
  "Lazım gəlsə lot üçün sənədləri auksion lotunun sənəd yükləmə səhifəsindən əlavə et.",
  "Canlı hərracı izlə; bitəndə təsdiq pəncərəsində satıcı kimi nəticəni qeyd et (uğurlu satış, alıcı öhdəlik pozuntusu, mübahisə və s.).",
  "Uğurlu satışda əsas məbləği alıcı sənə birbaşa ödəyir; platforma uğur komisyonu üçün ayrıca ödəniş səhifəsi açılır.",
  "Alıcı öhdəliyini pozduqda: sistemdə platforma öhdəlik haqqı üçün ödəniş linki yaradılır; həmin haqqı qalib alıcı ödəyir."
];

const AUCTION_BUYER_STEPS_AZ = [
  "Hesabınla daxil ol; lotda depozit işarəsi varsa təklifə qoşulmazdan əvvəl iştirakçı depoziti üçün bank ödənişini tamamla.",
  "Auksion qaydalarını təsdiqlə, təklif ver; qalib olanda təsdiq pəncərəsini izlə.",
  "Uğurlu satışda əsas məbləği satıcıya birbaşa ödə; platformada satışın tamamlandığını təsdiqlə.",
  "Öhdəliklərini yerinə yetir — platforma hər iki tərəfin öhdəliyini ciddi izləyir. Öhdəlik pozulduqda platforma öhdəlik haqqı ayrıca ödəniş səhifəsi ilə tətbiq edilir.",
  "Satıcı öhdəliyini pozduğunu düşünürsənsə, təsdiq pəncərəsindəki müvafiq seçimlə bildir; platforma satıcı öhdəlik haqqı üçün ödəniş linki sən tərəfindən yaradılır."
];

const FREE_LISTING_PLAN = LISTING_PLANS.find((plan) => plan.id === "free");
const STANDARD_LISTING_PLAN = LISTING_PLANS.find((plan) => plan.id === "standard");
const VIP_LISTING_PLAN = LISTING_PLANS.find((plan) => plan.id === "vip");

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function SectionHeader({ label, title, sub }: { label: string; title: string; sub: string }) {
  return (
    <div className="mb-10 text-center">
      <span className="inline-block rounded-full bg-[#0057FF]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#0057FF]">
        {label}
      </span>
      <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
      <p className="mt-2 text-slate-500">{sub}</p>
    </div>
  );
}

function NoBizFreeBanner() {
  return null;
}

type AuctionCategoryStyle = {
  headerClass: string;
  borderClass: string;
  ringClass: string;
};

const AUCTION_CATEGORY_STYLES: Record<ListingKind, AuctionCategoryStyle> = {
  vehicle: {
    headerClass: "bg-[#0057FF]/10 border-[#0057FF]/20",
    borderClass: "border-[#0057FF]/25",
    ringClass: "ring-1 ring-[#0057FF]/15"
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

function AuctionDetailsBlock({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-2xl border glass-panel border-slate-900/10 shadow-sm [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-slate-900 sm:px-5 sm:py-4">
        <span>{title}</span>
        <span className="shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </summary>
      <div className="border-t border-slate-900/10 px-4 pb-4 pt-1 text-sm text-slate-600 sm:px-5 sm:pb-5">{children}</div>
    </details>
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
      ? `${AUCTION_FEES.SELLER_COMMISSION_VEHICLE_MIN_AZN} ₼, maksimum ${AUCTION_FEES.SELLER_COMMISSION_VEHICLE_CAP_AZN} ₼`
      : `${AUCTION_FEES.SELLER_COMMISSION_PART_MIN_AZN} ₼, maksimum ${AUCTION_FEES.SELLER_COMMISSION_PART_CAP_AZN} ₼`;

  return (
    <div
      id={kind === "vehicle" ? "auction-vehicle" : "auction-part"}
      className={`scroll-mt-24 overflow-hidden rounded-2xl glass-panel border-slate-900/10 shadow-sm ${s.borderClass} ${s.ringClass}`}
    >
      <div className={`border-b px-5 py-3.5 ${s.headerClass}`}>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">{subtitle}</p>
      </div>

      <div className="divide-y divide-slate-900/10 px-5">
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
          desc={`Minimum ${minCap}`}
        />
        <AuctionFeeRow
          title="Alıcı öhdəlik haqqı"
          value={`${getNoShowPenaltyAzn(kind)} ₼`}
          who="Qalib alıcı"
          desc="Alıcı öhdəliyini yerinə yetirmədikdə bank ödənişi ilə tətbiq edilir."
        />
        <AuctionFeeRow
          title="Satıcı öhdəlik haqqı"
          value={`${getSellerBreachPenaltyAzn(kind)} ₼`}
          who="Satıcı"
          desc="Satıcı satış öhdəliyini yerinə yetirmədikdə bank ödənişi ilə tətbiq edilir."
        />
      </div>

      <div className="border-t border-slate-900/10 bg-white/60 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nümunə hesab</p>
        <p className="mt-1 text-xs text-slate-500">{exampleLabel}</p>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg card px-2 py-2 shadow-sm ring-1 ring-slate-900/10">
            <dt className="text-[10px] text-slate-400">Lot</dt>
            <dd className="mt-0.5 text-sm font-bold text-slate-900">{lot.toLocaleString("az-AZ")} ₼</dd>
          </div>
          <div className="rounded-lg card px-2 py-2 shadow-sm ring-1 ring-slate-900/10">
            <dt className="text-[10px] text-slate-400">Komisyon</dt>
            <dd className="mt-0.5 text-sm font-bold text-slate-900">{comm.toLocaleString("az-AZ")} ₼</dd>
          </div>
          <div className="rounded-lg card px-2 py-2 shadow-sm ring-1 ring-slate-900/10">
            <dt className="text-[10px] text-slate-400">Cəmi</dt>
            <dd className="mt-0.5 text-sm font-bold text-slate-900">{total.toLocaleString("az-AZ")} ₼</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default async function PricingPage() {
  const [dealerPlans, partsPlans, pricingPlanConfig] = await Promise.all([
    getDealerPlanCatalog(),
    getPartsPlanCatalog(),
    getPricingPlanAdminConfig()
  ]);
  const serviceCategories = getServicePlanCategoriesWithOverrides(pricingPlanConfig.service);
  const dealerBaza = dealerPlans.find((plan) => plan.id === "baza") ?? dealerPlans[0];
  const dealerPro = dealerPlans.find((plan) => plan.id === "peşəkar") ?? dealerPlans[1] ?? dealerBaza;
  const dealerCorp = dealerPlans.find((plan) => plan.id === "korporativ") ?? dealerPlans[2] ?? dealerPro;
  const partsBaza = partsPlans.find((plan) => plan.id === "baza") ?? partsPlans[0];
  const partsPro = partsPlans.find((plan) => plan.id === "peşəkar") ?? partsPlans[1] ?? partsBaza;
  const partsNet = partsPlans.find((plan) => plan.id === "şəbəkə") ?? partsPlans[2] ?? partsPro;
  const economics = pricingPlanConfig.economics;
  const freeDurationDays = FREE_LISTING_PLAN?.durationDays ?? 30;
  const freeGraceDays = FREE_LISTING_PLAN?.renewGracePeriodDays ?? 7;
  const faqItems = [
    {
      q: "Mağazada 1000 məhsul varsa hamısı üçün ayrıca elan yarada bilərəm?",
      a: `Bəli, ${partsNet.nameAz} planında ${partsNet.maxActiveListings} aktiv SKU limiti var və hər məhsul üçün ayrıca elan yarada bilərsiniz. Limit dolduqda yeni elan üçün mövcud SKU-lardan birini deaktiv etməli və ya planı yüksəltməlisiniz.`
    },
    {
      q: "Elan haqqım nə qədər olacaq?",
      a: "Pulsuz elan həmişə 0 ₼-dır. Standart və VIP planların qiyməti avtomobilin satış qiymətinə görə müəyyənləşir — yuxarıdakı cədvələ baxın. Elan yerləşdirərkən son addımda dəqiq məbləği görəcəksiniz."
    },
    {
      q: "İrəlilətmə xidmətini nə vaxt əldə etmək lazımdır?",
      a: "İstənilən vaxt — elan aktiv olduqdan sonra idarə panelindən irəlilətmə əlavə edə bilərsiniz. Elan yerləşdirərkən eyni zamanda irəlilətmə seçmək də mümkündür."
    },
    {
      q: "Salon üçün minimum plan hansıdır?",
      a: `Salonlar üçün giriş planı (${dealerBaza.nameAz}) aylıq ${dealerBaza.priceAzn} ₼-dır. Bu planla əsas salon paneli, inventar və müştəri sorğularının idarəetməsi açılır. CSV idxalı və analitika üçün ${dealerPro.nameAz} planına keçmək lazımdır.`
    },
    {
      q: "Auksion lotunda satış olmasa lot haqqı geri qaytarılırmı?",
      a: "Xeyr. Lot yerləşdirmə haqqı geri qaytarılmır — platforma yoxlama və aktivləşdirmə xərclərini əhatə edir. Satış komisyonu isə yalnız uğurlu satış baş verdikdə tutulur."
    },
    {
      q: "Avtomobilin satış məbləğini EkoMobil vasitəsilə ödəmək olarmı?",
      a: "Xeyr. Avtomobilin əsas ödənişi alıcıdan satıcıya birbaşa həyata keçirilir. Platforma yalnız elan haqqı, irəlilətmə xidmətləri və auksion komisyonunu qəbul edir."
    }
  ];
  return (
    <div className="bg-white/60">
      {/* ─── Page hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b glass-panel border-slate-900/10 px-4 py-14 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-[#0057FF]/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Qiymətlər
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            Elan, salon, mağaza və auksion xidmətləri.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {[
              "Gizli ödəniş yoxdur",
              "Avtomobilin qiymətinə görə dinamik tarif",
              "Biznes üçün aylıq sabit plan"
            ].map((item) => (
              <span key={item} className="rounded-full border border-slate-900/10 bg-white/60 px-3 py-1 text-xs font-medium text-slate-600">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-20 px-4 py-16 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border glass-panel border-slate-900/10 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fərdi satıcı</p>
            <p className="mt-1 text-base font-bold text-slate-900">Pulsuz başla</p>
            <p className="mt-1 text-xs text-slate-500">1 aktiv pulsuz elan. Ödənişli plana keç — limit yoxdur.</p>
          </div>
          <div className="rounded-2xl border border-[#0057FF]/30 bg-[#0057FF]/5 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0057FF]">İrəlilətmə</p>
            <p className="mt-1 text-base font-bold text-slate-900">Elanı öndə tut</p>
            <p className="mt-1 text-xs text-slate-600">İrəli çək, VIP, Premium — elanı daha çox nəzərə çarpdır.</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Biznes satıcı</p>
            <p className="mt-1 text-base font-bold text-slate-900">Salon və mağaza</p>
            <p className="mt-1 text-xs text-emerald-700">Eyni hesab, ayrı aylıq planlar — salon və mağaza bir-birindən asılı deyil.</p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Auksion</p>
            <p className="mt-1 text-base font-bold text-slate-900">Lot + komisyon</p>
            <p className="mt-1 text-xs text-violet-700">Lot yerləşdirmə haqqı + satış komisyonu. Alıcı üçün pulsuz.</p>
          </div>
        </section>
        {/* Quick nav — scroll-spy aktiv */}
        <PricingNav />

        {/* ─── 1. Listing plans ──────────────────────────────────────── */}
        <section id="listings" className="scroll-mt-20">
          <SectionHeader
            label="Fərdi satıcı planları"
            title="Elan qiymət planları"
            sub="Hər elan ayrıca plan seçir. Eyni anda yalnız 1 pulsuz aktiv elanınız ola bilər."
          />

          {/* Two-column info boxes */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1 rounded-2xl alert-warning border px-5 py-4">
              <p className="text-sm font-semibold text-amber-700">Pulsuz plan → 1 aktiv elan limiti</p>
              <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                Bir istifadəçi eyni anda yalnız <strong>1 aktiv pulsuz elan</strong> yerləşdirə bilər.
                İkinci pulsuz elan üçün birinci elanın müddəti bitməlidir ({freeDurationDays} gün + {freeGraceDays} gün lütf müddəti).
                Eyni anda birdən çox elan istəyirsinizsə, Standart yaxud VIP plan seçin.
              </p>
            </div>
            <div className="flex-1 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-4">
              <p className="text-sm font-semibold text-emerald-700">Ödənişli planlar → limitsiz</p>
              <p className="mt-1 text-xs text-emerald-700 leading-relaxed">
                Standart və VIP planlar <strong>eyni anda limitsiz sayda aktiv</strong> ola bilər — hər biri
                ayrıca ödənilir. Salon sahibisinizsə aylıq sabit ödənişli{" "}
                <a href="#dealer" className="underline font-medium">Salon planına</a> keçin.
              </p>
            </div>
          </div>

          {/* Dynamic pricing table */}
          <div className="mb-8 overflow-hidden rounded-2xl border glass-panel border-slate-900/10 shadow-sm">
            <div className="border-b border-slate-900/10 bg-white/60 px-5 py-3.5">
              <p className="text-sm font-semibold text-slate-900">
                Dinamik qiymət cədvəli — avtomobil satış qiymətinə görə
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Elan haqqı avtomobilin qiymət aralığına uyğun hesablanır. Pulsuz plan həmişə 0 ₼-dır.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-900/10 text-xs text-slate-500">
                    <th className="py-3 pl-5 pr-3 text-left font-medium">Avtomobil qiymət aralığı</th>
                    <th className="px-3 py-3 text-center font-medium">Pulsuz</th>
                    <th className="px-3 py-3 text-center font-medium text-slate-700">Standart</th>
                    <th className="px-3 py-3 text-center font-medium text-[#0057FF]">VIP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/10">
                  {PRICING_TIERS.map((tier, i) => (
                    <tr key={i} className="hover:bg-slate-900/5/60">
                      <td className="py-3 pl-5 pr-3 font-medium text-slate-700">{tier.labelAz}</td>
                      <td className="px-3 py-3 text-center text-slate-400">0 ₼</td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-900">
                        {tier.standardPriceAzn} ₼
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-[#0057FF]">
                        {tier.vipPriceAzn} ₼
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-900/10 bg-white/60/60 px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-slate-400">
                Elan yerləşdirərkən qiymət aralığı avtomatik müəyyənləşir. Təsdiq addımında dəqiq məbləği görə bilərsiniz.
              </p>
              <span className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-500/25">
                Rəqabətli qiymət — digər platformalardan əlverişli
              </span>
            </div>
          </div>

          {/* Image processing info */}
          <div className="mb-8 rounded-2xl border border-slate-900/10 bg-white/60 px-5 py-4">
            <p className="text-sm font-semibold text-slate-900">Şəkil emalı — bütün planlar üçün eynidir</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-[#0057FF]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#0057FF]">AVTO</span>
                <span><strong>İstənilən format qəbul olunur</strong> — JPEG, PNG, WebP, HEIC, BMP. Sistem avtomatik JPEG-ə çevirir.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">SIX</span>
                <span><strong>Böyük fayllar avtomatik sıxılır</strong> — 85% JPEG keyfiyyəti, maksimum 1280 px. 10 MB telefon fotosu ~800 KB-a endirilir.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">LİMİT</span>
                <span>
                  <strong>Hər plan öz limitləri ilə işləyir</strong> — Pulsuz: {FREE_LISTING_PLAN?.maxImages ?? 15} şəkil,
                  Standart: {STANDARD_LISTING_PLAN?.maxImages ?? 15} şəkil, VIP: {VIP_LISTING_PLAN?.maxImages ?? 20} şəkil.
                </span>
              </div>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid gap-5 sm:grid-cols-3">
            {LISTING_PLANS.map((plan) => {
              const isVip = plan.id === "vip";
              const isStandard = plan.id === "standard";
              return (
          <div
            key={plan.id}
                  className={`relative flex flex-col rounded-2xl border card p-6 ${
                    isVip
                      ? "border-[#0057FF] shadow-[0_0_0_1px_rgba(0,87,255,0.4),0_8px_32px_rgba(0,87,255,0.12)]"
                      : "border-slate-900/10 shadow-sm"
                  }`}
                >
                  {isVip && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0057FF] px-3 py-1 text-xs font-bold text-white shadow">
                Ən populyar
              </span>
            )}
            <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-900">{plan.nameAz}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      {plan.priceAzn === 0 ? (
                        <span className="text-3xl font-bold text-slate-900">Pulsuz</span>
                      ) : (
                        <>
                          <span className="text-xs text-slate-400 font-medium">-dən</span>
                          <span className={`text-3xl font-bold ${isVip ? "text-[#0057FF]" : "text-slate-900"}`}>
                            {isStandard ? listingPlanMinFee("standard") : listingPlanMinFee("vip")} ₼
                </span>
                          <span className="text-sm text-slate-400">/ elan</span>
                        </>
                )}
              </div>
                    <p className="mt-1 text-xs text-slate-400">{plan.durationDays} gün aktiv</p>
                  </div>

                  {/* Feature chips */}
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-white/63 px-2 py-0.5 text-xs text-slate-600">{plan.maxImages} şəkil</span>
                    <span className="rounded-md bg-white/63 px-2 py-0.5 text-xs text-slate-600">{plan.storageMb} MB</span>
                    {plan.videoEnabled
                      ? <span className="rounded-md bg-emerald-500/15 text-emerald-700 px-2 py-0.5 text-xs">{plan.maxVideos} video</span>
                      : <span className="rounded-md bg-white/63 text-slate-400 px-2 py-0.5 text-xs">Video yoxdur</span>
                    }
                    {plan.id === "free" && (
                      <span className="rounded-md bg-amber-500/15 text-amber-700 px-2 py-0.5 text-xs font-medium">1 aktiv limit</span>
                    )}
            </div>

                  <ul className="flex-1 space-y-2 text-sm text-slate-600">
              {plan.id === "free" && (
                <>
                        <li className="flex items-center gap-2"><CheckIcon />Standart sıralanma</li>
                        <li className="flex items-center gap-2"><CheckIcon />Əsas axtarış görünüşü</li>
                        <li className="flex items-center gap-2 text-slate-400"><XIcon />İrəlilətmə (ayrıca alına bilər)</li>
                        <li className="flex items-center gap-2 text-slate-400"><XIcon />Video</li>
                </>
              )}
              {plan.id === "standard" && (
                <>
                        <li className="flex items-center gap-2"><CheckIcon />Vurğulanmış elan kartı</li>
                        <li className="flex items-center gap-2"><CheckIcon />2× prioritet sıralama</li>
                        <li className="flex items-center gap-2"><CheckIcon />Baxış statistikası</li>
                        <li className="flex items-center gap-2"><CheckIcon />1 video ({STANDARD_LISTING_PLAN?.maxVideoSizeMb ?? 50} MB)</li>
                        <li className="flex items-center gap-2"><CheckIcon />İrəlilətmə xidmətləri əlavə edilə bilər</li>
                </>
              )}
              {plan.id === "vip" && (
                <>
                        <li className="flex items-center gap-2"><CheckIcon />Ana səhifə VIP bloku</li>
                        <li className="flex items-center gap-2"><CheckIcon />4× prioritet sıralama</li>
                        <li className="flex items-center gap-2"><CheckIcon />Vurğulanmış görünüş + ribbon</li>
                        <li className="flex items-center gap-2"><CheckIcon />Baxış & klik statistikası</li>
                        <li className="flex items-center gap-2"><CheckIcon />{VIP_LISTING_PLAN?.maxVideos ?? 1} video ({VIP_LISTING_PLAN?.maxVideoSizeMb ?? 200} MB/video)</li>
                        <li className="flex items-center gap-2"><CheckIcon />İrəlilətmə xidmətləri əlavə edilə bilər</li>
                </>
              )}
            </ul>

            <Link
              href="/publish"
                    className={`mt-6 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                      plan.priceAzn === 0
                  ? "bg-white/63 text-slate-700 hover:bg-slate-900/10"
                  : "bg-[#0057FF] text-white hover:bg-[#0046CC]"
              }`}
            >
                    {plan.priceAzn === 0 ? "Pulsuz yerləşdir" : "Elan ver"}
            </Link>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            * Standart və VIP plan qiyməti avtomobilin satış qiymətinə görə dəyişir. Yuxarıdakı cədvələ baxın.
          </p>
        </section>

        {/* ─── 2. Boost / Promote services ──────────────────────────── */}
        <section id="boost" className="scroll-mt-20">
          <SectionHeader
            label="İrəlilətmə xidmətləri"
            title="Elanını öndə tut"
            sub="Elan planından ayrı əldə edilir. İstənilən aktiv elana əlavə edilə bilər."
          />

          {/* How boost works */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: (
                  <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7M12 3v18" />
                  </svg>
                ),
                title: "İrəli çək",
                desc: "Elanı ən yeni kimi sıralamaya qaldırır — axtarışda yuxarı mövqeyə çıxarır.",
                color: "bg-white/60 border-slate-900/10"
              },
              {
                icon: (
                  <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                ),
                title: "VIP",
                desc: "Axtarış nəticəsinin yuxarısındakı xüsusi VIP blokunda yer alır. Kart üzərində V işarəsi.",
                color: "bg-amber-500/15 border-amber-500/25"
              },
              {
                icon: (
                  <svg className="h-6 w-6 text-[#0057FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ),
                title: "Premium",
                desc: "Ana səhifənin Premium blokunda yer alır. Ən güclü mövqe — VIP + İrəli çək xidmətləri daxildir.",
                color: "bg-[#0057FF]/5 border-[#0057FF]/20"
              }
            ].map((item) => (
              <div key={item.title} className={`rounded-2xl border p-5 ${item.color}`}>
                <div className="mb-3">{item.icon}</div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

          {/* Bump packages */}
          <div className="mb-10">
            <h3 className="mb-4 text-base font-semibold text-slate-900">İrəli çək paketləri</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              {BUMP_PACKAGES.map((pkg) => (
                <div key={pkg.id} className="flex flex-col rounded-xl border glass-panel border-slate-900/10 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{pkg.nameAz}</p>
                  <p className="mt-1 flex-1 text-xs text-slate-500 leading-relaxed">{pkg.descriptionAz}</p>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-slate-900">{pkg.priceAzn} ₼</span>
                    {pkg.isPopular && (
                      <span className="rounded-full bg-white/63 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Populyar</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VIP packages */}
          <div className="mb-10">
            <h3 className="mb-4 text-base font-semibold text-slate-900">VIP paketləri</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              {VIP_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`flex flex-col rounded-xl border card p-4 shadow-sm ${
                    pkg.isPopular ? "border-amber-300 ring-1 ring-amber-200" : "border-amber-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-amber-700">{pkg.nameAz}</p>
                  {pkg.includedBonuses.length > 0 && (
                    <p className="mt-1 text-xs text-amber-700">{pkg.includedBonuses[0]}</p>
                  )}
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-amber-700">{pkg.priceAzn} ₼</span>
                    {pkg.isPopular && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Populyar</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Premium packages */}
          <div className="mb-6">
            <h3 className="mb-4 text-base font-semibold text-slate-900">Premium paketləri</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              {PREMIUM_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`flex flex-col rounded-xl border card p-4 shadow-sm ${
                    pkg.isPopular
                      ? "border-[#0057FF] ring-1 ring-[#0057FF]/30"
                      : "border-[#0057FF]/25"
                  }`}
                >
                  <p className="text-sm font-semibold text-[#0057FF]">{pkg.nameAz}</p>
                  {pkg.includedBonuses.length > 0 && (
                    <ul className="mt-1 flex-1 space-y-0.5 text-xs text-slate-500">
                      {pkg.includedBonuses.map((b) => (
                        <li key={b} className="flex items-center gap-1">
                          <span className="text-[#0057FF]">✓</span> {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-[#0057FF]">{pkg.priceAzn} ₼</span>
                    {pkg.isPopular && (
                      <span className="rounded-full bg-[#0057FF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0057FF]">Populyar</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-900/10 bg-white/60 px-5 py-4 text-sm text-slate-600">
            <strong className="text-slate-900">Necə əldə edilir?</strong> Aktiv elan idarə panelindən
            istədiyiniz paketi seçib ödəniş edin. Xidmət dərhal işə düşür.
            Salon abunəsi ilə gələn irəlilətmə kreditləri avtomatik tətbiq olunur.
          </div>
        </section>

        {/* ─── 3. Dealer plans ───────────────────────────────────────── */}
        <section id="dealer" className="scroll-mt-20">
          <SectionHeader
            label="Avtomobil salonları"
            title="Salon abunə planları"
            sub="Qiymət artdıqca aktiv elan limiti və əməliyyat imkanları artır: Əsas → Peşəkar → Korporativ."
          />

          <NoBizFreeBanner />

          {/* Dealer plan logic explainer */}
          <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm">
            <p className="font-semibold text-blue-900">Salon planı necə işləyir?</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3 text-xs text-blue-800">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-blue-500">①</span>
                <span><strong>Əsas plan ({dealerBaza.priceAzn} ₼):</strong> Aşağı giriş xərci ilə {dealerBaza.maxActiveListings} aktiv elan limiti və baza idarəetmə axını.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-blue-500">②</span>
                <span><strong>Peşəkar plan ({dealerPro.priceAzn} ₼):</strong> {dealerPro.maxActiveListings} aktiv elan limiti + CSV idxalı + analitika ilə iş axını sürətlənir.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-blue-500">③</span>
                <span><strong>Korporativ plan ({dealerCorp.priceAzn} ₼):</strong> {dealerCorp.maxActiveListings} aktiv elan limiti və korporativ profil təqdimatı üçün geniş sahələr açılır.</span>
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-slate-900/10 bg-white/60 px-5 py-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-900">Niyə bu limitlər var?</p>
            <p className="mt-1 leading-relaxed">
              Limitlər real xərclərə görə hesablanır: şəkil saxlanması ({economics.storageCostPerImageAzn.toFixed(4)} ₼/şəkil), görüntü trafiki ({economics.egressCostPerImageViewAzn.toFixed(4)} ₼/görüntü), moderasiya ({economics.moderationCostPerListingAzn.toFixed(2)} ₼/elan) və dəstək ({economics.supportCostPerListingAzn.toFixed(2)} ₼/elan). Hədəf maya dəyəri nisbəti {economics.targetCogsRatioPct}% və risk buffer {economics.riskBufferPct}% saxlanır.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {dealerPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border card p-6 ${
                  plan.highlight
                    ? "border-[#0057FF] shadow-[0_0_0_1px_rgba(0,87,255,0.4),0_8px_32px_rgba(0,87,255,0.12)]"
                    : "border-slate-900/10 shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0057FF] px-3 py-1 text-xs font-bold text-white shadow">
                    Ən populyar
                  </span>
                )}
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-slate-900">{plan.nameAz}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${plan.highlight ? "text-[#0057FF]" : "text-slate-900"}`}>
                      {plan.priceAzn} ₼
                    </span>
                    <span className="text-sm text-slate-400">/ ay</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Aylıq abunə planı</p>
                </div>

                {/* Feature chips */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-white/63 px-2 py-0.5 text-xs text-slate-600">
                    {plan.maxActiveListings} aktiv elan
                  </span>
                  {plan.csvImportEnabled && (
                    <span className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
                      CSV idxalı
                    </span>
                  )}
                  {plan.analyticsEnabled && (
                    <span className="rounded-md bg-purple-50 text-purple-700 px-2 py-0.5 text-xs">
                      Analitika
                    </span>
                  )}
                  {plan.id === "korporativ" && (
                    <span className="rounded-md bg-emerald-500/15 text-emerald-700 px-2 py-0.5 text-xs">
                      Kapak şəkli + ünvan
                    </span>
                  )}
                </div>

                {/* Real features */}
                <ul className="flex-1 space-y-2 text-sm text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckIcon />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Coming soon */}
                {plan.comingSoon.length > 0 && (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-900/10 px-3 py-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tezliklə</p>
                    <ul className="space-y-1">
                      {plan.comingSoon.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs text-slate-400">
                          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link
                  href="/dealer"
                  className="mt-5 block w-full rounded-xl bg-[#0057FF] py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#0046CC]"
                >
                  Abunə ol
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 4. Parts store plans ──────────────────────────────────── */}
        <section id="parts-store" className="scroll-mt-20">
          <SectionHeader
            label="Ehtiyat hissə mağazaları"
            title="Mağaza paketləri"
            sub="Qiymət artdıqca aktiv SKU limiti və əməliyyat imkanları artır: Əsas → Peşəkar → Şəbəkə."
          />

          <NoBizFreeBanner />

          {/* Parts plan logic explainer */}
          <div className="mb-8 rounded-2xl border border-fuchsia-100 bg-fuchsia-50 px-5 py-4 text-sm">
            <p className="font-semibold text-fuchsia-900">Mağaza planı salondan necə fərqlənir?</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3 text-xs text-fuchsia-800">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-fuchsia-500">①</span>
                <span><strong>Əsas plan ({partsBaza.priceAzn} ₼):</strong> {partsBaza.maxActiveListings} aktiv məhsul (SKU) limiti və baza mağaza paneli üçün uyğundur.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-fuchsia-500">②</span>
                <span><strong>Peşəkar plan ({partsPro.priceAzn} ₼):</strong> {partsPro.maxActiveListings} aktiv SKU limiti + analitika və geniş profil sahələri verir.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-fuchsia-500">③</span>
                <span><strong>Şəbəkə planı ({partsNet.priceAzn} ₼):</strong> {partsNet.maxActiveListings} aktiv SKU limiti və korporativ mağaza təqdimatı üçün nəzərdə tutulub.</span>
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-slate-900/10 bg-white/60 px-5 py-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-900">SKU limiti necə formalaşır?</p>
            <p className="mt-1 leading-relaxed">
              Hər SKU üçün şəkil sayı, aylıq ortalama baxış yükü (parts üçün {economics.avgPartsImageViewsPerListingPerMonth}) və əməliyyat xərcləri hesablanır; bu səbəbdən plan qiyməti artdıqca saxlanılan aktiv SKU limiti də artır.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {partsPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border card p-6 ${
                  plan.highlight
                    ? "border-[#0057FF] shadow-[0_0_0_1px_rgba(0,87,255,0.4),0_8px_32px_rgba(0,87,255,0.12)]"
                    : "border-slate-900/10 shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0057FF] px-3 py-1 text-xs font-bold text-white shadow">
                    Ən populyar
                  </span>
                )}
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-slate-900">{plan.nameAz}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${plan.highlight ? "text-[#0057FF]" : "text-slate-900"}`}>
                      {plan.priceAzn} ₼
                    </span>
                    <span className="text-sm text-slate-400">/ ay</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Aylıq mağaza planı</p>
      </div>

                {/* Feature chips */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-white/63 px-2 py-0.5 text-xs text-slate-600">
                    {plan.maxActiveListings.toLocaleString("az-AZ")} aktiv SKU
                  </span>
                  <span className="rounded-md bg-white/63 px-2 py-0.5 text-xs text-slate-600">
                    {plan.perListingMaxImages} şəkil/SKU
                  </span>
                  {plan.analyticsEnabled && (
                    <span className="rounded-md bg-purple-50 text-purple-700 px-2 py-0.5 text-xs">
                      Analitika
                    </span>
                  )}
                  {plan.id === "şəbəkə" && (
                    <span className="rounded-md bg-emerald-500/15 text-emerald-700 px-2 py-0.5 text-xs">
                      Kapak şəkli + ünvan
                    </span>
                  )}
                </div>

                {/* Real features */}
                <ul className="flex-1 space-y-2.5 text-sm text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckIcon />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Coming soon */}
                {plan.comingSoon.length > 0 && (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-900/10 px-3 py-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tezliklə</p>
                    <ul className="space-y-1">
                      {plan.comingSoon.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs text-slate-400">
                          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link
                  href="/publish"
                  className="mt-5 block w-full rounded-xl bg-[#0057FF] py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#0046CC]"
                >
                  Paketi seç
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 5. Service provider plans ─────────────────────────────── */}
        <section id="services" className="scroll-mt-20">
          <SectionHeader
            label="Servislər və ustalar"
            title="Xidmət təminatçısı planları"
            sub="Rəsmi servis, ekspertiza şirkəti və usta profilləri üçün aylıq abunə planları."
          />

          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-900">Xidmət təminatçıları üçün xüsusi şərtlər</p>
              <p className="mt-1 text-xs text-blue-800 leading-relaxed">
                Fərdi ustalar Pulsuz plan ilə başlaya bilər. Ödənişli plana keçən ilk tərəfdaşlar üçün
                ilk 30 günlük pulsuz aktivləşdirmə imkanı mövcuddur. Müraciət telefon təsdiqindən sonra nəzərdən keçirilir.
              </p>
            </div>
          </div>

          {/* Category tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {serviceCategories.map((cat) => (
              <a
                key={cat.id}
                href={`#service-${cat.id}`}
                className="rounded-full border border-slate-900/10 bg-white/60 px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-[#0057FF]/40 hover:text-[#0057FF]"
              >
                {cat.label}
              </a>
            ))}
          </div>

          <div className="space-y-14">
            {serviceCategories.map((cat) => (
              <div key={cat.id} id={`service-${cat.id}`} className="scroll-mt-24">
                {/* Sub-header */}
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-900/10 pb-4">
                  <div>
                    <h3 className={`text-lg font-bold ${cat.color}`}>{cat.label}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">{cat.subLabel}</p>
                  </div>
                  <Link
                    href="/partners/inspection"
                    className="text-xs font-medium text-[#0057FF] hover:underline"
                  >
                    Tərəfdaşlıq müraciəti →
                  </Link>
                </div>

                {/* Subtypes list */}
                <div className={`mb-6 rounded-xl border ${cat.borderColor} bg-white/60 px-4 py-3`}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bu plana uyğun servis növləri
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subtypes.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-white/63 px-2.5 py-1 text-xs text-slate-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Plan cards */}
                <div className="grid gap-5 sm:grid-cols-3">
                  {cat.plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative flex flex-col rounded-2xl border card p-6 ${
                        plan.highlight
                          ? "border-[#0057FF] shadow-[0_0_0_1px_rgba(0,87,255,0.4),0_8px_32px_rgba(0,87,255,0.12)]"
                          : "border-slate-900/10 shadow-sm"
                      }`}
                    >
                      {plan.tagAz && (
                        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0057FF] px-3 py-1 text-xs font-bold text-white shadow">
                          {plan.tagAz}
                        </span>
                      )}

                      <div className="mb-4">
                        <h4 className="text-base font-semibold text-slate-900">{plan.nameAz}</h4>
                        <div className="mt-2 flex items-baseline gap-1">
                          {plan.priceAzn === 0 ? (
                            <span className="text-3xl font-bold text-slate-900">Pulsuz</span>
                          ) : (
                            <>
                              <span className={`text-3xl font-bold ${plan.highlight ? "text-[#0057FF]" : "text-slate-900"}`}>
                                {plan.priceAzn} ₼
                              </span>
                              <span className="text-sm text-slate-400">{plan.billingAz}</span>
                            </>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{plan.descriptionAz}</p>
                        {plan.launchOfferAz && (
                          <div className="mt-2 inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            {plan.launchOfferAz}
                          </div>
                        )}
                      </div>

                      <ul className="flex-1 space-y-2 text-sm text-slate-600">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <CheckIcon />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      {plan.comingSoon && plan.comingSoon.length > 0 && (
                        <div className="mt-4 rounded-xl border border-dashed border-slate-900/10 px-3 py-3">
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tezliklə</p>
                          <ul className="space-y-1">
                            {plan.comingSoon.map((f) => (
                              <li key={f} className="flex items-center gap-1.5 text-xs text-slate-400">
                                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Link
                        href={plan.ctaHref}
                        className={`mt-6 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                          plan.highlight
                            ? "bg-[#0057FF] text-white hover:bg-[#0046CC]"
                            : plan.priceAzn === 0
                            ? "bg-white/63 text-slate-700 hover:bg-slate-900/10"
                            : "border border-[#0057FF] text-[#0057FF] hover:bg-[#0057FF]/5"
                        }`}
                      >
                        {plan.ctaLabel}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-900/10 bg-white/60 px-5 py-4 text-sm text-slate-600">
            <strong className="text-slate-900">Qeyd:</strong> EkoMobil servis profilini saytda siyahıya alır
            və müştəri əlaqəsini asanlaşdırır. Göstərilən xidmətin keyfiyyəti xidmət təminatçısının məsuliyyətindədir.
            Tərəfdaşlıq üçün{" "}
            <Link href="/partners/inspection" className="font-semibold text-[#0057FF] hover:underline">
              müraciət formasını
            </Link>
            {" "}doldurun.
          </div>
        </section>

        {/* ─── 6. Auction fees ───────────────────────────────────────── */}
        <section id="auction" className="scroll-mt-20">
          <SectionHeader
            label="Canlı hərrac"
            title="Auksion haqları"
            sub="Aşağıdakı cədvəldə platforma haqları göstərilib. Avtomobilin əsas satış məbləği platformadan keçmir."
          />

          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-sm text-slate-600">
              Avtomobilin satış məbləği alıcıdan satıcıya birbaşa ödənilir — platforma vasitəçilik etmir.
              Aşağıdakı cədvəldə yalnız platforma haqları göstərilib.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              <Link
                href="/rules/auction"
                className="font-semibold text-[#0057FF] underline decoration-[#0057FF]/40 underline-offset-4 hover:decoration-[#0057FF]"
              >
                Auksion qaydaları (tam mətn)
              </Link>
              <span className="hidden text-slate-400 sm:inline" aria-hidden>|</span>
              <a href="#auction-vehicle" className="font-medium text-slate-700 hover:text-[#0057FF]">
                Avtomobil haqları
              </a>
              <a href="#auction-part" className="font-medium text-fuchsia-800 hover:underline">
                Hissə haqları
              </a>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <span className="text-sm font-semibold text-emerald-700">Alıcı üçün auksion</span>
              <p className="mt-0.5 text-xs text-emerald-700">Auksiona qatılmaq, təklif vermək və qalib gəlmək — alıcıdan heç bir platforma haqqı alınmır.</p>
            </div>
            <span className="shrink-0 text-lg font-bold text-emerald-600">Pulsuz</span>
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

          <div className="mt-8 space-y-3">
            <AuctionDetailsBlock title="Ödəniş və öhdəlik haqları — necə işləyir?">
              <p className="leading-relaxed text-slate-600">
                EkoMobil auksionunda hər iki tərəf — alıcı da, satıcı da — öhdəlik verir. Öhdəlik pozulduqda
                platforma öhdəlik haqqı tətbiq edilir; bu həm platforma tamlığını qoruyur, həm zərər görən tərəfi
                kompensasiya edir. Məbləğlər ayrıca bank ödənişi ilə tutulur; kartdan avtomatik silinmə tətbiq edilmir.
                Ətraflı hüquqi izah üçün{" "}
                <Link href="/rules/auction" className="font-semibold text-[#0057FF] underline underline-offset-2">
                  auksion qaydaları
                </Link>{" "}
                səhifəsinə keçin.
              </p>
            </AuctionDetailsBlock>
            <AuctionDetailsBlock title="Satıcı üçün addımlar (A–Z)">
              <ol className="list-decimal space-y-2.5 pl-5 marker:font-medium marker:text-[#0057FF]">
                {AUCTION_SELLER_STEPS_AZ.map((s) => (
                  <li key={s} className="leading-relaxed">{s}</li>
                ))}
              </ol>
            </AuctionDetailsBlock>
            <AuctionDetailsBlock title="Alıcı üçün addımlar (A–Z)">
              <ol className="list-decimal space-y-2.5 pl-5 marker:font-medium marker:text-[#0057FF]">
                {AUCTION_BUYER_STEPS_AZ.map((s) => (
                  <li key={s} className="leading-relaxed">{s}</li>
                ))}
              </ol>
            </AuctionDetailsBlock>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auction" className="btn-primary">
              Auksiona bax
            </Link>
            <Link href="/rules/auction" className="btn-secondary">
              Qaydaları oxu
        </Link>
          </div>
        </section>

        {/* ─── FAQ ───────────────────────────────────────────────────── */}
        <section className="rounded-2xl border glass-panel border-slate-900/10 p-6 sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Tez-tez soruşulan suallar</h2>
          <div className="space-y-5 divide-y divide-slate-900/10">
            {faqItems.map((item) => (
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
