"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface SellableListing {
  id: string;
  title: string;
  priceAzn: number;
  status: string;
  vinVerified: boolean;
  sellerVerified: boolean;
  mediaComplete: boolean;
}

export function AuctionSellForm({ listings }: { listings: SellableListing[] }) {
  const router = useRouter();
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [reservePriceAzn, setReservePriceAzn] = useState("");
  const [buyNowPriceAzn, setBuyNowPriceAzn] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositAmountAzn, setDepositAmountAzn] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => listings.find((item) => item.id === listingId) ?? listings[0],
    [listingId, listings]
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
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
        depositAmountAzn: depositRequired && depositAmountAzn ? Number(depositAmountAzn) : undefined
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
    const paymentPayload = (await paymentResponse.json()) as {
      ok: boolean;
      error?: string;
      checkoutUrl?: string;
    };
    if (!paymentPayload.ok || !paymentPayload.checkoutUrl) {
      setError(paymentPayload.error || "Lot haqqı üçün checkout açıla bilmədi.");
      setSubmitting(false);
      return;
    }

    router.push(paymentPayload.checkoutUrl);
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
            <span className={selected.vinVerified ? "badge-verified" : "badge-warning"}>VIN</span>
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

      <div className="rounded-xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-4 text-sm text-slate-700">
        Avtomobilin əsas satış ödənişi EkoMobil üzərindən keçmir. Qalib alıcı əsas məbləği birbaşa satıcıya ödəyir.
        Bu mərhələdə yalnız platforma lot haqqı checkout-u açılacaq.
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
        {submitting ? "Hazırlanır..." : "Lot yarat və lot haqqına keç"}
      </button>
    </form>
  );
}
