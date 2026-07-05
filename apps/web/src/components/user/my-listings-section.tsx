"use client";

import { useState } from "react";
import Link from "next/link";
import { ListingCard } from "@/components/listings/listing-card";
import { BoostListingButton } from "@/components/listings/boost-listing-button";
import { DraftListingActions } from "@/components/listings/draft-listing-actions";
import { ListingPlanExpiryCounter } from "@/components/listings/listing-plan-expiry-counter";
import { OwnerEditListingButton } from "@/components/listings/owner-edit-listing-button";
import { OwnerEditPartListingButton } from "@/components/listings/owner-edit-part-listing-button";
import type { ListingSummary } from "@/lib/marketplace-types";
import type { PlanType } from "@/lib/listing-plans";

const STATUS_META: Record<string, { label: string; dot: string; cls: string }> = {
  active:         { label: "Aktiv",       dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending_review: { label: "Yoxlamada",  dot: "bg-amber-500",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  draft:          { label: "Qaralama",    dot: "bg-slate-400",   cls: "bg-slate-50 text-slate-600 border-slate-200" },
  sold:           { label: "Satılıb",     dot: "bg-[#0057FF]",   cls: "bg-blue-50 text-[#0057FF] border-blue-200" },
  rejected:       { label: "Rədd edilib", dot: "bg-red-500",     cls: "bg-red-50 text-red-700 border-red-200" },
  archived:       { label: "Arxiv",       dot: "bg-slate-300",   cls: "bg-slate-50 text-slate-500 border-slate-200" },
  inactive:       { label: "Deaktiv",     dot: "bg-slate-300",   cls: "bg-slate-50 text-slate-500 border-slate-200" }
};

type TabKey = "all" | "car" | "part";

interface Props {
  listings: ListingSummary[];
  draftPaymentMap: Record<string, string | undefined>;
  hasStore: boolean;
  hasSalon: boolean;
}

export function MyListingsSection({ listings, draftPaymentMap, hasStore, hasSalon }: Props) {
  const [tab, setTab] = useState<TabKey>("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const [hasNonActive] = useState(() => listings.some((l) => l.status !== "active"));

  const carListings = listings.filter((l) => l.listingKind !== "part");
  const partListings = listings.filter((l) => l.listingKind === "part");

  const shown =
    tab === "car" ? carListings :
    tab === "part" ? partListings :
    listings;

  const tabs = (
    [
      { key: "all"  as TabKey, label: "Hamısı",                                         count: listings.length,    show: true },
      { key: "car"  as TabKey, label: hasSalon ? "Salon elanları" : "Avtomobil",        count: carListings.length, show: carListings.length > 0 || hasSalon },
      { key: "part" as TabKey, label: hasStore ? "Mağaza elanları" : "Hissə elanları",  count: partListings.length,show: partListings.length > 0 || hasStore }
    ] satisfies { key: TabKey; label: string; count: number; show: boolean }[]
  ).filter(t => t.show);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === t.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                tab === t.key ? "bg-[#0057FF]/10 text-[#0057FF]" : "bg-slate-200 text-slate-500"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* View switcher */}
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1">
          <button
            onClick={() => setView("list")}
            className={`rounded-lg p-1.5 transition ${view === "list" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
            title="Siyahı görünüşü"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setView("grid")}
            className={`rounded-lg p-1.5 transition ${view === "grid" ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
            title="Kart görünüşü"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
        </div>

        <Link href="/publish" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
          + Yeni elan
        </Link>
      </div>

      {hasNonActive && (
        <div className="border-b border-amber-100 bg-amber-50 px-5 py-2.5">
          <p className="text-xs text-amber-700">
            Yeni elanlar əvvəlcə yoxlamaya göndərilir. Təsdiqdən sonra ümumi axtarışda görünəcək.
          </p>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-slate-700">Bu kateqoriyada elan yoxdur</p>
            <p className="mt-1 text-sm text-slate-400">İlk elanınızı dəqiqələr ərzində yerləşdirin</p>
          </div>
          <Link href="/publish" className="rounded-xl bg-[#0057FF] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#004ADF]">
            Elan yerlə
          </Link>
        </div>
      ) : view === "grid" ? (
        /* Grid view */
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
          {shown.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      ) : (
        /* List view */
        <div className="divide-y divide-slate-100">
          {shown.map((item) => {
            const sm = STATUS_META[item.status] ?? STATUS_META["inactive"];
            return (
              <div key={item.id} className="group">
                <div className="flex items-start gap-4 px-5 py-4">
                  {/* Thumbnail */}
                  <Link href={`/listings/${item.id}`} className="shrink-0">
                    <div className="relative h-[68px] w-24 overflow-hidden rounded-xl bg-slate-100">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <svg className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/listings/${item.id}`} className="line-clamp-1 font-semibold text-slate-900 transition hover:text-[#0057FF]">
                        {item.title}
                      </Link>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${sm.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`} />
                        {sm.label}
                      </span>
                      {item.listingKind === "part" && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Hissə</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#0057FF]">
                      {item.priceAzn.toLocaleString("az-AZ")} ₼
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        {item.city}{item.year ? ` · ${item.year}` : ""}
                      </span>
                    </p>

                    {item.status === "active" && item.planExpiresAt && (
                      <div className="mt-1.5">
                        <ListingPlanExpiryCounter
                          planExpiresAt={item.planExpiresAt}
                          planType={(item.planType ?? "free") as PlanType}
                          variant="compact"
                        />
                      </div>
                    )}
                    {item.status === "draft" && (
                      <div className="mt-1.5">
                        <DraftListingActions listingId={item.id} pendingPaymentId={draftPaymentMap[item.id]} />
                      </div>
                    )}
                    {item.status === "rejected" && item.rejectionNote && (
                      <div className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <span className="font-semibold">Rədd səbəbi: </span>{item.rejectionNote}
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-1 rounded-full transition-all ${item.trustScore >= 80 ? "bg-emerald-500" : item.trustScore >= 60 ? "bg-amber-500" : "bg-red-400"}`}
                          style={{ width: `${Math.min(item.trustScore, 100)}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-slate-400">{item.trustScore}/100</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <BoostListingButton listingId={item.id} currentPlan={item.planType ?? "free"} listingPriceAzn={item.priceAzn} variant="compact" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-slate-50 bg-slate-50/60 px-5 py-2">
                  <Link href={`/listings/${item.id}`} className="text-xs font-medium text-[#0057FF] transition hover:underline">
                    Elana bax →
                  </Link>
                  <span className="text-slate-200">|</span>
                  {item.listingKind === "part" ? (
                    <OwnerEditPartListingButton
                      variant="inline" listingId={item.id} title={item.title} description={item.description}
                      city={item.city} priceAzn={item.priceAzn} partCategory={item.partCategory}
                      partSubcategory={item.partSubcategory} partBrand={item.partBrand}
                      partCondition={item.partCondition} partAuthenticity={item.partAuthenticity}
                      partOemCode={item.partOemCode} partSku={item.partSku}
                      partQuantity={item.partQuantity} partCompatibility={item.partCompatibility}
                    />
                  ) : (
                    <OwnerEditListingButton
                      variant="inline" listingId={item.id} title={item.title} description={item.description}
                      make={item.make} model={item.model} year={item.year} mileageKm={item.mileageKm}
                      city={item.city} priceAzn={item.priceAzn} vin={item.vin}
                      fuelType={item.fuelType} engineType={item.engineType} transmission={item.transmission}
                      bodyType={item.bodyType} driveType={item.driveType} color={item.color}
                      condition={item.condition} engineVolumeCc={item.engineVolumeCc}
                      interiorMaterial={item.interiorMaterial} hasSunroof={item.hasSunroof}
                      creditAvailable={item.creditAvailable} barterAvailable={item.barterAvailable}
                      seatHeating={item.seatHeating} seatCooling={item.seatCooling}
                      camera360={item.camera360} parkingSensors={item.parkingSensors}
                      adaptiveCruise={item.adaptiveCruise} laneAssist={item.laneAssist}
                      ownersCount={item.ownersCount} hasServiceBook={item.hasServiceBook}
                      hasRepairHistory={item.hasRepairHistory} vinInfoUrl={item.vinInfoUrl}
                      vinDocumentRef={item.vinDocumentRef} serviceHistoryUrl={item.serviceHistoryUrl}
                      serviceHistoryDocumentRef={item.serviceHistoryDocumentRef}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
