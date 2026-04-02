import Link from "next/link";
import { ListingCard, ListingCardData } from "@/components/listings/listing-card";
import { AdBanner } from "@/components/ads/ad-banner";
import { getActiveListingCount, listListings } from "@/server/listing-store";

function toCardData(item: {
  id: string; title: string; priceAzn: number; city: string; year: number;
  mileageKm: number; fuelType: string; transmission: string; trustScore: number;
  vinVerified: boolean; sellerVerified: boolean; mediaComplete: boolean;
  priceInsight?: string; mileageFlagSeverity?: string; planType?: "free" | "standard" | "vip"
}): ListingCardData {
  return {
    id: item.id, title: item.title, priceAzn: item.priceAzn, city: item.city,
    year: item.year, mileageKm: item.mileageKm, fuelType: item.fuelType,
    transmission: item.transmission, trustScore: item.trustScore,
    vinVerified: item.vinVerified, sellerVerified: item.sellerVerified,
    mediaComplete: item.mediaComplete,
    priceInsight: (item.priceInsight as ListingCardData["priceInsight"]) ?? "market_rate",
    mileageFlagSeverity: item.mileageFlagSeverity as ListingCardData["mileageFlagSeverity"],
    planType: item.planType
  };
}

const lifestyleCategories = [
  {
    label: "SUV & Krossover",
    sub: "Ailə üçün ideal",
    href: "/listings?bodyType=SUV",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a2 2 0 104 0m4 0a2 2 0 104 0M3 10l2-5h14l2 5M3 10h18M3 10v6a1 1 0 001 1h1m14 0h1a1 1 0 001-1v-6" />
      </svg>
    ),
    accent: "from-sky-500/10 to-blue-500/5"
  },
  {
    label: "Elektrik",
    sub: "Sıfır emissiya",
    href: "/listings?fuelType=Elektrik",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    accent: "from-emerald-500/10 to-green-500/5"
  },
  {
    label: "Sedan",
    sub: "Klassik zövq",
    href: "/listings?bodyType=Sedan",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 17a2 2 0 104 0m6 0a2 2 0 104 0M2 12l3-6h14l3 6M2 12h20M2 12v4a1 1 0 001 1h1m14 0h1a1 1 0 001-1v-4" />
      </svg>
    ),
    accent: "from-violet-500/10 to-purple-500/5"
  },
  {
    label: "10 000 ₼ altı",
    sub: "Sərfəli seçimlər",
    href: "/listings?maxPrice=10000",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    accent: "from-amber-500/10 to-yellow-500/5"
  },
  {
    label: "VIN Doğrulanmış",
    sub: "Şəxsiyyəti təsdiqlənmiş",
    href: "/listings?vinVerified=1",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    accent: "from-teal-500/10 to-cyan-500/5"
  },
  {
    label: "Auksion",
    sub: "Canlı hərrac",
    href: "/auction",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
    accent: "from-rose-500/10 to-red-500/5",
    badge: "Yeni"
  }
];

const trustFeatures = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "VIN & Sənəd İstinadları",
    desc: "Satıcılar VIN məlumatı və servis tarixçəsini link və ya sənəd formatında əlavə edir, elanın keyfiyyəti artar."
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: "Etibar Skoru",
    desc: "Hər elan məlumatlarının dolğunluğuna görə avtomatik etibar skoru alır — alıcı üçün şəffaf meyar."
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: "Qiymət Analizi",
    desc: "Bazar məlumatlarına əsasən elanın qiymət mövqeyi göstərilir: bazara uyğun, aşağı və ya yüksək."
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
    title: "Canlı Auksion",
    desc: "Real vaxt sayac, auto-bid sistemi və tam hərrac tarixi ilə şəffaf hərrac platforması."
  }
];

export default async function HomePage() {
  const [listingsResult, activeCount] = await Promise.all([
    listListings({ page: 1, pageSize: 6, sort: "recent" }),
    getActiveListingCount()
  ]);
  const featuredCards = listingsResult.items.map(toCardData);

  const stats = [
    { value: activeCount > 0 ? `${activeCount.toLocaleString()}+` : "—", label: "Aktiv elan" },
    { value: "Şəffaf", label: "Qiymət analizi" },
    { value: "Satıcı", label: "Məsuliyyəti daşıyır" },
    { value: "Real vaxt", label: "Auksion sistemi" }
  ];

  return (
    <div>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0c1a2e] pb-24 pt-20">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-[#0891B2]/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#0891B2]/10 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0891B2]/30 bg-[#0891B2]/10 px-4 py-1.5 text-sm text-[#67e8f9]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0891B2] animate-pulse" />
              Azərbaycanda ilk etibar əsaslı avtomobil platforması
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              Gördüyünü al,{" "}
              <span className="text-[#22d3ee]">bildiyini sür</span>
            </h1>

            <p className="mt-5 text-base text-white/60 sm:text-lg leading-relaxed">
              Satıcı məlumatları, etibar skoru, qiymət analizi — Azərbaycanın
              ən şəffaf avtomobil platforması.
            </p>

            {/* Search bar */}
            <form action="/listings" method="GET" className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-0 sm:rounded-2xl sm:bg-white sm:shadow-xl sm:ring-1 sm:ring-black/5 sm:p-1.5">
              <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-3 sm:rounded-xl sm:bg-transparent sm:px-3">
                <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  name="q"
                  placeholder="Marka, model, VIN axtarın..."
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#0891B2] px-8 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#0e7490] active:scale-[0.97]"
              >
                Axtar
              </button>
            </form>

          </div>
        </div>
      </section>

      {/* ─── Stats strip ─────────────────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 md:grid-cols-4 md:divide-y-0">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 py-7 text-center">
                <div className="text-2xl font-bold text-[#0891B2] sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs text-slate-500 sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Lifestyle categories ────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="section-title">Nə axtarırsınız?</h2>
              <p className="section-subtitle mt-1">Həyat tərzinizə uyğun kateqoriyanı seçin</p>
            </div>
            <Link href="/listings" className="hidden text-sm font-medium text-[#0891B2] hover:underline sm:block">
              Bütün elanlar →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {lifestyleCategories.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className={`group relative flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br ${cat.accent} border border-slate-200/70 p-5 text-center transition hover:border-[#0891B2]/40 hover:shadow-md hover:-translate-y-0.5`}
              >
                {cat.badge && (
                  <span className="absolute -top-2 -right-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {cat.badge}
                  </span>
                )}
                <span className="text-[#0891B2] transition group-hover:scale-110">{cat.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{cat.label}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{cat.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured listings ───────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="section-title">Son elanlar</h2>
              <p className="section-subtitle mt-1">Yoxlanılmış, etibarlı avtomobillər</p>
            </div>
            <Link href="/listings" className="btn-secondary hidden text-sm sm:inline-flex">
              Hamısına bax
            </Link>
          </div>

          {featuredCards.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCards.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 py-20">
              <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h1l1-4h12l1 4h1a1 1 0 010 2h-.5M3 10a1 1 0 000 2h.5M6 14a2 2 0 104 0m4 0a2 2 0 104 0" />
              </svg>
              <p className="text-sm text-slate-400">Hələ elan yoxdur</p>
              <Link href="/publish" className="btn-primary text-sm">İlk elanı yerlə</Link>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/listings" className="btn-secondary">Hamısına bax</Link>
          </div>
        </div>
      </section>

      {/* ─── Ad banner — listings altı ───────────────────────────────────── */}
      <div className="border-y border-slate-100 bg-slate-50 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AdBanner size="leaderboard" slotLabel="home-after-listings" />
        </div>
      </div>

      {/* ─── Auction teaser ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0c1a2e] py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-rose-600/15 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#0891B2]/15 blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                EkoMobil Auksion
              </span>
              <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                Canlı hərrac ilə{" "}
                <span className="text-[#22d3ee]">ən yaxşı qiyməti</span>{" "}
                tapın
              </h2>
              <p className="mt-4 text-white/60 leading-relaxed">
                Real vaxt sayac, avtomatik təklif (auto-bid) və şəffaf hərrac
                tarixi. Satıcı məlumatlarının dolğunluğu lot keyfiyyətini müəyyən edir.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/auction" className="btn-primary gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Auksiona bax
                </Link>
              </div>
            </div>

            {/* Mock auction card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Növbəti lot</span>
                <span className="flex items-center gap-1.5 rounded-full bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                  Tezliklə
                </span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-white">2021 BMW X5 xDrive30d</h3>
              <p className="mt-1 text-sm text-white/50">VIN daxil edilib • 68,000 km • Bakı</p>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "Başlanğıc qiyməti", value: "45,000 ₼" },
                  { label: "Təkliflər", value: "—" },
                  { label: "Vaxt", value: "Gözlənilir" }
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-white/5 p-3 text-center">
                    <div className="text-xs text-white/40">{item.label}</div>
                    <div className="mt-1 text-sm font-bold text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-[#0891B2]/30 bg-[#0891B2]/10 p-3 text-xs text-[#67e8f9]">
                Auto-bid: Maksimal limitinizi qoyun, sistem avtomatik təklif verir
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why EkoMobil ────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="section-title">Niyə EkoMobil?</h2>
            <p className="section-subtitle mt-1">Hər elan şəffaflıq protokolundan keçir</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="border-t border-slate-100 bg-[#0891B2] py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Avtomobilinizi satmaq istəyirsiniz?</h2>
          <p className="mt-4 text-white/85 leading-relaxed">
            Etibarlı alıcılara çatın. VIN nömrəli elanınız daha sürətli satılır.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/publish"
              className="w-full rounded-xl bg-white px-8 py-3 font-semibold text-[#0891B2] transition hover:bg-[#E5D3B3] sm:w-auto"
            >
              Pulsuz elan yerləşdir
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
