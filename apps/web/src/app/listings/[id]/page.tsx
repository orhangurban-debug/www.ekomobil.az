import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCompareButton } from "@/components/compare/add-to-compare-button";
import { BoostListingButton } from "@/components/listings/boost-listing-button";
import { LeadCaptureForm } from "@/components/listings/lead-capture-form";
import { TestDriveButton } from "@/components/listings/test-drive-button";
import { ListingStatsPanel } from "@/components/listings/listing-stats-panel";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { AdminListingActions } from "@/components/admin/admin-listing-actions";
import { getServerSessionUser } from "@/lib/auth";
import { getListingDetail, getRelatedListings } from "@/server/listing-store";
import { getListingStats } from "@/server/listing-stats-store";
import { getVinCheckLinks, isVinFormatValid } from "@/lib/vin-check";

const priceInsightMap = {
  below_market: { label: "Bazar qiymətindən aşağı", cls: "badge-verified" },
  market_rate: { label: "Bazar qiymətinə uyğun", cls: "badge-neutral" },
  above_market: { label: "Bazar qiymətindən yüksək", cls: "badge-warning" }
};

async function isListingOwner(
  listing: { ownerUserId?: string; dealerProfileId?: string },
  userId: string
): Promise<boolean> {
  if (listing.ownerUserId === userId) return true;
  if (listing.dealerProfileId) {
    const { getPgPool } = await import("@/lib/postgres");
    const r = await getPgPool().query<{ owner_user_id: string }>(
      `SELECT owner_user_id FROM dealer_profiles WHERE id = $1`,
      [listing.dealerProfileId]
    );
    return r.rows[0]?.owner_user_id === userId;
  }
  return false;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingDetail(id);
  if (!listing) {
    return {
      title: "Elan tapılmadı",
      robots: { index: false, follow: false }
    };
  }
  const title = `${listing.title} — ${listing.priceAzn.toLocaleString("az-AZ")} ₼`;
  const description = `${listing.year} il, ${listing.city}, ${listing.mileageKm.toLocaleString("az-AZ")} km. EkoMobil-də elan detalı və satıcı əlaqə məlumatları.`;
  const canonicalPath = `/listings/${listing.id}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalPath
    },
    twitter: {
      card: "summary",
      title,
      description
    }
  };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [listing, user] = await Promise.all([
    getListingDetail(id),
    getServerSessionUser()
  ]);
  if (!listing) notFound();
  const [related, stats] = await Promise.all([
    getRelatedListings(listing.relatedIds),
    getListingStats(listing.id)
  ]);
  const isOwner = user ? await isListingOwner(listing, user.id) : false;
  const isPart = listing.listingKind === "part";

  const scoreColor =
    listing.trustScore >= 80 ? "#16a34a" :
    listing.trustScore >= 60 ? "#d97706" : "#dc2626";

  const vinCheck =
    listing.vin && listing.vin !== "PARTS-NOVIN" && isVinFormatValid(listing.vin)
      ? getVinCheckLinks(listing.vin)
      : null;
  const hasVinEntered = Boolean(listing.vin && listing.vin !== "PARTS-NOVIN");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900 transition">Ana səhifə</Link>
        <span>/</span>
        <Link href={isPart ? "/parts" : "/listings"} className="hover:text-slate-900 transition">{isPart ? "Mağaza elanları" : "Elanlar"}</Link>
        <span>/</span>
        <span className="text-slate-900">{listing.title}</span>
      </nav>

      {/* Admin moderation bar */}
      {user && ["admin", "support"].includes(user.role) && (
        <AdminListingActions
          listingId={listing.id}
          currentStatus={listing.status}
          listingTitle={listing.title}
        />
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left — images */}
        <div className="lg:col-span-2 space-y-4">
          <ListingGallery urls={listing.mediaUrls} title={listing.title} />

          {/* Description */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-3">Elan haqqında</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{listing.description}</p>
          </div>

          {listing.serviceRecords.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Servis timeline</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {listing.serviceRecords.map((record) => (
                  <div key={record.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">{record.summary}</span>
                      <span className="badge-neutral">{record.mileageKm.toLocaleString()} km</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(record.serviceDate).toLocaleDateString("az-AZ")} • {record.sourceType}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specs table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Texniki göstəricilər</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                ...(isPart
                  ? [
                      ["Kateqoriya", listing.partCategory || "—"],
                      ["Alt kateqoriya", listing.partSubcategory || "—"],
                      ["Brend", listing.partBrand || "—"],
                      [
                        "Vəziyyət",
                        listing.partCondition === "new"
                          ? "Yeni"
                          : listing.partCondition === "used"
                            ? "İşlənmiş"
                            : listing.partCondition === "refurbished"
                              ? "Bərpa olunmuş"
                              : "—"
                      ],
                      [
                        "Orijinallıq",
                        listing.partAuthenticity === "original"
                          ? "Orijinal (OE)"
                          : listing.partAuthenticity === "oem"
                            ? "OEM/Firma"
                            : listing.partAuthenticity === "aftermarket"
                              ? "Aftermarket"
                              : "—"
                      ],
                      ["OEM kodu", listing.partOemCode || "—"],
                      ["SKU", listing.partSku || "—"],
                      ["Stok", listing.partQuantity !== undefined ? String(listing.partQuantity) : "—"],
                      ["Uyğunluq", listing.partCompatibility || "—"],
                      ["Şəhər", listing.city]
                    ]
                  : [
                      ["Buraxılış ili", listing.year],
                      ["Yürüş", `${listing.mileageKm.toLocaleString()} km`],
                      ["Yanacaq növü", listing.fuelType],
                      ["Mühərrik növü", listing.engineType || "—"],
                      ["Ötürücü qutsu", listing.transmission],
                      ["Mühərrik həcmi", listing.engineVolumeCc ? `${listing.engineVolumeCc} cc` : "—"],
                      ["Salon materialı", listing.interiorMaterial || "—"],
                      ["Lyuk", listing.hasSunroof ? "Var" : "Yox"],
                      ["Kredit", listing.creditAvailable ? "Mümkündür" : "Yox"],
                      ["Barter", listing.barterAvailable ? "Mümkündür" : "Yox"],
                      ["Oturacaq isidilməsi", listing.seatHeating ? "Var" : "Yox"],
                      ["Oturacaq soyudulması", listing.seatCooling ? "Var" : "Yox"],
                      ["360 kamera", listing.camera360 ? "Var" : "Yox"],
                      ["Park sensoru", listing.parkingSensors ? "Var" : "Yox"],
                      ["Adaptive cruise", listing.adaptiveCruise ? "Var" : "Yox"],
                      ["Lane assist", listing.laneAssist ? "Var" : "Yox"],
                      ["Sahib sayı", listing.ownersCount ? String(listing.ownersCount) : "—"],
                      ["Servis kitabçası", listing.hasServiceBook ? "Var" : "Yox"],
                      ["Təmir tarixçəsi", listing.hasRepairHistory ? "Var" : "Yox"],
                      ["Şəhər", listing.city],
                      ...(listing.vin ? [["VIN kodu", listing.vin] as [string, string]] : [])
                    ])
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between px-6 py-3 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-900 font-mono text-xs sm:text-sm sm:font-sans">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — price & trust */}
        <div className="space-y-4">
          {/* Price card */}
          <div className="card p-6">
            <h1 className="text-xl font-bold text-slate-900 leading-snug">{listing.title}</h1>
            <p className="mt-3 text-3xl font-bold text-brand-700">
              {listing.priceAzn.toLocaleString("az-AZ")} ₼
            </p>
            {listing.priceInsight && (
              <div className="mt-2">
                <span className={priceInsightMap[listing.priceInsight].cls}>
                  {priceInsightMap[listing.priceInsight].label}
                </span>
              </div>
            )}
            <p className="mt-1 text-sm text-slate-500">{listing.city} • {listing.year}</p>

            <div className="mt-5 space-y-2">
              <a href="#seller-contact" className="btn-primary w-full justify-center py-3 flex">
                Satıcı ilə əlaqə
              </a>
              {!isPart && <TestDriveButton listingId={listing.id} />}
              {!isPart && (
                <div className="pt-1">
                  <AddToCompareButton listingId={listing.id} />
                </div>
              )}
            </div>
          </div>

          {/* Trust card */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">{isPart ? "Məhsul etibar siqnalları" : "Avto-Bioqrafiya"}</h2>
              <div
                className="flex h-12 w-12 flex-col items-center justify-center rounded-full text-white font-bold text-sm shadow"
                style={{ background: scoreColor }}
              >
                {listing.trustScore}
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: "VIN Nömrəsi",
                  ok: hasVinEntered,
                  okText: "Daxil edilib",
                  failText: "Daxil edilməyib"
                },
                {
                  label: "Satıcı Doğrulaması",
                  ok: listing.sellerVerified,
                  okText: "Doğrulandı",
                  failText: "Doğrulanmayıb"
                },
                {
                  label: "Media Protokolu",
                  ok: listing.mediaComplete,
                  okText: "Tam",
                  failText: "Çatışmır"
                },
                {
                  label: "Servis Tarixçəsi",
                  ok: Boolean(listing.serviceHistorySummary),
                  okText: listing.serviceHistorySummary || "Mövcuddur",
                  failText: "Gözləyir"
                }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.label}</span>
                  {item.ok ? (
                    <span className="badge-verified">{item.okText}</span>
                  ) : (
                    <span className="badge-warning">{item.failText}</span>
                  )}
                </div>
              ))}

              {listing.mileageFlagSeverity === "warning" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  {listing.mileageFlagMessage || "Yürüşdə kiçik uyğunsuzluq aşkar edilib. Almazdan əvvəl servis tarixçəsini yoxlayın."}
                </div>
              )}
              {listing.mileageFlagSeverity === "high_risk" && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {listing.mileageFlagMessage || "Yürüşdə yüksək uyğunsuzluq aşkar edilib. Diqqətli olun."}
                </div>
              )}
              {listing.riskSummary && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <strong>Risk xülasəsi:</strong> {listing.riskSummary}
                </div>
              )}
              {listing.lastVerifiedAt && (
                <p className="text-xs text-slate-400">
                  Son yoxlama: {new Date(listing.lastVerifiedAt).toLocaleString("az-AZ")}
                </p>
              )}
            </div>
          </div>

          <ListingStatsPanel listingId={listing.id} initialStats={stats} />

          {/* VIN check resources */}
          {vinCheck && (
            <div className="card p-5 space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-slate-900">VIN Tarixçəsini Özünüz Yoxlayın</h3>
                </div>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Bu avtomobil <span className="font-medium text-slate-700">{vinCheck.regionLabelAz}</span> mənşəlidir.
                  Aşağıdakı rəsmi xarici resurslara daxil olaraq tarixçəni müstəqil yoxlaya bilərsiniz.
                </p>
                <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2">
                  <span className="font-mono text-xs font-bold tracking-widest text-slate-700 select-all">{vinCheck.vin}</span>
                  <span className="ml-auto text-[10px] text-slate-400">VIN nömrəsini kopyalayın →</span>
                </div>
              </div>

              {/* Links */}
              <ul className="space-y-2">
                {vinCheck.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 transition hover:border-[#0891B2] hover:shadow-sm"
                    >
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 group-hover:text-[#0891B2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 group-hover:text-[#0891B2]">{link.nameAz}</span>
                          {link.free ? (
                            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Pulsuz</span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">Ödənişli</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 leading-snug">{link.descriptionAz}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>

              {/* Disclaimer */}
              <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
                EkoMobil bu xidmətlərlə heç bir şəriklik münasibətinə malik deyil və linklər yalnız məlumat məqsədi ilə verilir.
                Satınalmadan əvvəl müstəqil ekspert yoxlaması tövsiyə olunur.
              </p>
            </div>
          )}

          {/* Safety notice */}
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-xs text-brand-800 leading-relaxed">
            <strong>EkoMobil təhlükəsizlik qaydaları:</strong> Heç vaxt ödənişi görmədən etməyin. Fiziki görüşdə avtomobili yoxlayın.
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sticky bottom-4 shadow-card">
            <div className="mb-2 text-sm font-semibold text-slate-900">Sürətli əməliyyat</div>
            <div className="grid gap-2">
              {isOwner && (
                <BoostListingButton
                  listingId={listing.id}
                  currentPlan={listing.planType ?? "free"}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900">Qərar dəstəyi</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wider text-slate-400">Likvidlik</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {listing.trustScore >= 85 ? "Yüksək" : listing.trustScore >= 70 ? "Orta" : "Aşağı"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wider text-slate-400">Bazara uyğunluq</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{listing.priceInsight || "market_rate"}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wider text-slate-400">Etibar xalı</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{listing.trustScore}/100</div>
            </div>
          </div>
        </div>

        <div id="seller-contact" className="card p-6 scroll-mt-24">
          <h2 className="font-semibold text-slate-900">Satıcıya sorğu göndər</h2>
          <p className="mt-2 text-sm text-slate-500">Dealer/satıcı panelinə dərhal lead düşəcək.</p>
          <div className="mt-4">
            <LeadCaptureForm listingId={listing.id} />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="section-title">Bənzər elanlar</h2>
              <p className="section-subtitle">Bu modelə və şəhərə uyğun alternativlər</p>
            </div>
            <Link href={isPart ? "/parts" : "/listings"} className="btn-secondary text-sm">Hamısına bax</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
