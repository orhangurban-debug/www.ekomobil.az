import Link from "next/link";
import { Car, Gavel, Search, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { ListingCard, ListingCardData } from "@/components/listings/listing-card";
import { AdBanner } from "@/components/ads/ad-banner";
import { LifestyleCategories } from "@/components/home/lifestyle-categories";
import { TrustFeaturesSection } from "@/components/home/trust-features-section";
import { getActiveListingCount, listListings } from "@/server/listing-store";

function toCardData(item: {
  id: string; title: string; priceAzn: number; city: string; year: number;
  mileageKm: number; fuelType: string; transmission: string; trustScore: number;
  vinVerified: boolean; sellerVerified: boolean; mediaComplete: boolean;
  imageUrl?: string;
  vinProvided?: boolean; creditAvailable?: boolean; barterAvailable?: boolean;
  priceInsight?: string; mileageFlagSeverity?: string; planType?: "free" | "standard" | "vip"
}): ListingCardData {
  return {
    id: item.id, title: item.title, priceAzn: item.priceAzn, city: item.city,
    year: item.year, mileageKm: item.mileageKm, fuelType: item.fuelType,
    transmission: item.transmission, trustScore: item.trustScore,
    vinVerified: item.vinVerified, sellerVerified: item.sellerVerified,
    imageUrl: item.imageUrl,
    vinProvided: item.vinProvided,
    mediaComplete: item.mediaComplete,
    creditAvailable: item.creditAvailable,
    barterAvailable: item.barterAvailable,
    priceInsight: (item.priceInsight as ListingCardData["priceInsight"]) ?? "market_rate",
    mileageFlagSeverity: item.mileageFlagSeverity as ListingCardData["mileageFlagSeverity"],
    planType: item.planType
  };
}

const heroPills = [
  { icon: ShieldCheck, text: "VIN yoxlaması" },
  { icon: Sparkles, text: "Etibar skoru" },
  { icon: TrendingUp, text: "Qiymət analizi" },
  { icon: Gavel, text: "Canlı auksion" }
];

export default async function HomePage() {
  const [listingsResult, activeCount] = await Promise.all([
    listListings({ page: 1, pageSize: 6, sort: "recent" }),
    getActiveListingCount()
  ]);
  const featuredCards = listingsResult.items.map(toCardData);

  const stats = [
    { value: activeCount > 0 ? `${activeCount.toLocaleString()}+` : "Pulsuz", label: "Elan yerləşdir" },
    { value: "97+", label: "Marka kataloqu" },
    { value: "VIN", label: "Avtomobil yoxlaması" },
    { value: "Canlı", label: "Auksion sistemi" }
  ];

  return (
    <div>
      <section className="relative overflow-hidden bg-[#0c1a2e] pb-24 pt-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-brand-500/10 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
              Azərbaycanda ilk etibar əsaslı avtomobil platforması
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              Avtomobil alarkən{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-teal-200 bg-clip-text text-transparent">
                hər şeyi bilin
              </span>
            </h1>

            <p className="mt-5 text-base leading-relaxed text-white/60 sm:text-lg">
              VIN məlumatı, etibar skoru, qiymət analizi — aldığınız avtomobil
              haqqında hər şeyi əvvəlcədən bilin. Azərbaycanın şəffaf avtomobil platforması.
            </p>

            <form action="/listings" method="GET" className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-0 sm:rounded-2xl sm:bg-white sm:p-1.5 sm:shadow-xl sm:ring-1 sm:ring-black/5">
              <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-3 sm:rounded-xl sm:bg-transparent sm:px-3">
                <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                <input
                  type="text"
                  name="q"
                  placeholder="Marka, model, VIN axtarın..."
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>
              <button type="submit" className="btn-primary px-8 py-3">
                Axtar
              </button>
            </form>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {heroPills.map((pill) => {
                const Icon = pill.icon;
                return (
                  <span key={pill.text} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/75 backdrop-blur-sm">
                    <Icon className="h-3.5 w-3.5 text-cyan-300" strokeWidth={2.25} aria-hidden="true" />
                    {pill.text}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 md:grid-cols-4 md:divide-y-0">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 py-7 text-center">
                <div className="text-2xl font-bold text-brand-600 sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs text-slate-500 sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LifestyleCategories />

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="section-title">Son elanlar</h2>
              <p className="section-subtitle mt-1">Məlumatı dolğun elanlar</p>
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
            <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-20 text-center">
              <div className="icon-tile icon-tile-teal h-16 w-16 rounded-2xl">
                <Car className="h-8 w-8" strokeWidth={2} aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-slate-700">Platforma yeni açılır</p>
                <p className="mt-1 text-sm text-slate-400">İlk elanlar tezliklə burada görünəcək</p>
              </div>
              <div className="flex gap-3">
                <Link href="/publish" className="btn-primary text-sm">Elan yerləşdir</Link>
                <Link href="/listings" className="btn-secondary text-sm">Bütün elanlar</Link>
              </div>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/listings" className="btn-secondary">Hamısına bax</Link>
          </div>
        </div>
      </section>

      <div className="border-y border-slate-100 bg-slate-50 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AdBanner size="leaderboard" slotLabel="home-after-listings" />
        </div>
      </div>

      <section className="relative overflow-hidden bg-[#0c1a2e] py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-rose-600/15 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-brand-500/15 blur-[80px]" />
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
                <span className="text-cyan-300">ən yaxşı qiyməti</span> tapın
              </h2>
              <p className="mt-4 leading-relaxed text-white/60">
                Real vaxt sayac, avtomatik təklif (auto-bid) və şəffaf hərrac
                tarixi. Satıcı məlumatlarının dolğunluğu lot keyfiyyətini müəyyən edir.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/auction" className="btn-primary gap-2">
                  <Gavel className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                  Auksiona bax
                </Link>
                <Link href="/auction/sell" className="btn-secondary border-white/20 bg-white/5 text-white hover:bg-white/10">
                  Lot yerləşdir
                </Link>
              </div>
            </div>

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

              <div className="mt-5 rounded-xl border border-brand-400/30 bg-brand-500/10 p-3 text-xs text-cyan-200">
                Auto-bid: Maksimal limitinizi qoyun, sistem avtomatik təklif verir
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustFeaturesSection />

      <section className="border-t border-slate-100 bg-brand-600 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Avtomobilinizi satmaq istəyirsiniz?</h2>
          <p className="mt-4 leading-relaxed text-white/85">
            Etibarlı alıcılara çatın. VIN nömrəli elanınız daha sürətli satılır.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/publish" className="w-full rounded-xl bg-white px-8 py-3 font-semibold text-brand-600 transition hover:bg-slate-100 sm:w-auto">
              Pulsuz elan yerləşdir
            </Link>
            <Link href="/pricing" className="w-full rounded-xl border border-white/30 px-8 py-3 font-semibold text-white transition hover:bg-white/10 sm:w-auto">
              Qiymət planları
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
