import Link from "next/link";
import { ListingCard, ListingCardData } from "@/components/listings/listing-card";
import { getActiveListingCount, listListings } from "@/server/listing-store";

function toCardData(item: { id: string; title: string; priceAzn: number; city: string; year: number; mileageKm: number; fuelType: string; transmission: string; trustScore: number; vinVerified: boolean; sellerVerified: boolean; mediaComplete: boolean; priceInsight?: string; mileageFlagSeverity?: string; planType?: "free" | "standard" | "vip" }): ListingCardData {
  return {
    id: item.id,
    title: item.title,
    priceAzn: item.priceAzn,
    city: item.city,
    year: item.year,
    mileageKm: item.mileageKm,
    fuelType: item.fuelType,
    transmission: item.transmission,
    trustScore: item.trustScore,
    vinVerified: item.vinVerified,
    sellerVerified: item.sellerVerified,
    mediaComplete: item.mediaComplete,
    priceInsight: (item.priceInsight as ListingCardData["priceInsight"]) ?? "market_rate",
    mileageFlagSeverity: item.mileageFlagSeverity as ListingCardData["mileageFlagSeverity"],
    planType: item.planType
  };
}

const trustFeatures = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "VIN Yoxlama",
    desc: "Hər avtomobilin şəxsiyyəti rəsmi mənbələr vasitəsilə təsdiqlənir."
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: "Servis Tarixçəsi",
    desc: "Rəsmi servis mərkəzlərindən texniki qulluq qeydlərinin tam tarixi."
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: "Yürüş Təsdiqi",
    desc: "DYP məlumat bazası ilə elandakı yürüş rəqəminin uyğunluğu yoxlanılır."
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Qiymət Analizi",
    desc: "Bazar məlumatlarına əsaslanaraq elanın real dəyərini müəyyən edirik."
  }
];

export default async function HomePage() {
  const [listingsResult, activeCount] = await Promise.all([
    listListings({ page: 1, pageSize: 6, sort: "recent" }),
    getActiveListingCount()
  ]);
  const recentListings = listingsResult.items;
  const featuredCards = recentListings.map(toCardData);

  const stats = [
    { value: activeCount > 0 ? `${activeCount.toLocaleString()}+` : "12,400+", label: "Aktiv elan" },
    { value: "8,200+", label: "Uğurlu satış" },
    { value: "94%", label: "VIN doğrulama" },
    { value: "4.9/5", label: "İstifadəçi reytinqi" }
  ];

  return (
    <div>
      {/* Hero – 50% white + 30% Ocean Teal balansı */}
      <section className="relative overflow-hidden bg-white pb-24 pt-20 border-b border-[#E5D3B3]">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#0891B2] blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#0891B2]/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0891B2]/40 bg-[#0891B2]/10 px-4 py-1.5 text-sm text-[#0891B2]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0891B2] animate-pulse" />
              Azərbaycanda ilk etibar əsaslı avtomobil platforması
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-[#3E2F28]">Gördüyünü al,</span>
              <br />
              <span className="text-[#0891B2]">bildiyini sür</span>
            </h1>
            <p className="mt-6 text-lg text-[#3E2F28]/80 leading-relaxed">
              VIN yoxlamalı, servis tarixçəli, qiymət analizli — şəffaf avtomobil bazarı.
              Hər elan rəsmi mənbələrlə doğrulanır.
            </p>

            {/* Search bar – /listings-ə yönləndirir */}
            <form action="/listings" method="GET" className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-lg border border-[#E5D3B3]">
                <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  name="q"
                  placeholder="Marka, model axtarın..."
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#0891B2] px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#0e7490]"
              >
                Axtar
              </button>
            </form>

            {/* Quick filters – /listings?make=... */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["Toyota", "Hyundai", "BMW", "Mercedes", "Kia", "Volkswagen"].map((make) => (
                <Link
                  key={make}
                  href={`/listings?make=${encodeURIComponent(make)}`}
                  className="rounded-full border border-[#0891B2]/40 bg-[#0891B2]/10 px-3.5 py-1 text-xs font-medium text-[#0891B2] transition hover:bg-[#0891B2]/20"
                >
                  {make}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats – 50% white */}
      <section className="border-b border-[#E5D3B3] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-y divide-[#E5D3B3] md:grid-cols-4 md:divide-y-0">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 py-8 text-center">
                <div className="text-3xl font-bold text-[#0891B2]">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust features – 50% white ərazisi */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="section-title">Niyə EkoMobil?</h2>
            <p className="section-subtitle">Hər elan şəffaflıq protokolundan keçir</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustFeatures.map((feature) => (
              <div key={feature.title} className="card p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0891B2]/10 text-[#0891B2]">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="section-title">Son elanlar</h2>
              <p className="section-subtitle">Yoxlanılmış, etibarlı avtomobillər</p>
            </div>
            <Link href="/listings" className="btn-secondary text-sm hidden sm:inline-flex">
              Hamısına bax
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCards.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/listings" className="btn-secondary">Hamısına bax</Link>
          </div>
        </div>
      </section>

      {/* CTA – 30% Ocean Teal */}
      <section className="py-20 bg-[#0891B2]">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Avtomobilinizi satmaq istəyirsiniz?</h2>
          <p className="mt-4 text-white/90">
            Etibarlı alıcılara çatın. VIN doğrulamalı elanınızla daha sürətli satın.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/publish" className="bg-white text-[#0891B2] hover:bg-[#E5D3B3] px-8 py-3 rounded-xl font-semibold w-full sm:w-auto transition">
              Pulsuz elan yerləşdir
            </Link>
            <Link href="/listings" className="rounded-xl border-2 border-white bg-transparent px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 w-full sm:w-auto transition">
              Bütün elanlar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
