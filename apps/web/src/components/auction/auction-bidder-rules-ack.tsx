"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * localStorage cache key — yalnız "bu cihazda qəbul edilib" sürətli yoxlaması üçün.
 * Həqiqi qəbul `auction_terms_acceptances` DB cədvəlindədir.
 */
const STORAGE_KEY = "ekomobil_auction_bidder_ack_v1";

/**
 * Alıcı üçün 5 əsas öhdəlik nöqtəsi.
 * Məbləğlər burada göstərilmir — qorxu (loss aversion) yaratmamaq üçün.
 * Ətraflı şərtlər /rules/auction səhifəsindədir.
 */
const BIDDER_KEY_POINTS = [
  "Qalib olduqda avtomobil ödənişini satıcıya birbaşa ödəyirəm — platforma bu məbləği saxlamır.",
  "Qalib olduqda öhdəlimdən imtina edə bilmərəm — şərtlər hər iki tərəf üçün eyni dərəcədə tətbiq edilir.",
  "Satıcı öhdəliyini pozsa, qalib alıcı olaraq mənə satıcı öhdəlik haqqı üçün checkout yarada bilərəm.",
  "Mübahisə yarandıqda sübutları platforma vasitəsilə təqdim edirəm; EkoMobil müstəqil mediasiya prosesini idarə edir.",
  "Tam şərtlər üçün Auksion çərçivəsi və İstifadəçi şərtlərini oxudum."
];

export function useAuctionBidderRulesAck(): {
  acknowledged: boolean;
  setAcknowledged: (value: boolean) => void;
} {
  const [acknowledged, setAckState] = useState(false);

  useEffect(() => {
    try {
      setAckState(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setAckState(false);
    }
  }, []);

  async function setAcknowledged(value: boolean) {
    // localStorage: sürətli UI yeniləmə üçün
    try {
      if (value) window.localStorage.setItem(STORAGE_KEY, "1");
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setAckState(value);

    // Server-side qəbul: DB-ə yazır, fərqli cihazlarda və API yoxlamalarında işləyir
    if (value) {
      try {
        await fetch("/api/auctions/terms-accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "bidder" })
        });
      } catch {
        // Şəbəkə xətası: localStorage qəbulu aktiv qalır, növbəti bid-də yenidən cəhd edilir
      }
    }
  }

  return { acknowledged, setAcknowledged };
}

export function AuctionBidderRulesAckLine({
  acknowledged,
  onChange
}: {
  acknowledged: boolean;
  onChange: (value: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-700">
      {/* Key points — collapsible */}
      {expanded && (
        <div className="border-b border-slate-100 px-4 pt-4 pb-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Əsas öhdəliklər
          </p>
          <ul className="space-y-1.5">
            {BIDDER_KEY_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2 leading-snug">
                <svg
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0891B2]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-3 text-[11px]">
            <Link href="/rules/auction" className="font-medium text-[#0891B2] hover:underline">
              Auksion qaydaları →
            </Link>
            <Link href="/terms" className="font-medium text-[#0891B2] hover:underline">
              İstifadəçi şərtləri →
            </Link>
          </div>
        </div>
      )}

      {/* Checkbox row */}
      <label className="flex cursor-pointer items-start gap-3 p-4">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#0891B2] focus:ring-[#0891B2]"
        />
        <span className="flex-1 leading-relaxed">
          <strong className="text-slate-900">Qaydaları oxudum və qəbul edirəm</strong>
          {" — "}
          qalib olduqda bütün öhdəliklərimi yerinə yetirəcəyimi təsdiqləyirəm.{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setExpanded((v) => !v);
            }}
            className="font-medium text-[#0891B2] hover:underline"
          >
            {expanded ? "Gizlət" : "Əsas öhdəliklər →"}
          </button>
        </span>
      </label>
    </div>
  );
}

/**
 * Alıcı şərtlərini qəbul etdikdən sonra göstərilən kiçik badge.
 * Hər bid ekranında böyük checkbox yerinə istifadə edilə bilər.
 */
export function AuctionTermsAcceptedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      Şərtlər qəbul edilib
    </span>
  );
}
