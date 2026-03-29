"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "ekomobil_auction_bidder_ack_v1";

export function useAuctionBidderRulesAck(): { acknowledged: boolean; setAcknowledged: (value: boolean) => void } {
  const [acknowledged, setAckState] = useState(false);

  useEffect(() => {
    try {
      setAckState(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setAckState(false);
    }
  }, []);

  function setAcknowledged(value: boolean) {
    try {
      if (value) window.localStorage.setItem(STORAGE_KEY, "1");
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setAckState(value);
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
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-left text-xs text-slate-700">
      <input
        type="checkbox"
        checked={acknowledged}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#0891B2] focus:ring-[#0891B2]"
      />
      <span>
        <strong className="text-slate-900">Təklif verməzdən əvvəl oxuyuram və qəbul edirəm:</strong> əsas avtomobil
        ödənişi platformada saxlanmır; qalib olduqda öhdəliklər{" "}
        <Link href="/rules/auction" className="font-medium text-[#0891B2] underline-offset-2 hover:underline">
          Auksion çərçivəsi
        </Link>{" "}
        və{" "}
        <Link href="/terms" className="font-medium text-[#0891B2] underline-offset-2 hover:underline">
          istifadəçi şərtləri
        </Link>{" "}
        üzrə tərəflərin öz aralarındadır. EkoMobil bu münasibətə görə məsuliyyət daşımır.
      </span>
    </label>
  );
}
