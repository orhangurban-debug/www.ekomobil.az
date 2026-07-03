"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import AdvertiseForm from "./advertise-form";
import type { AdSlotItem } from "@/lib/ad-slots-config";

const GENERAL_SLOT: AdSlotItem = {
  id: "general-inquiry",
  label: "Ümumi sual / xüsusi paket",
  page: "global",
  size: "leaderboard",
  enabled: true,
  mode: "placeholder",
  placeholderText: "",
  priceAznPerMonth: 0,
  priceNote: "Xüsusi paket, endirim və ya birləşik kampaniya"
};

export default function GeneralInquiryButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
      >
        <MessageSquare className="h-4 w-4" />
        Müraciət göndər
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Ümumi sorğu</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-5">
              <AdvertiseForm slot={GENERAL_SLOT} isWaitlist={false} onClose={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
