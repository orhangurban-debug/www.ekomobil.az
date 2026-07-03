"use client";

import { useState } from "react";
import {
  Monitor, Smartphone, Maximize2, LayoutDashboard,
  CheckCircle, Clock, X, ChevronRight
} from "lucide-react";
import type { AdSlotItem } from "@/lib/ad-slots-config";
import { computeAdCampaignStatus } from "@/lib/ad-slots-config";
import AdvertiseForm from "./advertise-form";

const SIZE_LABELS: Record<string, { label: string; dims: string; icon: React.ReactNode }> = {
  leaderboard: { label: "Leaderboard", dims: "728 × 90 px", icon: <Monitor className="h-4 w-4" /> },
  wide:        { label: "Wide Banner", dims: "970 × 90 px", icon: <Maximize2 className="h-4 w-4" /> },
  rectangle:   { label: "Medium Rectangle", dims: "300 × 250 px", icon: <LayoutDashboard className="h-4 w-4" /> },
  mobile:      { label: "Mobile Banner", dims: "320 × 50 px",  icon: <Smartphone className="h-4 w-4" /> }
};

const PAGE_LABELS: Record<string, string> = {
  home:     "Ana Səhifə",
  listings: "Elanlar Səhifəsi",
  parts:    "Ehtiyat Hissələri",
  global:   "Bütün Səhifələr"
};

interface SlotCardProps {
  slot: AdSlotItem;
}

export default function SlotCard({ slot }: SlotCardProps) {
  const [open, setOpen] = useState(false);
  const campaignStatus = computeAdCampaignStatus(slot.campaign);
  const isOccupied = campaignStatus.isLive;
  const sizeMeta = SIZE_LABELS[slot.size] ?? { label: slot.size, dims: "", icon: null };

  const endDateLabel = campaignStatus.endDate
    ? new Date(campaignStatus.endDate + "T00:00:00").toLocaleDateString("az-AZ", {
        day: "numeric", month: "long", year: "numeric"
      })
    : null;

  return (
    <>
      <div className="group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {/* Slot visual preview */}
        <div className={`flex items-center justify-center ${slot.size === "rectangle" ? "h-36" : "h-20"} bg-gradient-to-br from-slate-900 to-slate-700 relative`}>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            {sizeMeta.icon}
            <span className="font-mono">{sizeMeta.dims || slot.priceNote}</span>
          </div>
          {/* Status badge */}
          <div className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isOccupied
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
          }`}>
            {isOccupied ? (
              <><Clock className="h-3 w-3" />Məşğul</>
            ) : (
              <><CheckCircle className="h-3 w-3" />Mövcuddur</>
            )}
          </div>
        </div>

        <div className="p-5">
          {/* Label + page */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 leading-tight">{slot.label}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{PAGE_LABELS[slot.page] ?? slot.page}</p>
            </div>
            <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-mono text-slate-600">
              {sizeMeta.dims}
            </span>
          </div>

          {/* Price */}
          <div className="mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">{slot.priceAznPerMonth} ₼</span>
              <span className="text-xs text-slate-500">/ay</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{slot.priceNote}</p>
          </div>

          {/* Occupied info */}
          {isOccupied && endDateLabel && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Cari kampaniya <strong>{endDateLabel}</strong> tarixinə qədər davam edir.<br/>
                Gözləmə siyahısına qoşularaq prioritet bildiriş alın.
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => setOpen(true)}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              isOccupied
                ? "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                : "bg-slate-900 text-white hover:bg-slate-700"
            }`}
          >
            {isOccupied ? "Gözləmə siyahısına qoşul" : "Müraciət et"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                {isOccupied ? "Gözləmə siyahısı" : "Reklam müraciəti"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-5">
              <AdvertiseForm slot={slot} isWaitlist={isOccupied} onClose={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
