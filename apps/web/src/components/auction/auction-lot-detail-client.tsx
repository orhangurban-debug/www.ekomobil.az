"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AuctionBidRecord, AuctionListingRecord } from "@/lib/auction";
import { getAuctionStatusLabel, isAuctionOpen } from "@/lib/auction";
import {
  fetchAuctionBids,
  fetchAuctionList,
  fetchAuctionState,
  subscribeAuctionStream
} from "@/lib/auction-realtime";
import {
  AuctionBidderRulesAckLine,
  AuctionTermsAcceptedBadge,
  useAuctionBidderRulesAck
} from "@/components/auction/auction-bidder-rules-ack";

function useCountdown(endAt?: string) {
  const [parts, setParts] = useState({ total: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const id = window.setInterval(() => {
      const target = endAt ? new Date(endAt).getTime() : 0;
      const diff = Math.max(0, target - Date.now());
      setParts({
        total: diff,
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000)
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [endAt]);

  return parts;
}

function CountdownDisplay({ endAt }: { endAt?: string }) {
  const { h, m, s, total } = useCountdown(endAt);
  const urgent = total > 0 && total < 30 * 60 * 1000;

  return (
    <div className={`flex items-center gap-1 ${urgent ? "text-rose-500" : "text-white"}`}>
      {[[h, "S"], [m, "D"], [s, "SN"]].map(([value, label]) => (
        <div key={String(label)} className="flex flex-col items-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl font-mono text-2xl font-bold tabular-nums ${urgent ? "bg-rose-500/20 text-rose-400" : "bg-white/10"}`}>
            {String(value).padStart(2, "0")}
          </div>
          <span className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{label}</span>
        </div>
      ))}
    </div>
  );
}

function maskBidder(id: string) {
  return `${id.slice(0, 3)}***${id.slice(-2)}`;
}

export function AuctionLotDetailClient({ auctionId }: { auctionId: string }) {
  const [lot, setLot] = useState<AuctionListingRecord | null>(null);
  const [bids, setBids] = useState<AuctionBidRecord[]>([]);
  const [otherLots, setOtherLots] = useState<AuctionListingRecord[]>([]);
  const [bidAmount, setBidAmount] = useState("");
  const [autoBidMax, setAutoBidMax] = useState("");
  const [activeTab, setActiveTab] = useState<"bid" | "auto">("bid");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { acknowledged: bidderRulesAck, setAcknowledged: setBidderRulesAck } = useAuctionBidderRulesAck();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [auction, history, auctions] = await Promise.all([
          fetchAuctionState(auctionId),
          fetchAuctionBids(auctionId),
          fetchAuctionList()
        ]);
        if (cancelled) return;
        setLot(auction);
        setBids(history);
        setOtherLots(auctions.filter((item) => item.id !== auctionId).slice(0, 6));
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Lot yüklənmədi");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const unsubscribe = subscribeAuctionStream(auctionId, {
      onSnapshot: ({ auction, bids: snapshotBids }) => {
        if (auction) setLot(auction);
        if (snapshotBids) setBids(snapshotBids);
      },
      onBidAccepted: ({ auction, bid }) => {
        if (auction) setLot(auction);
        if (bid) setBids((current) => [bid, ...current.filter((item) => item.id !== bid.id)].slice(0, 50));
      },
      onCoordination: ({ auction }) => {
        if (auction) setLot(auction);
      },
      onError: () => {
        void load();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [auctionId]);

  const minBid = useMemo(() => {
    if (!lot) return 0;
    return (lot.currentBidAzn ?? lot.startingBidAzn) + lot.minimumIncrementAzn;
  }, [lot]);

  async function submitBid() {
    if (!lot) return;
    if (!bidderRulesAck) {
      setError("Təklif verməzdən əvvəl auksion şərtlərini qəbul edin.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const amountAzn = activeTab === "auto" ? minBid : Number(bidAmount);
    const response = await fetch(`/api/auctions/${lot.id}/bid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountAzn,
        autoBidMaxAzn: activeTab === "auto" ? Number(autoBidMax) : undefined
      })
    });
    const payload = (await response.json()) as {
      ok: boolean;
      error?: string;
      code?: string;
      preauthAmountAzn?: number;
    };

    if (!payload.ok) {
      if (payload.code === "PREAUTH_REQUIRED") {
        const preauthResponse = await fetch(`/api/auctions/${lot.id}/bid-preauth`, {
          method: "POST"
        });
        const preauthPayload = (await preauthResponse.json()) as {
          ok: boolean;
          error?: string;
          checkoutUrl?: string;
        };
        if (preauthPayload.ok && preauthPayload.checkoutUrl) {
          window.location.href = preauthPayload.checkoutUrl;
          return;
        }
        setError(preauthPayload.error ?? payload.error ?? "Kart hold checkout-u yaradıla bilmədi");
        setSubmitting(false);
        return;
      }
      setError(payload.error ?? "Bid göndərilmədi");
      setSubmitting(false);
      return;
    }

    setBidAmount("");
    setAutoBidMax("");
    setMessage("Təklif qəbul edildi.");
    setSubmitting(false);
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-slate-500">Lot məlumatları yüklənir...</div>;
  }

  if (!lot) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Lot tapılmadı</h1>
          <p className="mt-2 text-sm text-slate-500">Auksion lotu silinib və ya əlçatan deyil.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/auction" className="btn-primary">Auksiona qayıt</Link>
            <Link href="/pricing#auction" className="btn-secondary">Haq strukturu</Link>
          </div>
        </div>
      </div>
    );
  }

  const lotOpen = isAuctionOpen(lot.status);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative overflow-hidden bg-[#0c1a2e] px-4 py-12 text-center sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[#0891B2]/15 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-4 text-left">
            <Link href="/auction" className="text-sm text-white/60 hover:text-white">← Bütün lotlara qayıt</Link>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
            {lotOpen ? "Canlı lot" : "Lot statusu"}
          </span>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{lot.titleSnapshot}</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-white/50">
            Lot ID: {lot.id} · {getAuctionStatusLabel(lot.status)}
          </p>
          <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70 backdrop-blur">
            EkoMobil əsas satış ödənişini qəbul etmir. Platforma yalnız lot haqqı, deposit və xidmət haqlarını idarə edir.
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="relative flex h-64 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 sm:h-80">
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">{getAuctionStatusLabel(lot.status)}</span>
                </div>
                <div className="text-center">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Lot ID</div>
                  <div className="mt-2 font-mono text-sm text-slate-700">{lot.id}</div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {lot.depositRequired && <span className="badge-warning">Deposit tələb olunur</span>}
                      {lot.sellerBondRequired && <span className="badge-warning">Satıcı bond aktivdir</span>}
                    </div>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">{lot.titleSnapshot}</h2>
                    <p className="text-sm text-slate-500">Status: {getAuctionStatusLabel(lot.status)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Başlanğıc qiyməti</div>
                    <div className="text-sm text-slate-500">{lot.startingBidAzn.toLocaleString("az-AZ")} ₼</div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-rose-200/60 bg-rose-50/50 py-5">
                  <div className="text-xs font-semibold uppercase tracking-widest text-rose-500">
                    {lotOpen ? "Bitməyə qalan vaxt" : "Bitmə vaxtı"}
                  </div>
                  <CountdownDisplay endAt={lot.endsAt} />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#0891B2]/5 px-5 py-4 ring-1 ring-[#0891B2]/20">
                    <div className="text-xs text-slate-500">Cari ən yüksək təklif</div>
                    <div className="text-3xl font-bold text-[#0891B2]">
                      {(lot.currentBidAzn ?? lot.startingBidAzn).toLocaleString("az-AZ")} ₼
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Növbəti minimum</div>
                    <div className="text-xl font-bold text-slate-900">{minBid.toLocaleString("az-AZ")} ₼</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-slate-200">
                    <div className="text-xs text-slate-500">Minimum artım</div>
                    <div className="text-xl font-bold text-slate-900">{lot.minimumIncrementAzn.toLocaleString("az-AZ")} ₼</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h3 className="font-semibold text-slate-900">Təklif tarixi</h3>
                <span className="text-xs text-slate-400">{bids.length} təklif</span>
              </div>
              <div className="divide-y divide-slate-50">
                {bids.length === 0 ? (
                  <div className="px-6 py-8 text-sm text-slate-500">Hələ bid daxil olmayıb.</div>
                ) : (
                  bids.map((bid, index) => (
                    <div key={bid.id} className={`flex items-center justify-between px-6 py-3 ${index === 0 ? "bg-emerald-50/60" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                          {index === 0 ? "↑" : String(index + 1)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{maskBidder(bid.bidderUserId)}</div>
                          <div className="text-xs text-slate-400">{new Date(bid.createdAt).toLocaleString("az-AZ")}</div>
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${index === 0 ? "text-emerald-600" : "text-slate-600"}`}>
                        {bid.amountAzn.toLocaleString("az-AZ")} ₼
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="sticky top-20 space-y-4">
              {lotOpen ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">Təklif ver</h3>
                    {bidderRulesAck && <AuctionTermsAcceptedBadge />}
                  </div>
                  <div className="mt-3 flex rounded-xl bg-slate-100 p-1">
                    {(["bid", "auto"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${activeTab === tab ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        {tab === "bid" ? "Birbaşa" : "Auto-Bid"}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <AuctionBidderRulesAckLine acknowledged={bidderRulesAck} onChange={setBidderRulesAck} />
                  </div>

                  {activeTab === "bid" ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="label text-xs">Təklifiniz (₼)</label>
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(event) => setBidAmount(event.target.value)}
                          min={minBid}
                          step={lot.minimumIncrementAzn}
                          placeholder={`Min: ${minBid.toLocaleString("az-AZ")} ₼`}
                          className="input-field text-base"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void submitBid()}
                        disabled={!bidAmount || submitting || !bidderRulesAck}
                        className="btn-primary w-full py-3 text-base disabled:opacity-50"
                      >
                        {submitting ? "Göndərilir..." : "Təklif ver"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="label text-xs">Maksimal limit (₼)</label>
                        <input
                          type="number"
                          value={autoBidMax}
                          onChange={(event) => setAutoBidMax(event.target.value)}
                          min={minBid}
                          className="input-field text-base"
                          placeholder={`Min: ${minBid.toLocaleString("az-AZ")} ₼`}
                        />
                      </div>
                      <div className="rounded-xl bg-[#0891B2]/5 p-3 text-xs text-[#0891B2] ring-1 ring-[#0891B2]/15">
                        İlk bid minimum məbləğlə göndərilir, maksimal limit isə serverə saxlanılır.
                      </div>
                      <button
                        type="button"
                        onClick={() => void submitBid()}
                        disabled={!autoBidMax || submitting || !bidderRulesAck}
                        className="btn-primary w-full py-3 text-base disabled:opacity-50"
                      >
                        {submitting ? "Göndərilir..." : "Auto-Bid aktiv et"}
                      </button>
                    </div>
                  )}

                  {message && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
                  {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="font-semibold text-slate-900">Növbəti addım</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Bu lot hazırda bid qəbul etmir. Statusa uyğun növbəti addımı aşağıdan edin.
                  </p>
                  <div className="mt-4 grid gap-2">
                    {(lot.status === "ended_pending_confirmation" ||
                      lot.status === "buyer_confirmed" ||
                      lot.status === "seller_confirmed" ||
                      lot.status === "no_show" ||
                      lot.status === "seller_breach" ||
                      lot.status === "disputed") && (
                      <Link href={`/auction/${lot.id}/confirm`} className="btn-primary justify-center">
                        Nəticəni təsdiqlə
                      </Link>
                    )}
                    <Link href={`/auction/${lot.id}/documents`} className="btn-secondary justify-center">
                      Lot sənədləri
                    </Link>
                    <Link href="/pricing#auction" className="btn-secondary justify-center">
                      Haq strukturu
                    </Link>
                  </div>
                </div>
              )}

              {otherLots.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-slate-700">Digər lot-lar</h4>
                  <div className="space-y-3">
                    {otherLots.map((item) => (
                      <Link
                        key={item.id}
                        href={`/auction/${item.id}`}
                        className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#0891B2] hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs text-slate-400">{getAuctionStatusLabel(item.status)}</div>
                            <div className="mt-1 truncate font-semibold text-slate-900">{item.titleSnapshot}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-400">Cari</div>
                            <div className="font-bold text-[#0891B2]">
                              {(item.currentBidAzn ?? item.startingBidAzn).toLocaleString("az-AZ")} ₼
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
