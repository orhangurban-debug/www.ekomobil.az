"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AUCTION_FEES,
  calcSellerCommission,
  calcSellerPerformanceBond,
  getLotListingFeeAzn
} from "@/lib/auction-fees";

function InfoHint({ text }: { text: string }) {
  return (
    <details className="group relative inline-block">
      <summary className="list-none cursor-pointer">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold text-slate-500 transition hover:border-[#0891B2] hover:text-[#0891B2]">
          i
        </span>
      </summary>
      <div className="absolute left-0 z-20 mt-1.5 w-72 rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-normal leading-relaxed text-slate-600 shadow-lg">
        {text}
      </div>
    </details>
  );
}

interface SellableListing {
  id: string;
  title: string;
  priceAzn: number;
  status: string;
  make: string;
  model: string;
  year: number;
  city: string;
  mileageKm: number;
  fuelType: string;
  transmission: string;
  vinProvided: boolean;
  trustScore: number;
  planType?: string;
  listingKind: "vehicle" | "part";
  vinVerified: boolean;
  sellerVerified: boolean;
  mediaComplete: boolean;
}

export function AuctionSellForm({
  listings,
  deepKycApproved
}: {
  listings: SellableListing[];
  deepKycApproved: boolean;
}) {
  const router = useRouter();
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [reservePriceAzn, setReservePriceAzn] = useState("");
  const [buyNowPriceAzn, setBuyNowPriceAzn] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositAmountAzn, setDepositAmountAzn] = useState("");
  const [sellerBondRequired, setSellerBondRequired] = useState(false);
  const [sellerBondAmountAzn, setSellerBondAmountAzn] = useState("");
  const [vinInfoType, setVinInfoType] = useState<"link" | "document">("link");
  const [vinInfoUrl, setVinInfoUrl] = useState("");
  const [vinDocumentRef, setVinDocumentRef] = useState("");
  const [serviceHistoryType, setServiceHistoryType] = useState<"link" | "document">("link");
  const [serviceHistoryUrl, setServiceHistoryUrl] = useState("");
  const [serviceHistoryDocumentRef, setServiceHistoryDocumentRef] = useState("");
  const [ackMarketplace, setAckMarketplace] = useState(false);
  const [ackOffPlatform, setAckOffPlatform] = useState(false);
  const [ackFees, setAckFees] = useState(false);
  const [ackNoLiability, setAckNoLiability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postCreate, setPostCreate] = useState<{
    auctionId: string;
    lotCheckoutUrl: string;
    bondCheckoutUrl?: string;
  } | null>(null);

  const sellerAckComplete = ackMarketplace && ackOffPlatform && ackFees && ackNoLiability;

  const selected = useMemo(
    () => listings.find((item) => item.id === listingId) ?? listings[0],
    [listingId, listings]
  );
  const isHighValue = Boolean(selected && selected.priceAzn >= AUCTION_FEES.HIGH_VALUE_LOT_THRESHOLD_AZN);
  const suggestedSellerBond = selected ? calcSellerPerformanceBond(selected.priceAzn) : 0;
  const listingFeeAzn = getLotListingFeeAzn(selected?.listingKind);
  const successFeePreviewAzn = selected ? calcSellerCommission(selected.priceAzn, selected.listingKind) : 0;
  const successFeeRateLabel = selected?.listingKind === "part" ? "3%" : "1.2%";
  const successFeeMinLabel = selected?.listingKind === "part" ? "2 ₼" : "25 ₼";
  const successFeeCapLabel = selected?.listingKind === "part" ? "40 ₼" : "700 ₼";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    if (!sellerAckComplete) {
      setError("Lot yaratmaq üçün aşağıdakı bütün öhdəlik bəndlərini qəbul edin.");
      return;
    }
    if (isHighValue && !sellerBondRequired && !deepKycApproved) {
      setError("Yüksək dəyərli lot üçün deep KYC yoxdursa satıcı bond aktiv edilməlidir.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const createResponse = await fetch("/api/auctions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: selected.id,
        mode: reservePriceAzn ? "reserve" : "ascending",
        startingBidAzn: selected.priceAzn,
        reservePriceAzn: reservePriceAzn ? Number(reservePriceAzn) : undefined,
        buyNowPriceAzn: buyNowPriceAzn ? Number(buyNowPriceAzn) : undefined,
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
        depositRequired,
        depositAmountAzn: depositRequired && depositAmountAzn ? Number(depositAmountAzn) : undefined,
        sellerBondRequired,
        sellerBondAmountAzn: sellerBondRequired
          ? Number(sellerBondAmountAzn || suggestedSellerBond)
          : undefined,
        vinInfoUrl: vinInfoType === "link" ? vinInfoUrl.trim() || undefined : undefined,
        serviceHistoryUrl: serviceHistoryType === "link" ? serviceHistoryUrl.trim() || undefined : undefined,
        vinDocumentRef: vinInfoType === "document" ? vinDocumentRef.trim() || undefined : undefined,
        serviceHistoryDocumentRef:
          serviceHistoryType === "document" ? serviceHistoryDocumentRef.trim() || undefined : undefined,
        sellerTermsAccepted: true as const
      })
    });
    const createPayload = (await createResponse.json()) as {
      ok: boolean;
      error?: string;
      auction?: { id: string };
    };
    if (!createPayload.ok || !createPayload.auction?.id) {
      setError(createPayload.error || "Auksion lotu yaradıla bilmədi.");
      setSubmitting(false);
      return;
    }

    const paymentResponse = await fetch("/api/payments/auction-lot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auctionId: createPayload.auction.id })
    });
    const lotPaymentPayload = (await paymentResponse.json()) as {
      ok: boolean;
      error?: string;
      checkoutUrl?: string;
    };
    if (!lotPaymentPayload.ok || !lotPaymentPayload.checkoutUrl) {
      setError(lotPaymentPayload.error || "Lot haqqı üçün checkout açıla bilmədi.");
      setSubmitting(false);
      return;
    }

    let bondCheckoutUrl: string | undefined;
    if (sellerBondRequired) {
      const bondResponse = await fetch("/api/payments/auction-seller-bond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId: createPayload.auction.id })
      });
      const bondPayload = (await bondResponse.json()) as {
        ok: boolean;
        error?: string;
        checkoutUrl?: string;
      };
      if (!bondPayload.ok || !bondPayload.checkoutUrl) {
        setError(bondPayload.error || "Satıcı bond checkout açıla bilmədi.");
        setSubmitting(false);
        return;
      }
      bondCheckoutUrl = bondPayload.checkoutUrl;
    }

    setPostCreate({
      auctionId: createPayload.auction.id,
      lotCheckoutUrl: lotPaymentPayload.checkoutUrl,
      bondCheckoutUrl
    });
    setSubmitting(false);
    router.refresh();
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Uyğun elan tapılmadı</h2>
        <p className="mt-2 text-sm text-slate-500">
          Auksion üçün VIN daxil edilmiş və media checklist-i tam olan bir elanınız olmalıdır.
        </p>
      </div>
    );
  }

  if (postCreate) {
    return (
      <div className="space-y-6 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Lot yaradıldı</h2>
          <p className="mt-2 text-sm text-slate-600">
            Lot haqqı ödənilməmiş auksion aktivləşmir. İstəsəniz əvvəlcə sənədləri yükləyin, sonra ödənişə keçin.
          </p>
          <p className="mt-1 font-mono text-xs text-slate-500">ID: {postCreate.auctionId}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={`/auction/${postCreate.auctionId}/documents`}
            className="btn-primary justify-center text-center"
          >
            Sənədləri yüklə
          </Link>
          <button
            type="button"
            className="btn-secondary justify-center"
            onClick={() => router.push(postCreate.lotCheckoutUrl)}
          >
            Lot haqqına keç
          </button>
          {postCreate.bondCheckoutUrl && (
            <button
              type="button"
              className="btn-secondary justify-center"
              onClick={() => router.push(postCreate.bondCheckoutUrl!)}
            >
              Satıcı bond checkout
            </button>
          )}
          <button type="button" className="btn-secondary justify-center text-slate-500" onClick={() => setPostCreate(null)}>
            Geri (formaya)
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="label flex items-center gap-2">
          <span>Elan seçin</span>
          <InfoHint text="Auksiona qoymaq istədiyiniz mövcud elanı seçin. Burada yalnız lot qaydalarına uyğun elanlar görünür." />
        </label>
        <select className="input-field" value={listingId} onChange={(e) => setListingId(e.target.value)}>
          {listings.map((listing) => (
            <option key={listing.id} value={listing.id}>
              {listing.make} {listing.model} {listing.year} • {listing.city} • {listing.priceAzn.toLocaleString("az-AZ")} ₼
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <div className="font-medium text-slate-900">{selected.title}</div>
          <div className="mt-1 text-slate-500">Başlanğıc bid: {selected.priceAzn.toLocaleString("az-AZ")} ₼</div>
          <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
              <span className="text-slate-400">Marka/Model</span>
              <div className="font-medium text-slate-700">{selected.make} {selected.model}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
              <span className="text-slate-400">İl / Şəhər</span>
              <div className="font-medium text-slate-700">{selected.year} • {selected.city}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
              <span className="text-slate-400">Yürüş</span>
              <div className="font-medium text-slate-700">{selected.mileageKm.toLocaleString("az-AZ")} km</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
              <span className="text-slate-400">Yanacaq / Ötürücü</span>
              <div className="font-medium text-slate-700">{selected.fuelType} • {selected.transmission}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
              <span className="text-slate-400">Plan / Status</span>
              <div className="font-medium text-slate-700">{selected.planType ?? "free"} • {selected.status}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
              <span className="text-slate-400">Trust</span>
              <div className="font-medium text-slate-700">{selected.trustScore}/100</div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {selected.listingKind === "part" ? (
              <span className="badge-verified">Hissə</span>
            ) : (
              <span className={selected.vinProvided ? "badge-verified" : "badge-warning"}>VIN daxil edilib</span>
            )}
            <span className={selected.sellerVerified ? "badge-verified" : "badge-warning"}>Satıcı</span>
            <span className={selected.mediaComplete ? "badge-verified" : "badge-warning"}>Media</span>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label flex items-center gap-2">
            <span>Rezerv qiymət (opsional)</span>
            <InfoHint text="Gizli minimum satış qiymətidir. Hərrac bu məbləğin altında bitərsə, satıcı satışdan imtina edə bilər." />
          </label>
          <input
            type="number"
            className="input-field"
            value={reservePriceAzn}
            onChange={(e) => setReservePriceAzn(e.target.value)}
            placeholder="Məs: 32500"
          />
        </div>
        <div>
          <label className="label flex items-center gap-2">
            <span>Buy-now qiymət (opsional)</span>
            <InfoHint text="Alıcı bu qiyməti qəbul edərsə hərrac dərhal tamamlanır. Sürətli satış üçün istifadə olunur." />
          </label>
          <input
            type="number"
            className="input-field"
            value={buyNowPriceAzn}
            onChange={(e) => setBuyNowPriceAzn(e.target.value)}
            placeholder="Məs: 36000"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label flex items-center gap-2">
            <span>Başlama vaxtı (opsional)</span>
            <InfoHint text="Boş saxlasanız lot dərhal aktivləşir. Gələcək tarix seçsəniz lot həmin vaxt başlayacaq." />
          </label>
          <input type="datetime-local" className="input-field" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div>
          <label className="label flex items-center gap-2">
            <span>Bitmə vaxtı (opsional)</span>
            <InfoHint text="Boş saxlasanız standart olaraq 24 saatlıq hərrac yaradılır. Özünüz daha uzun/qısa müddət verə bilərsiniz." />
          </label>
          <input type="datetime-local" className="input-field" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
          <input type="checkbox" checked={depositRequired} onChange={(e) => setDepositRequired(e.target.checked)} />
          <span className="inline-flex items-center gap-2">
            Yüksək riskli lot üçün bidder deposit tələb et
            <InfoHint text="Alıcıların ciddi təklif verməsi üçün öncədən depozit tələb olunur. No-show halları azalır." />
          </span>
        </label>
        {depositRequired && (
          <div className="mt-3">
            <label className="label flex items-center gap-2">
              <span>Deposit məbləği (₼)</span>
              <InfoHint text="Qalib alıcı üçün bloklanan məbləğdir. Məbləği lot dəyərinə uyğun seçin (məs: 500-2000 ₼)." />
            </label>
            <input
              type="number"
              className="input-field"
              value={depositAmountAzn}
              onChange={(e) => setDepositAmountAzn(e.target.value)}
              placeholder="Məs: 500"
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span>VIN və servis tarixçə məlumatları (tövsiyə olunur)</span>
          <InfoHint text="Bu məlumatlar alıcı etibarını artırır və lotun daha sürətli satılmasına kömək edir. Link və ya sənəd istinadı əlavə edə bilərsiniz." />
        </div>
        <p className="mb-3 text-xs text-slate-600">
          Satışın daha sürətli və etibarlı getməsi üçün bu məlumatları ya açıq link, ya da sənəd istinadı formatında paylaşa bilərsiniz.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label flex items-center gap-2">
              <span>VIN məlumat formatı</span>
              <InfoHint text="VIN tarixçəsini ya açıq URL ilə, ya da sənəd referansı ilə təqdim edin." />
            </label>
            <select
              className="input-field"
              value={vinInfoType}
              onChange={(e) => setVinInfoType(e.target.value as "link" | "document")}
            >
              <option value="link">Açıq link</option>
              <option value="document">Sənəd istinadı</option>
            </select>
            {vinInfoType === "link" ? (
              <input
                type="url"
                className="input-field mt-2"
                value={vinInfoUrl}
                onChange={(e) => setVinInfoUrl(e.target.value)}
                placeholder="https://..."
              />
            ) : (
              <input
                type="text"
                className="input-field mt-2"
                value={vinDocumentRef}
                onChange={(e) => setVinDocumentRef(e.target.value)}
                placeholder="Məs: VIN-report.pdf və ya sənəd ID"
              />
            )}
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <span>Servis tarixçə formatı</span>
              <InfoHint text="Servis qeydlərini ya açıq URL, ya da sənəd referansı ilə əlavə edin." />
            </label>
            <select
              className="input-field"
              value={serviceHistoryType}
              onChange={(e) => setServiceHistoryType(e.target.value as "link" | "document")}
            >
              <option value="link">Açıq link</option>
              <option value="document">Sənəd istinadı</option>
            </select>
            {serviceHistoryType === "link" ? (
              <input
                type="url"
                className="input-field mt-2"
                value={serviceHistoryUrl}
                onChange={(e) => setServiceHistoryUrl(e.target.value)}
                placeholder="https://..."
              />
            ) : (
              <input
                type="text"
                className="input-field mt-2"
                value={serviceHistoryDocumentRef}
                onChange={(e) => setServiceHistoryDocumentRef(e.target.value)}
                placeholder="Məs: service-history.pdf və ya sənəd ID"
              />
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
          <input
            type="checkbox"
            checked={sellerBondRequired}
            onChange={(e) => {
              setSellerBondRequired(e.target.checked);
              if (e.target.checked && !sellerBondAmountAzn && suggestedSellerBond > 0) {
                setSellerBondAmountAzn(String(suggestedSellerBond));
              }
            }}
          />
          <span className="inline-flex items-center gap-2">
            Yüksək dəyərli lot üçün satıcı performans bond aktiv et
            <InfoHint text="Bu məbləğ satıcının öhdəliyini təmin edən zəmanətdir. Lot yaradarkən ayrıca ödənir və qayda pozuntusu yoxdursa proses sonunda geri qaytarılır." />
          </span>
        </label>
        {isHighValue && (
          <p className="mt-2 text-xs text-amber-700">
            Bu lot yüksək dəyərli sayılır ({AUCTION_FEES.HIGH_VALUE_LOT_THRESHOLD_AZN.toLocaleString("az-AZ")} ₼+).
            {deepKycApproved ? " Deep KYC təsdiqiniz var, bond opsionaldır." : " Deep KYC yoxdursa bond tələb olunur."}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Bond satıcı üçün intizam təminatıdır: lot öhdəliyi yerinə yetirilərsə geri qaytarılır, pozuntu olarsa cəriməyə yönləndirilə bilər.
        </p>
        {sellerBondRequired && (
          <div className="mt-3">
            <label className="label flex items-center gap-2">
              <span>Satıcı bond məbləği (₼)</span>
              <InfoHint text="Sistem təklif etdiyi məbləği göstərir; ehtiyac olduqda daha yüksək məbləğ seçə bilərsiniz." />
            </label>
            <input
              type="number"
              className="input-field"
              value={sellerBondAmountAzn}
              onChange={(e) => setSellerBondAmountAzn(e.target.value)}
              placeholder={`Məs: ${suggestedSellerBond || 1000}`}
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-4 text-sm text-slate-700">
        Avtomobilin əsas satış ödənişi EkoMobil üzərindən keçmir. Qalib alıcı əsas məbləği birbaşa satıcıya ödəyir.
        Bu mərhələdə yalnız platforma lot haqqı checkout-u açılacaq ({listingFeeAzn.toLocaleString("az-AZ")} ₼).
        Alıcı iştirak etməzsə lot satışsız bağlanır və satış komisyonu tutulmur.
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Satıcı xərc preview-u</div>
          <p className="mt-1 text-xs text-slate-600">
            Komisyon yalnız uğurlu satışda tutulur. Lot haqqı isə lot aktivləşməsi üçün əvvəlcədən ödənilir.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
            <div className="text-xs text-slate-500">Lot haqqı</div>
            <div className="mt-1 text-xl font-bold text-slate-900">{listingFeeAzn.toLocaleString("az-AZ")} ₼</div>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
            <div className="text-xs text-slate-500">Uğurlu satış komisyonu</div>
            <div className="mt-1 text-xl font-bold text-slate-900">{successFeePreviewAzn.toLocaleString("az-AZ")} ₼</div>
            <div className="mt-1 text-[11px] text-slate-500">
              {successFeeRateLabel} · min {successFeeMinLabel} · max {successFeeCapLabel}
            </div>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
            <div className="text-xs text-slate-500">Bu elan üçün nümunə ümumi xərc</div>
            <div className="mt-1 text-xl font-bold text-[#0891B2]">
              {(listingFeeAzn + successFeePreviewAzn).toLocaleString("az-AZ")} ₼
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {listingFeeAzn.toLocaleString("az-AZ")} + {successFeePreviewAzn.toLocaleString("az-AZ")} = {(listingFeeAzn + successFeePreviewAzn).toLocaleString("az-AZ")} ₼
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Lot haqqı dərhal, komisyon isə yalnız uğurlu satışda</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span>Alıcı avtomobili necə yoxlayır?</span>
          <InfoHint text="Platforma baxış görüşünü avtomatik təşkil etmir. Satıcı və alıcı lot daxilində əlaqələnib baxış vaxtını razılaşdırır." />
        </div>
        <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-slate-600">
          <li>Alıcı lota təklif verir və satıcı ilə əlaqə üçün maraq bildirir.</li>
          <li>Satıcı alıcı ilə danışıb görüş vaxtı/məkanını təyin edir.</li>
          <li>Alıcı yerində texniki baxış və test sürüşü edir.</li>
          <li>Baxış nəticəsinə görə hərrac davam edir və ya alıcı təklifdən imtina edir.</li>
        </ol>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span>Satıcı öhdəlik bəndləri</span>
          <InfoHint text="Lot yaratmaq üçün bu bəndlərin hamısını qəbul etmək tələb olunur. Bu, hüquqi və əməliyyat qaydalarına uyğunluq üçündür." />
        </div>
        <p className="text-xs text-slate-600">
          Ətraflı axın və mərhələlər:{" "}
          <Link href="/rules/auction" className="font-medium text-[#0891B2] hover:underline">
            Auksion çərçivəsi
          </Link>
        </p>
        <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={ackMarketplace}
            onChange={(e) => setAckMarketplace(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
          />
          <span>
            Elanın və lotun məlumatlarının düzgünlüyünə görə məsuliyyət daşıyıram; saxta və ya aldadıcı məlumat verməyəcəyəm.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={ackOffPlatform}
            onChange={(e) => setAckOffPlatform(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
          />
          <span>
            Qalib təklif qəbul edildikdən sonra satışı razılaşdırılmış müddət və üsulla tamamlamağı öhdəmə götürürəm; əsas ödəniş
            platformada saxlanmır.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={ackFees}
            onChange={(e) => setAckFees(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
          />
          <span>Lot haqqı, uğurlu satışda komisyon və qaydalarda göstərilən intizam ödənişləri ilə razıyam.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={ackNoLiability}
            onChange={(e) => setAckNoLiability(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
          />
          <span>
            Anlayıram ki, alıcı ilə aramda yaranan mübahisə, ödəniş və ya təhvil məsələlərində EkoMobil tərəf deyil və bu
            məsələlərə görə məsuliyyət daşımır.
          </span>
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting || !sellerAckComplete} className="btn-primary w-full justify-center disabled:opacity-50">
        {submitting ? "Hazırlanır..." : "Lot yarat və lot haqqına keç"}
      </button>
    </form>
  );
}
