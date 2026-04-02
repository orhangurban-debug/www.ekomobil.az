"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AUCTION_FEES, calcSellerPerformanceBond, getLotListingFeeAzn } from "@/lib/auction-fees";

interface SellableListing {
  id: string;
  title: string;
  priceAzn: number;
  status: string;
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
          Auksion üçün əvvəlcə VIN, satıcı və media yoxlamasını keçmiş bir elanınız olmalıdır.
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
        <label className="label">Elan seçin</label>
        <select className="input-field" value={listingId} onChange={(e) => setListingId(e.target.value)}>
          {listings.map((listing) => (
            <option key={listing.id} value={listing.id}>
              {listing.title} — {listing.priceAzn.toLocaleString("az-AZ")} ₼
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <div className="font-medium text-slate-900">{selected.title}</div>
          <div className="mt-1 text-slate-500">
            Başlanğıc bid: {selected.priceAzn.toLocaleString("az-AZ")} ₼
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {selected.listingKind === "part" ? (
              <span className="badge-verified">Hissə</span>
            ) : (
              <span className={selected.vinVerified ? "badge-verified" : "badge-warning"}>VIN</span>
            )}
            <span className={selected.sellerVerified ? "badge-verified" : "badge-warning"}>Satıcı</span>
            <span className={selected.mediaComplete ? "badge-verified" : "badge-warning"}>Media</span>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Rezerv qiymət (opsional)</label>
          <input
            type="number"
            className="input-field"
            value={reservePriceAzn}
            onChange={(e) => setReservePriceAzn(e.target.value)}
            placeholder="Məs: 32500"
          />
        </div>
        <div>
          <label className="label">Buy-now qiymət (opsional)</label>
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
          <label className="label">Başlama vaxtı (opsional)</label>
          <input type="datetime-local" className="input-field" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div>
          <label className="label">Bitmə vaxtı (opsional)</label>
          <input type="datetime-local" className="input-field" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
          <input type="checkbox" checked={depositRequired} onChange={(e) => setDepositRequired(e.target.checked)} />
          Yüksək riskli lot üçün bidder deposit tələb et
        </label>
        {depositRequired && (
          <div className="mt-3">
            <label className="label">Deposit məbləği (₼)</label>
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
        <div className="mb-3 text-sm font-semibold text-slate-900">VIN və servis tarixçə məlumatları (tövsiyə olunur)</div>
        <p className="mb-3 text-xs text-slate-600">
          Satışın daha sürətli və etibarlı getməsi üçün bu məlumatları ya açıq link, ya da sənəd istinadı formatında paylaşa bilərsiniz.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">VIN məlumat formatı</label>
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
            <label className="label">Servis tarixçə formatı</label>
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
          Yüksək dəyərli lot üçün satıcı performans bond aktiv et
        </label>
        {isHighValue && (
          <p className="mt-2 text-xs text-amber-700">
            Bu lot yüksək dəyərli sayılır ({AUCTION_FEES.HIGH_VALUE_LOT_THRESHOLD_AZN.toLocaleString("az-AZ")} ₼+).
            {deepKycApproved ? " Deep KYC təsdiqiniz var, bond opsionaldır." : " Deep KYC yoxdursa bond tələb olunur."}
          </p>
        )}
        {sellerBondRequired && (
          <div className="mt-3">
            <label className="label">Satıcı bond məbləği (₼)</label>
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

      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="text-sm font-semibold text-slate-900">Satıcı öhdəlik bəndləri</div>
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
