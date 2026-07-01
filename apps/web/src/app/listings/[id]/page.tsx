import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AddToCompareButton } from "@/components/compare/add-to-compare-button";
import { BoostListingButton } from "@/components/listings/boost-listing-button";
import { LeadCaptureForm } from "@/components/listings/lead-capture-form";
import { TestDriveButton } from "@/components/listings/test-drive-button";
import { ListingStatsPanel } from "@/components/listings/listing-stats-panel";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ListingFloatingCta } from "@/components/listings/listing-floating-cta";
import { ListingSpecShowcase } from "@/components/listings/listing-spec-showcase";
import { OwnerEditListingButton } from "@/components/listings/owner-edit-listing-button";
import { ReportListingButton } from "@/components/listings/report-listing-button";
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
  listing: { ownerUserId?: string; dealerOwnerUserId?: string },
  userId: string
): Promise<boolean> {
  if (listing.ownerUserId === userId) return true;
  return listing.dealerOwnerUserId === userId;
}

function normalizePhoneForTel(value?: string): string | undefined {
  if (!value) return undefined;
  const cleaned = value.trim().replace(/[^\d+]/g, "");
  return cleaned || undefined;
}

function normalizePhoneForWa(value?: string): string | undefined {
  const tel = normalizePhoneForTel(value);
  if (!tel) return undefined;
  const digits = tel.replace(/[^\d]/g, "");
  return digits || undefined;
}

const getListingDetailCached = cache(async (id: string) => getListingDetail(id));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingDetailCached(id);
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
  const [listing, user, stats] = await Promise.all([
    getListingDetailCached(id),
    getServerSessionUser(),
    getListingStats(id)
  ]);
  if (!listing) notFound();
  const [related] = await Promise.all([
    getRelatedListings(listing.relatedIds),
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
  const telPhone = normalizePhoneForTel(listing.contactPhone);
  const whatsappPhone = normalizePhoneForWa(listing.whatsappPhone ?? listing.contactPhone);

  const showcaseSpecs = isPart
    ? [
        { value: listing.partQuantity !== undefined ? String(listing.partQuantity) : "—", unit: "ƏD", label: "Stok" },
        { value: listing.partCondition === "new" ? "Yeni" : listing.partCondition === "used" ? "İşlənmiş" : "—", unit: "", label: "Vəziyyət" },
        { value: listing.year ? String(listing.year) : "—", unit: "", label: "İl" }
      ]
    : [
        {
          value: listing.mileageKm >= 1000 ? Math.round(listing.mileageKm / 1000).toLocaleString("az-AZ") : String(listing.mileageKm),
          unit: listing.mileageKm >= 1000 ? "KM" : "km",
          label: "Yürüş"
        },
        { value: String(listing.year), unit: "", label: "Buraxılış ili" },
        {
          value: listing.engineVolumeCc ? String(Math.round(listing.engineVolumeCc / 100) / 10) : listing.fuelType.toLowerCase().includes("elektrik") ? listing.fuelType : "—",
          unit: listing.engineVolumeCc ? "L" : "",
          label: listing.engineVolumeCc ? "Mühərrik həcmi" : "Yanacaq növü"
        }
      ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-32 sm:px-6 lg:px-8 lg:pb-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-white/50">
        <Link href="/" className="transition hover:text-white">Ana səhifə</Link>
        <span>/</span>
        <Link href={isPart ? "/parts" : "/listings"} className="transition hover:text-white">{isPart ? "Mağaza elanları" : "Elanlar"}</Link>
        <span>/</span>
        <span className="text-white/90">{listing.title}</span>
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

          <ListingSpecShowcase specs={showcaseSpecs} />

          {/* Description */}
          <div className="card p-6">
            <h2 className="mb-3 font-semibold text-white">Elan haqqında</h2>
            <p className="text-sm leading-relaxed text-white/65">{listing.description}</p>
          </div>

          {listing.serviceRecords.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-white/10 px-6 py-4">
                <h2 className="font-semibold text-white">Servis timeline</h2>
              </div>
              <div className="divide-y divide-white/10">
                {listing.serviceRecords.map((record) => (
                  <div key={record.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/90">{record.summary}</span>
                      <span className="badge-neutral">{record.mileageKm.toLocaleString()} km</span>
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      {new Date(record.serviceDate).toLocaleDateString("az-AZ")} • {record.sourceType}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specs table */}
          <div className="card overflow-hidden">
            <div className="border-b border-white/10 px-6 py-4">
              <h2 className="font-semibold text-white">Texniki göstəricilər</h2>
            </div>
            <div className="divide-y divide-white/10">
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
                  <span className="text-white/50">{label}</span>
                  <span className="font-medium text-white/90 font-mono text-xs sm:text-sm sm:font-sans">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — price & trust */}
        <div className="hidden space-y-4 lg:block">
          {/* Price card */}
          <div className="card p-6">
            <h1 className="text-xl font-bold leading-snug text-white">{listing.title}</h1>
            <p className="mt-3 text-3xl font-bold text-[#0057FF]">
              {listing.priceAzn.toLocaleString("az-AZ")} ₼
            </p>
            {listing.priceInsight && (
              <div className="mt-2">
                <span className={priceInsightMap[listing.priceInsight].cls}>
                  {priceInsightMap[listing.priceInsight].label}
                </span>
              </div>
            )}
            <p className="mt-1 text-sm text-white/50">{listing.city} • {listing.year}</p>

            <div className="mt-5 space-y-2">
              {telPhone ? (
                <a href={`tel:${telPhone}`} className="btn-primary w-full justify-center py-3 flex">
                  Zəng et
                </a>
              ) : (
                <a href="#seller-contact" className="btn-primary w-full justify-center py-3 flex">
                  Satıcı ilə əlaqə
                </a>
              )}
              {whatsappPhone && (
                <a
                  href={`https://wa.me/${whatsappPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full justify-center py-3 flex"
                >
                  WhatsApp ilə yaz
                </a>
              )}
              {!isPart && <TestDriveButton listingId={listing.id} />}
              {!isPart && (
                <div className="pt-1">
                  <AddToCompareButton listingId={listing.id} />
                </div>
              )}
            </div>
          </div>

          {/* Trust card */}
          <div className="card space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">{isPart ? "Məhsul etibar siqnalları" : "Avto-Bioqrafiya"}</h2>
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
                  <span className="text-white/60">{item.label}</span>
                  {item.ok ? (
                    <span className="badge-verified">{item.okText}</span>
                  ) : (
                    <span className="badge-warning">{item.failText}</span>
                  )}
                </div>
              ))}

              {listing.mileageFlagSeverity === "warning" && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                  {listing.mileageFlagMessage || "Yürüşdə kiçik uyğunsuzluq aşkar edilib. Almazdan əvvəl servis tarixçəsini yoxlayın."}
                </div>
              )}
              {listing.mileageFlagSeverity === "high_risk" && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">
                  {listing.mileageFlagMessage || "Yürüşdə yüksək uyğunsuzluq aşkar edilib. Diqqətli olun."}
                </div>
              )}
              {listing.riskSummary && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                  <strong>Risk xülasəsi:</strong> {listing.riskSummary}
                </div>
              )}
              {listing.lastVerifiedAt && (
                <p className="text-xs text-white/35">
                  Son yoxlama: {new Date(listing.lastVerifiedAt).toLocaleString("az-AZ")}
                </p>
              )}
            </div>
          </div>

          <ListingStatsPanel listingId={listing.id} initialStats={stats} />

          {/* VIN check resources */}
          {vinCheck && (
            <div className="card space-y-4 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-white">VIN Tarixçəsini Özünüz Yoxlayın</h3>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  Bu avtomobil <span className="font-medium text-white/75">{vinCheck.regionLabelAz}</span> mənşəlidir.
                  Aşağıdakı rəsmi xarici resurslara daxil olaraq tarixçəni müstəqil yoxlaya bilərsiniz.
                </p>
                <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2">
                  <span className="select-all font-mono text-xs font-bold tracking-widest text-white/80">{vinCheck.vin}</span>
                  <span className="ml-auto text-[10px] text-white/35">VIN nömrəsini kopyalayın →</span>
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
                      className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-[#0057FF] hover:shadow-sm"
                    >
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-white/30 group-hover:text-[#0057FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white/85 group-hover:text-[#0057FF]">{link.nameAz}</span>
                          {link.free ? (
                            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">Pulsuz</span>
                          ) : (
                            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">Ödənişli</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs leading-snug text-white/45">{link.descriptionAz}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>

              {/* Disclaimer */}
              <p className="border-t border-white/10 pt-3 text-[10px] leading-relaxed text-white/35">
                EkoMobil bu xidmətlərlə heç bir şəriklik münasibətinə malik deyil və linklər yalnız məlumat məqsədi ilə verilir.
                Satınalmadan əvvəl müstəqil ekspert yoxlaması tövsiyə olunur.
              </p>
            </div>
          )}

          {/* Safety notice */}
          <div className="rounded-xl border border-[#0057FF]/20 bg-[#0057FF]/10 p-4 text-xs leading-relaxed text-[#93c5fd]">
            <strong>EkoMobil təhlükəsizlik qaydaları:</strong> Heç vaxt ödənişi görmədən etməyin. Fiziki görüşdə avtomobili yoxlayın.
          </div>

          <div className="card sticky bottom-4 p-4 shadow-card">
            <div className="mb-2 text-sm font-semibold text-white">Sürətli əməliyyat</div>
            <div className="grid gap-2">
              {isOwner && (
                <div className="space-y-2">
                  <OwnerEditListingButton
                    listingId={listing.id}
                    title={listing.title}
                    description={listing.description}
                    make={listing.make}
                    model={listing.model}
                    year={listing.year}
                    mileageKm={listing.mileageKm}
                    city={listing.city}
                    priceAzn={listing.priceAzn}
                    vin={listing.vin}
                    fuelType={listing.fuelType}
                    engineType={listing.engineType}
                    transmission={listing.transmission}
                    bodyType={listing.bodyType}
                    driveType={listing.driveType}
                    color={listing.color}
                    condition={listing.condition}
                    engineVolumeCc={listing.engineVolumeCc}
                    interiorMaterial={listing.interiorMaterial}
                    hasSunroof={listing.hasSunroof}
                    creditAvailable={listing.creditAvailable}
                    barterAvailable={listing.barterAvailable}
                    seatHeating={listing.seatHeating}
                    seatCooling={listing.seatCooling}
                    camera360={listing.camera360}
                    parkingSensors={listing.parkingSensors}
                    adaptiveCruise={listing.adaptiveCruise}
                    laneAssist={listing.laneAssist}
                    ownersCount={listing.ownersCount}
                    hasServiceBook={listing.hasServiceBook}
                    hasRepairHistory={listing.hasRepairHistory}
                  />
                  <BoostListingButton
                    listingId={listing.id}
                    currentPlan={listing.planType ?? "free"}
                    listingPriceAzn={listing.priceAzn}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <h2 className="font-semibold text-white">Qərar dəstəyi</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wider text-white/40">Likvidlik</div>
              <div className="mt-2 text-sm font-semibold text-white">
                {listing.trustScore >= 85 ? "Yüksək" : listing.trustScore >= 70 ? "Orta" : "Aşağı"}
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wider text-white/40">Bazara uyğunluq</div>
              <div className="mt-2 text-sm font-semibold text-white">
                {priceInsightMap[listing.priceInsight ?? "market_rate"].label}
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wider text-white/40">Etibar xalı</div>
              <div className="mt-2 text-sm font-semibold text-white">{listing.trustScore}/100</div>
            </div>
          </div>
        </div>

        <div id="seller-contact" className="card scroll-mt-24 p-6">
          <h2 className="font-semibold text-white">Satıcıya sorğu göndər</h2>
          <p className="mt-2 text-sm text-white/50">
            Telefon/WhatsApp vasitəsilə birbaşa əlaqə mümkün olmadıqda bu formdan istifadə edin.
          </p>
          <div className="mt-4">
            <LeadCaptureForm listingId={listing.id} />
          </div>
        </div>

        {!isOwner && (
          <div className="glass-panel p-6">
            <h2 className="font-semibold text-white">Təhlükəsizlik</h2>
            <p className="mt-2 text-sm text-white/60">
              Saxta, aldadıcı və ya qanunsuz elan gördünüzsə, bildirin. Ciddi hallarda məlumatlar qanuni qaydada
              hüquq-mühafizə orqanlarına təqdim oluna bilər.
            </p>
            <div className="mt-4">
              <ReportListingButton
                listingId={listing.id}
                listingTitle={listing.title}
                reportedUserId={listing.ownerUserId ?? listing.dealerOwnerUserId}
              />
            </div>
          </div>
        )}
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
              <ListingCard key={item.id} listing={item} variant="premium" />
            ))}
          </div>
        </section>
      )}

      <ListingFloatingCta
        title={listing.title}
        priceAzn={listing.priceAzn}
        city={listing.city}
        year={listing.year}
        telPhone={telPhone}
        whatsappPhone={whatsappPhone}
        isPart={isPart}
      />
    </div>
  );
}
