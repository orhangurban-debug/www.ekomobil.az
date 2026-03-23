"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const AUCTION_END = new Date(Date.now() + 2 * 60 * 60 * 1000 + 34 * 60 * 1000 + 18 * 1000);

const DEMO_LOTS = [
  {
    id: "lot-1",
    title: "2021 BMW X5 xDrive30d",
    specs: "M Sport • 68,000 km • Bakı",
    currentBid: 72000,
    startingBid: 45000,
    bidsCount: 14,
    endTime: AUCTION_END,
    vinVerified: true,
    trustScore: 92,
    status: "live" as const
  },
  {
    id: "lot-2",
    title: "2022 Mercedes-Benz GLE 300d",
    specs: "AMG Line • 41,200 km • Bakı",
    currentBid: 88500,
    startingBid: 70000,
    bidsCount: 8,
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
    vinVerified: true,
    trustScore: 88,
    status: "live" as const
  },
  {
    id: "lot-3",
    title: "2023 Tesla Model 3",
    specs: "Long Range • 18,000 km • Bakı",
    currentBid: 0,
    startingBid: 55000,
    bidsCount: 0,
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    vinVerified: true,
    trustScore: 95,
    status: "upcoming" as const
  }
];

const DEMO_BID_HISTORY = [
  { user: "E***r", amount: 72000, time: "12:41" },
  { user: "N***d", amount: 71500, time: "12:39" },
  { user: "A***l", amount: 70000, time: "12:35" },
  { user: "S***n", amount: 68500, time: "12:28" },
  { user: "R***v", amount: 67000, time: "12:20" }
];

function useCountdown(endTime: Date) {
  const calc = () => {
    const diff = Math.max(0, endTime.getTime() - Date.now());
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      total: diff
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  });
  return t;
}

function CountdownDisplay({ endTime, compact }: { endTime: Date; compact?: boolean }) {
  const { h, m, s, total } = useCountdown(endTime);
  const urgent = total < 30 * 60 * 1000;

  if (compact) {
    return (
      <span className={`font-mono text-sm font-bold tabular-nums ${urgent ? "text-rose-500" : "text-[#0891B2]"}`}>
        {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${urgent ? "text-rose-500" : "text-white"}`}>
      {[[h, "S"], [m, "D"], [s, "SN"]].map(([val, lbl]) => (
        <div key={String(lbl)} className="flex flex-col items-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl font-mono text-2xl font-bold tabular-nums ${urgent ? "bg-rose-500/20 text-rose-400" : "bg-white/10"}`}>
            {String(val).padStart(2, "0")}
          </div>
          <span className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{lbl}</span>
        </div>
      ))}
    </div>
  );
}

function LotCard({ lot }: { lot: typeof DEMO_LOTS[0] }) {
  const isLive = lot.status === "live";
  return (
    <div className={`group rounded-2xl border bg-white p-5 transition hover:shadow-lg ${isLive ? "border-[#0891B2]/30" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                Canlı
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                Gözlənilir
              </span>
            )}
            {lot.vinVerified && (
              <span className="badge-verified">VIN ✓</span>
            )}
          </div>
          <h3 className="mt-2 font-semibold text-slate-900">{lot.title}</h3>
          <p className="text-xs text-slate-500">{lot.specs}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs text-slate-400">{isLive ? "Cari təklif" : "Başlanğıc"}</div>
          <div className="text-lg font-bold text-[#0891B2]">
            {(isLive ? lot.currentBid : lot.startingBid).toLocaleString("az-AZ")} ₼
          </div>
          <div className="text-xs text-slate-400">{lot.bidsCount} təklif</div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <CountdownDisplay endTime={lot.endTime} compact />
        <Link
          href={`#lot-${lot.id}`}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
            isLive
              ? "bg-[#0891B2] text-white hover:bg-[#0e7490]"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {isLive ? "Təklif ver" : "Xəbərdar ol"}
        </Link>
      </div>
    </div>
  );
}

export default function AuctionPage() {
  const [bidAmount, setBidAmount] = useState("");
  const [autoBidMax, setAutoBidMax] = useState("");
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [bidSubmitted, setBidSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"bid" | "auto">("bid");

  const activeLot = DEMO_LOTS[0];

  function handleBid(e: React.FormEvent) {
    e.preventDefault();
    if (!bidAmount) return;
    setBidSubmitted(true);
    setTimeout(() => setBidSubmitted(false), 3000);
    setBidAmount("");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Hero banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#0c1a2e] px-4 py-12 text-center sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[#0891B2]/15 blur-[100px]" />
        </div>
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
            Canlı Auksion
          </span>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">EkoMobil Auksion</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/50">
            VIN doğrulanmış lot-lar, real vaxt sayac, şəffaf təklif tarixi.
            Qeydiyyatlı istifadəçilər iştirak edir.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/60">
            <span className="flex items-center gap-1.5"><span className="text-white font-semibold">{DEMO_LOTS.filter(l => l.status === "live").length}</span> aktiv lot</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1.5"><span className="text-white font-semibold">22</span> qeydiyyatlı alıcı</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-1.5"><span className="text-white font-semibold">100%</span> VIN yoxlanmış</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* ─── Left: Active lot detail ──────────────────────────────── */}
          <div className="space-y-5 lg:col-span-2" id={`lot-${activeLot.id}`}>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              {/* Image placeholder */}
              <div className="relative flex h-64 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 sm:h-80">
                <svg className="h-20 w-20 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h1l1-4h12l1 4h1a1 1 0 010 2h-.5M3 10a1 1 0 000 2h.5M6 14a2 2 0 104 0m4 0a2 2 0 104 0" />
                </svg>
                {/* Live badge overlay */}
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">CANLI</span>
                </div>
                {/* Trust badge */}
                <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 shadow-lg ring-2 ring-white/30">
                  <span className="text-xs font-bold text-white">{activeLot.trustScore}</span>
                </div>
              </div>

              {/* Lot info */}
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge-verified">VIN Doğrulanmış</span>
                      <span className="badge-verified">Satıcı Doğrulanmış</span>
                    </div>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">{activeLot.title}</h2>
                    <p className="text-sm text-slate-500">{activeLot.specs}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Başlanğıc qiyməti</div>
                    <div className="text-sm text-slate-500">{activeLot.startingBid.toLocaleString("az-AZ")} ₼</div>
                  </div>
                </div>

                {/* Countdown */}
                <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-rose-200/60 bg-rose-50/50 py-5">
                  <div className="text-xs font-semibold uppercase tracking-widest text-rose-500">Bitməyə qalan vaxt</div>
                  <div className="flex items-center gap-2">
                    <CountdownDisplay endTime={activeLot.endTime} />
                  </div>
                </div>

                {/* Current bid */}
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#0891B2]/5 px-5 py-4 ring-1 ring-[#0891B2]/20">
                  <div>
                    <div className="text-xs text-slate-500">Cari ən yüksək təklif</div>
                    <div className="text-3xl font-bold text-[#0891B2]">
                      {activeLot.currentBid.toLocaleString("az-AZ")} ₼
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Cəmi təklif</div>
                    <div className="text-xl font-bold text-slate-900">{activeLot.bidsCount}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Specs card */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="font-semibold text-slate-900">Texniki məlumat</h3>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4">
                {[
                  { label: "İl", value: "2021" },
                  { label: "Yürüş", value: "68,000 km" },
                  { label: "Yanacaq", value: "Dizel" },
                  { label: "Ötürücü", value: "Avtomat" },
                  { label: "Gücü", value: "265 at" },
                  { label: "Rəng", value: "Ağ" },
                  { label: "Ban", value: "SUV" },
                  { label: "Şəhər", value: "Bakı" }
                ].map((item) => (
                  <div key={item.label} className="px-5 py-3">
                    <div className="text-xs text-slate-400">{item.label}</div>
                    <div className="mt-0.5 text-sm font-semibold text-slate-900">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bid history */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h3 className="font-semibold text-slate-900">Təklif tarixi</h3>
                <span className="text-xs text-slate-400">{activeLot.bidsCount} təklif</span>
              </div>
              <div className="divide-y divide-slate-50">
                {DEMO_BID_HISTORY.map((bid, i) => (
                  <div key={i} className={`flex items-center justify-between px-6 py-3 ${i === 0 ? "bg-emerald-50/60" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {i === 0 ? "↑" : String(i + 1)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{bid.user}</div>
                        <div className="text-xs text-slate-400">{bid.time}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${i === 0 ? "text-emerald-600" : "text-slate-600"}`}>
                      {bid.amount.toLocaleString("az-AZ")} ₼
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Right: Bid panel + other lots ───────────────────────── */}
          <div className="space-y-5">
            {/* Bid panel */}
            <div className="sticky top-20 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-900">Təklif ver</h3>

                {/* Tab switch */}
                <div className="mt-3 flex rounded-xl bg-slate-100 p-1">
                  {(["bid", "auto"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                        activeTab === tab ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab === "bid" ? "Birbaşa" : "Auto-Bid"}
                    </button>
                  ))}
                </div>

                {activeTab === "bid" ? (
                  <form onSubmit={handleBid} className="mt-4 space-y-3">
                    <div>
                      <label className="label text-xs">Təklifiniz (₼)</label>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        min={activeLot.currentBid + 500}
                        step={500}
                        placeholder={`Min: ${(activeLot.currentBid + 500).toLocaleString()} ₼`}
                        className="input-field text-base"
                      />
                      <p className="mt-1 text-xs text-slate-400">
                        Minimum artım: 500 ₼
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={!bidAmount}
                      className="btn-primary w-full py-3 text-base disabled:opacity-50"
                    >
                      {bidSubmitted ? "✓ Göndərildi" : "Təklif ver"}
                    </button>
                  </form>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="label text-xs">Maksimal limiti (₼)</label>
                      <input
                        type="number"
                        value={autoBidMax}
                        onChange={(e) => setAutoBidMax(e.target.value)}
                        placeholder="Məs: 80,000 ₼"
                        className="input-field text-base"
                      />
                    </div>
                    <div className="rounded-xl bg-[#0891B2]/5 p-3 text-xs text-[#0891B2] ring-1 ring-[#0891B2]/15">
                      Sistem sizin adınızdan avtomatik minimum artım ilə təklif verir. Limiti keçdikdə dayandırılır.
                    </div>
                    <button
                      onClick={() => setAutoBidEnabled(!autoBidEnabled)}
                      disabled={!autoBidMax}
                      className={`btn-primary w-full py-3 text-base disabled:opacity-50 ${autoBidEnabled ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                    >
                      {autoBidEnabled ? "✓ Auto-Bid Aktivdir" : "Auto-Bid Aktiv et"}
                    </button>
                  </div>
                )}

                <p className="mt-3 text-center text-[11px] text-slate-400">
                  Qeydiyyat tələb olunur ·{" "}
                  <Link href="/register" className="text-[#0891B2] hover:underline">Qeydiyyat</Link>
                </p>
              </div>

              {/* Trust panel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h4 className="mb-3 text-sm font-semibold text-slate-900">EkoMobil Zəmanəti</h4>
                <div className="space-y-2.5 text-xs text-slate-600">
                  {[
                    "Hər lot VIN yoxlamasından keçir",
                    "Satıcı şəxsiyyəti doğrulanır",
                    "Yürüş DYP bazası ilə yoxlanır",
                    "Uduzan alıcıya tam geri ödəmə"
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Other lots */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-700">Digər lot-lar</h4>
                <div className="space-y-3">
                  {DEMO_LOTS.slice(1).map((lot) => (
                    <LotCard key={lot.id} lot={lot} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-2xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-6 text-center">
          <h3 className="font-semibold text-slate-900">Avtomobilinizi hərracda satmaq istəyirsiniz?</h3>
          <p className="mt-1 text-sm text-slate-500">VIN doğrulamasını keçmiş istənilən avtomobili lot kimi yerləşdirin.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/publish" className="btn-primary">Lot qeydiyyatı</Link>
            <Link href="/listings" className="btn-secondary">Marketplace-ə bax</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
