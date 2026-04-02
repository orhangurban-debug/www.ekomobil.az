import type { ReactNode } from "react";
import Link from "next/link";
import { LISTING_PLANS, PRICING_TIERS } from "@/lib/listing-plans";
import { DEALER_PLANS } from "@/lib/dealer-plans";
import { PARTS_STORE_PLANS } from "@/lib/parts-store-plans";
import { BUMP_PACKAGES, VIP_PACKAGES, PREMIUM_PACKAGES } from "@/lib/listing-boost-plans";
import type { ListingKind } from "@/lib/marketplace-types";
import {
  AUCTION_FEES,
  calcSellerCommission,
  calcTotalSellerCost,
  getLotListingFeeAzn,
  getNoShowPenaltyAzn,
  getSellerBreachPenaltyAzn
} from "@/lib/auction-fees";

const AUCTION_SELLER_STEPS_AZ = [
  "Etibar tələblərini tamamla: satıcı doğrulaması, media; avtomobil lotları üçün VIN axını.",
  "Lot yarat: /auction/sell səhifəsindən elan seç, lot parametrlərini təsdiqlə.",
  "Lot haqqı (və tələb olunduqda satıcı performans bond) üçün bank checkout-u tamamla — ödənilməyən lot aktivləşmir.",
  "Lazım gəlsə lot üçün sənədləri auksion lotunun sənəd yükləmə səhifəsindən əlavə et.",
  "Canlı hərracı izlə; bitəndə təsdiq pəncərəsində satıcı kimi nəticəni qeyd et (uğurlu satış, alıcı no-show, mübahisə və s.).",
  "Uğurlu satışda əsas məbləği alıcı sənə birbaşa ödəyir; platforma uğur komisyonu üçün ayrıca checkout göstərilir.",
  "Alıcı no-show bildirdikdə: sistemdə cərimə üçün ödəniş səhifəsi yaradırsan; ödənişi qalib alıcı bankda edir."
];

const AUCTION_BUYER_STEPS_AZ = [
  "Hesabınla daxil ol; lotda \u201cDeposit\u201d işarəsi varsa təklifə qoşulmazdan əvvəl bidder deposit üçün bank checkout-u tamamla.",
  "Auksion qaydalarını təsdiqlə, təklif ver; qalib olanda təsdiq pəncərəsini izlə.",
  "Uğurlu satışda əsas məbləği satıcıya birbaşa ödə; platformada satışın off-platform tamamlandığını təsdiqlə.",
  "Öhdəlikləri pozmamağa çalış: əks halda satıcı no-show bildirə bilər; no-show statusunda intizam cəriməsi ayrıca checkout ilə ödənilir.",
  "Satıcı öhdəliyini pozduğunu düşünürsənsə, təsdiq pəncərəsində müvafiq seçimlə bildir; satıcı pozuntusu cəriməsi üçün checkout linkini qalib alıcı yaradır."
];

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
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

function NoBizFreeBanner() {
  return (
    <div className="mb-8 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
      <svg className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <div>
        <p className="text-sm font-semibold text-rose-900">Biznes üçün pulsuz plan mövcud deyil</p>
        <p className="mt-1 text-xs text-rose-700 leading-relaxed">
          Salonlar və mağazalar kommersiya subyektləridir. Pulsuz elan fərdi satıcıların müstəsna imtiyazıdır —
          biznes hesabları aktiv olmaq üçün abunə planı seçməlidir. Bu, platforma keyfiyyətini və bazar
          ədalətliliyini qoruyur.
        </p>
      </div>
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

function AuctionDetailsBlock({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-slate-900 sm:px-5 sm:py-4">
        <span>{title}</span>
        <span className="shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </summary>
      <div className="border-t border-slate-100 px-4 pb-4 pt-1 text-sm text-slate-600 sm:px-5 sm:pb-5">{children}</div>
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
      ? `${AUCTION_FEES.SELLER_COMMISSION_VEHICLE_MIN_AZN} ₼, max ${AUCTION_FEES.SELLER_COMMISSION_VEHICLE_CAP_AZN} ₼`
      : `${AUCTION_FEES.SELLER_COMMISSION_PART_MIN_AZN} ₼, max ${AUCTION_FEES.SELLER_COMMISSION_PART_CAP_AZN} ₼`;

  return (
    <div
      id={kind === "vehicle" ? "auction-vehicle" : "auction-part"}
      className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-white shadow-sm ${s.borderClass} ${s.ringClass}`}
    >
      <div className={`border-b px-5 py-3.5 ${s.headerClass}`}>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">{subtitle}</p>
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
          who="Qalib alıcı"
          desc="Öhdəlik pozulduqda; bank checkout ilə."
        />
        <AuctionFeeRow
          title="Satıcı pozuntusu"
          value={`${getSellerBreachPenaltyAzn(kind)} ₼`}
          who="Satıcı"
          desc="Satış öhdəliyi pozulduqda; bank checkout ilə."
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
          Sadə, ədalətli, gizli ödənişsiz. Fərdi satıcılar üçün pulsuz başlayır, biznes üçün aylıq abunə.
        </p>
      </div>

      <div className="mx-auto max-w-5xl space-y-20 px-4 py-16 sm:px-6 lg:px-8">
        {/* Quick nav */}
        <nav className="flex flex-wrap justify-center gap-2">
          {[
            { href: "#listings", label: "Elan planları" },
            { href: "#boost", label: "İrəliləmə xidmətləri" },
            { href: "#dealer", label: "Salon planları" },
            { href: "#parts-store", label: "Hissə mağazası" },
            { href: "#auction", label: "Auksion haqları" }
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-[#0891B2]/40 hover:text-[#0891B2]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* ─── 1. Listing plans ──────────────────────────────────────── */}
        <section id="listings" className="scroll-mt-20">
          <SectionHeader
            label="Fərdi satıcı planları"
            title="Elan qiymət planları"
            sub="Hər elan ayrıca plan seçir. Eyni anda yalnız 1 pulsuz aktiv elanınız ola bilər."
          />

          {/* Two-column info boxes */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-semibold text-amber-900">Pulsuz plan → 1 aktiv elan limiti</p>
              <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                Bir istifadəçi eyni anda yalnız <strong>1 aktiv pulsuz elan</strong> yerləşdirə bilər.
                İkinci pulsuz elan üçün birinci elanın müddəti bitməlidir (30 gün + 7 gün lütf müddəti).
                Eyni anda birdən çox elan istəyirsinizsə, Standart yaxud VIP plan seçin.
              </p>
            </div>
            <div className="flex-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <p className="text-sm font-semibold text-emerald-900">Ödənişli planlar → limitsiz</p>
              <p className="mt-1 text-xs text-emerald-700 leading-relaxed">
                Standart və VIP planlar <strong>eyni anda limitsiz sayda aktiv</strong> ola bilər — hər biri
                ayrıca ödənilir. Salon iseniz aylıq sabit ödənişli{" "}
                <a href="#dealer" className="underline font-medium">Salon planına</a> keçin.
              </p>
            </div>
          </div>

          {/* Dynamic pricing table */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3.5">
              <p className="text-sm font-semibold text-slate-800">
                Dinamik qiymət cədvəli — avtomobil satış qiymətinə görə
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Elan haqqı avtomobilin qiymət aralığına uyğun hesablanır. Pulsuz plan həmişə 0 ₼-dır.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="py-3 pl-5 pr-3 text-left font-medium">Avtomobil qiymət aralığı</th>
                    <th className="px-3 py-3 text-center font-medium">Pulsuz</th>
                    <th className="px-3 py-3 text-center font-medium text-slate-700">Standart</th>
                    <th className="px-3 py-3 text-center font-medium text-[#0891B2]">VIP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {PRICING_TIERS.map((tier, i) => (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="py-3 pl-5 pr-3 font-medium text-slate-700">{tier.labelAz}</td>
                      <td className="px-3 py-3 text-center text-slate-400">0 ₼</td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-800">
                        {tier.standardPriceAzn} ₼
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-[#0891B2]">
                        {tier.vipPriceAzn} ₼
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-slate-400">
                Elan yerləşdirərkən qiymət aralığı avtomatik seçilir. Nəhayət təsdiq addımında dəqiq məbləği görəcəksiniz.
              </p>
              <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                Standart plan həmişə rəqib platformalardan ucuzdur
              </span>
            </div>
          </div>

          {/* Image processing info */}
          <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm font-semibold text-slate-800">Şəkil emalı — bütün planlar üçün eynidir</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-[#0891B2]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#0891B2]">AUTO</span>
                <span><strong>İstənilən format qəbul olunur</strong> — JPEG, PNG, WebP, HEIC, BMP. Sistem avtomatik JPEG-ə çevirir.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">SXIL</span>
                <span><strong>Böyük fayllar avtomatik sıxılır</strong> — 85% JPEG keyfiyyəti, max 1280 px. 10 MB telefon fotosu ~800 KB-a endirilir.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">LIMIT</span>
                <span><strong>Hər plan öz şəkil limiti var</strong> — Pulsuz: 8, Standart: 15, VIP: 20 şəkil.</span>
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
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-900">{plan.nameAz}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      {plan.priceAzn === 0 ? (
                        <span className="text-3xl font-bold text-slate-900">Pulsuz</span>
                      ) : (
                        <>
                          <span className="text-xs text-slate-400 font-medium">-dən</span>
                          <span className={`text-3xl font-bold ${isVip ? "text-[#0891B2]" : "text-slate-900"}`}>
                            {isStandard ? "4" : "8"} ₼
                          </span>
                          <span className="text-sm text-slate-400">/ elan</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{plan.durationDays} gün aktiv</p>
                  </div>

                  {/* Feature chips */}
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{plan.maxImages} şəkil</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{plan.storageMb} MB</span>
                    {plan.videoEnabled
                      ? <span className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs">{plan.maxVideos} video</span>
                      : <span className="rounded-md bg-slate-100 text-slate-400 px-2 py-0.5 text-xs">Video yoxdur</span>
                    }
                    {plan.id === "free" && (
                      <span className="rounded-md bg-amber-50 text-amber-700 px-2 py-0.5 text-xs font-medium">1 aktiv limit</span>
                    )}
                  </div>

                  <ul className="flex-1 space-y-2 text-sm text-slate-600">
                    {plan.id === "free" && (
                      <>
                        <li className="flex items-center gap-2"><CheckIcon />Standart sıralanma</li>
                        <li className="flex items-center gap-2"><CheckIcon />Əsas axtarış görünüşü</li>
                        <li className="flex items-center gap-2 text-slate-400"><XIcon />Boost (ayrıca alına bilər)</li>
                        <li className="flex items-center gap-2 text-slate-400"><XIcon />Video</li>
                      </>
                    )}
                    {plan.id === "standard" && (
                      <>
                        <li className="flex items-center gap-2"><CheckIcon />Vurğulanmış elan kartı</li>
                        <li className="flex items-center gap-2"><CheckIcon />2× prioritet sıralama</li>
                        <li className="flex items-center gap-2"><CheckIcon />Baxış statistikası</li>
                        <li className="flex items-center gap-2"><CheckIcon />1 video (50 MB)</li>
                        <li className="flex items-center gap-2"><CheckIcon />Boost xidmətləri əlavə edilə bilər</li>
                      </>
                    )}
                    {plan.id === "vip" && (
                      <>
                        <li className="flex items-center gap-2"><CheckIcon />Ana səhifə VIP bloku</li>
                        <li className="flex items-center gap-2"><CheckIcon />4× prioritet sıralama</li>
                        <li className="flex items-center gap-2"><CheckIcon />Vurğulanmış görünüş + ribbon</li>
                        <li className="flex items-center gap-2"><CheckIcon />Baxış & klik statistikası</li>
                        <li className="flex items-center gap-2"><CheckIcon />3 video (100 MB/video)</li>
                        <li className="flex items-center gap-2"><CheckIcon />Boost xidmətləri əlavə edilə bilər</li>
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
            label="İrəliləmə xidmətləri"
            title="Elanını daha çox gördür"
            sub="Elan planından ayrı olaraq satın alınır. İstənilən plana əlavə edilə bilər."
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
                desc: "Elanı ən yeni kimi sıralamaya qaldırır — axtarışda birinci görünür.",
                color: "bg-slate-50 border-slate-200"
              },
              {
                icon: (
                  <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                ),
                title: "VIP",
                desc: "Axtarış nəticəsinin yuxarısındakı VIP blokunda görünür. Kart üzərində V işarəsi.",
                color: "bg-amber-50 border-amber-200"
              },
              {
                icon: (
                  <svg className="h-6 w-6 text-[#0891B2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ),
                title: "Premium",
                desc: "Ana səhifənin Premium blokunda görünür. Ən yüksək görünürlük + VIP + İrəli çək daxildir.",
                color: "bg-[#0891B2]/5 border-[#0891B2]/20"
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
                <div key={pkg.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-800">{pkg.nameAz}</p>
                  <p className="mt-1 flex-1 text-xs text-slate-500 leading-relaxed">{pkg.descriptionAz}</p>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-slate-900">{pkg.priceAzn} ₼</span>
                    {pkg.isPopular && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Populyar</span>
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
                  className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm ${
                    pkg.isPopular ? "border-amber-300 ring-1 ring-amber-200" : "border-amber-200"
                  }`}
                >
                  <p className="text-sm font-semibold text-amber-900">{pkg.nameAz}</p>
                  {pkg.includedBonuses.length > 0 && (
                    <p className="mt-1 text-xs text-amber-700">{pkg.includedBonuses[0]}</p>
                  )}
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-amber-900">{pkg.priceAzn} ₼</span>
                    {pkg.isPopular && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Populyar</span>
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
                  className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm ${
                    pkg.isPopular
                      ? "border-[#0891B2] ring-1 ring-[#0891B2]/30"
                      : "border-[#0891B2]/25"
                  }`}
                >
                  <p className="text-sm font-semibold text-[#0891B2]">{pkg.nameAz}</p>
                  {pkg.includedBonuses.length > 0 && (
                    <ul className="mt-1 flex-1 space-y-0.5 text-xs text-slate-500">
                      {pkg.includedBonuses.map((b) => (
                        <li key={b} className="flex items-center gap-1">
                          <span className="text-[#0891B2]">✓</span> {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-[#0891B2]">{pkg.priceAzn} ₼</span>
                    {pkg.isPopular && (
                      <span className="rounded-full bg-[#0891B2]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0891B2]">Populyar</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
            <strong className="text-slate-800">Necə alınır?</strong> Aktiv elan idarə panelindən
            istədiyiniz paketi seçib ödəniş edin. Boost aktivləşmə ani olur.
            Salonlar aylıq abunəsinə daxil olan boost kreditlərindən avtomatik istifadə edə bilər.
          </div>
        </section>

        {/* ─── 3. Dealer plans ───────────────────────────────────────── */}
        <section id="dealer" className="scroll-mt-20">
          <SectionHeader
            label="Avtomobil salonları"
            title="Salon abunə planları"
            sub="Aylıq abunə → aktiv elan slotu. Abunə aktiv olduqca bütün elanlar görünür."
          />

          <NoBizFreeBanner />

          {/* Slot logic explainer */}
          <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm">
            <p className="font-semibold text-blue-900">Salon planı necə işləyir?</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3 text-xs text-blue-800">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-blue-500">①</span>
                <span><strong>Slot sistemi:</strong> Hər plan N aktiv elan slotu verir. Slot fərdi elan planı seçmədən doldurulur — keyfiyyət planla sabitdir.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-blue-500">②</span>
                <span><strong>Satılanda azalır:</strong> Avtomobil satılanda/silinəndə slot azad olur, yeni avtomobil girir. Əlavə ödəniş yoxdur.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-blue-500">③</span>
                <span><strong>Abunə bitincə:</strong> Bütün elanlar lütf müddəti qurtarana qədər gizlənir — silinmir. Abunə yenilənincə geri qayıdır.</span>
              </div>
            </div>
          </div>

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
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-slate-900">{plan.nameAz}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${plan.highlight ? "text-[#0891B2]" : "text-slate-900"}`}>
                      {plan.priceAzn} ₼
                    </span>
                    <span className="text-sm text-slate-400">/ ay</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {plan.maxActiveListings} aktiv elan slotu
                  </p>
                </div>

                {/* Feature chips */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {plan.perListingMaxImages} şəkil/elan
                  </span>
                  {plan.videoEnabled && (
                    <span className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                      {plan.maxVideosPerListing} video/elan
                    </span>
                  )}
                  {plan.csvImportEnabled && (
                    <span className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
                      CSV import
                    </span>
                  )}
                  {plan.vinCreditsPerMonth > 0 && (
                    <span className="rounded-md bg-purple-50 text-purple-700 px-2 py-0.5 text-xs">
                      {plan.vinCreditsPerMonth} VIN/ay
                    </span>
                  )}
                  {plan.boostCreditsPerMonth > 0 && (
                    <span className="rounded-md bg-amber-50 text-amber-700 px-2 py-0.5 text-xs">
                      {plan.boostCreditsPerMonth} boost/ay
                    </span>
                  )}
                  {plan.multiBranchEnabled && (
                    <span className="rounded-md bg-rose-50 text-rose-700 px-2 py-0.5 text-xs font-medium">
                      Çox filial
                    </span>
                  )}
                  <span className="rounded-md bg-slate-50 text-slate-500 px-2 py-0.5 text-xs">
                    {plan.listingRefreshDays} gündə bir yoxlama
                  </span>
                </div>

                <ul className="flex-1 space-y-2 text-sm text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckIcon />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/dealer"
                  className="mt-6 block w-full rounded-xl bg-[#0891B2] py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#0e7490]"
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
            sub="Kataloq (SKU) əsaslı elan sistemi. Salondan fərqli olaraq stok izləmə və uyğunluq məlumatı daxildir."
          />

          <NoBizFreeBanner />

          {/* Parts store vs dealer logic explainer */}
          <div className="mb-8 rounded-2xl border border-fuchsia-100 bg-fuchsia-50 px-5 py-4 text-sm">
            <p className="font-semibold text-fuchsia-900">Mağaza planı salondan necə fərqlənir?</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3 text-xs text-fuchsia-800">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-fuchsia-500">①</span>
                <span><strong>SKU kataloqu:</strong> Hər elan bir hissə tipidir (SKU). Satılanda stok azalır, elan silinmir — "stokda yoxdur" olur.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-fuchsia-500">②</span>
                <span><strong>Uyğunluq axtarışı:</strong> Alıcılar hansı avto markaları/modelləri/illəri üçün hissə axtardığını göstərir. Mağaza uyğun elanları sıraya çəkir.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-fuchsia-500">③</span>
                <span><strong>Az foto lazımdır:</strong> Hissə elanlarında 5-12 şəkil tam kifayətdir. 25-40 şəkil gərəksiзdir — avtomobil elanı ilə qarışdırmayın.</span>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {PARTS_STORE_PLANS.map((plan) => (
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
                      {plan.priceAzn} ₼
                    </span>
                    <span className="text-sm text-slate-400">/ ay</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {plan.maxActiveListings.toLocaleString("az-AZ")} aktiv SKU
                  </p>
                </div>

                {/* Feature chips */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {plan.perListingMaxImages} şəkil/SKU
                  </span>
                  {plan.stockTrackingEnabled && (
                    <span className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                      Stok izləmə
                    </span>
                  )}
                  {plan.compatibilityEnabled && (
                    <span className="rounded-md bg-fuchsia-50 text-fuchsia-700 px-2 py-0.5 text-xs font-medium">
                      Uyğunluq məlumatı
                    </span>
                  )}
                  {plan.csvImportEnabled && (
                    <span className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
                      CSV import
                    </span>
                  )}
                  {plan.boostCreditsPerMonth > 0 && (
                    <span className="rounded-md bg-amber-50 text-amber-700 px-2 py-0.5 text-xs">
                      {plan.boostCreditsPerMonth} boost/ay
                    </span>
                  )}
                  {plan.multiWarehouseEnabled && (
                    <span className="rounded-md bg-rose-50 text-rose-700 px-2 py-0.5 text-xs font-medium">
                      Çox anbar
                    </span>
                  )}
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
                  href="/publish"
                  className="mt-6 block w-full rounded-xl bg-[#0891B2] py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#0e7490]"
                >
                  Paketi seç
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 5. Auction fees ───────────────────────────────────────── */}
        <section id="auction" className="scroll-mt-20">
          <SectionHeader
            label="Canlı hərrac"
            title="Auksion haqq strukturu"
            sub="Əsas rəqəmlər aşağıdadır. Təfərrüat və qaydalar üçün keçidlərdən istifadə edin."
          />

          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-sm text-slate-600">
              Əsas satış məbləği platformadan keçmir — alıcı satıcıya birbaşa ödəyir. Cədvəldə yalnız platforma
              haqları var.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              <Link
                href="/rules/auction"
                className="font-semibold text-[#0891B2] underline decoration-[#0891B2]/40 underline-offset-4 hover:decoration-[#0891B2]"
              >
                Auksion qaydaları (tam mətn)
              </Link>
              <span className="hidden text-slate-300 sm:inline" aria-hidden>|</span>
              <a href="#auction-vehicle" className="font-medium text-slate-700 hover:text-[#0891B2]">
                Avtomobil haqları
              </a>
              <a href="#auction-part" className="font-medium text-fuchsia-800 hover:underline">
                Hissə haqları
              </a>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span className="text-sm font-medium text-slate-800">Alıcı premium (pilot)</span>
            <span className="text-lg font-bold text-emerald-600">Pulsuz</span>
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
            <AuctionDetailsBlock title="Ödəniş və intizam cərimələri — necə işləyir?">
              <p className="leading-relaxed text-slate-600">
                İki kart eyni quruluşdadır ki, avtomobil ilə hissəni asan müqayisə edəsiniz. No-show və satıcı
                pozuntusu üzrə məbləğlər ayrıca bank checkout ilə ödənilir; kartdan avtomatik çıxılma və ya depositin
                birbaşa cəriməyə çevrilməsi tətbiq edilmir. Ətraflı hüquqi izah və SLA üçün{" "}
                <Link href="/rules/auction" className="font-semibold text-[#0891B2] underline underline-offset-2">
                  auksion qaydaları
                </Link>{" "}
                səhifəsinə keçin.
              </p>
            </AuctionDetailsBlock>
            <AuctionDetailsBlock title="Satıcı üçün addımlar (A–Z)">
              <ol className="list-decimal space-y-2.5 pl-5 marker:font-medium marker:text-[#0891B2]">
                {AUCTION_SELLER_STEPS_AZ.map((s) => (
                  <li key={s} className="leading-relaxed">{s}</li>
                ))}
              </ol>
            </AuctionDetailsBlock>
            <AuctionDetailsBlock title="Alıcı üçün addımlar (A–Z)">
              <ol className="list-decimal space-y-2.5 pl-5 marker:font-medium marker:text-[#0891B2]">
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
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Tez-tez soruşulan suallar</h2>
          <div className="space-y-5 divide-y divide-slate-100">
            {[
              {
                q: "Elan haqqım nə qədər olacaq?",
                a: "Pulsuz elan həmişə 0 ₼-dır. Standart və VIP planların qiyməti avtomobilin satış qiymətinə görə dəyişir — yuxarıdakı cədvəldən baxın. Elan yerləşdirərkən təsdiq addımında dəqiq məbləği görəcəksiniz."
              },
              {
                q: "Boost xidmətini nə vaxt almaq lazımdır?",
                a: "İstənilən vaxt — elan aktiv olduqdan sonra idarə panelindən boost əlavə edə bilərsiniz. Elan yerləşdirərkən də boost seçmək mümkündür."
              },
              {
                q: "Salon olaraq niyə pulsuz plan yoxdur?",
                a: "Salonlar kommersiya subyektlərdir. Pulsuz sıralamaya düşmək fərdi satıcılara qarşı ədalətsizlik yaradır. Baza planımız (29 ₼/ay) artıq çox əlverişli qiymətdə geniş imkanlar təqdim edir."
              },
              {
                q: "Auksion lotunu uduzsam lot haqqı geri qaytarılırmı?",
                a: "Xeyr. Lot haqqı geri qaytarılmır. Komisyon yalnız satış olarsa tutulur."
              },
              {
                q: "Avtomobilin əsas ödənişini EkoMobil qəbul edirmi?",
                a: "Xeyr. Əsas məbləğ alıcıdan satıcıya birbaşa ödənilir. Platforma yalnız elan, boost və komisyon haqlarını alır."
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
