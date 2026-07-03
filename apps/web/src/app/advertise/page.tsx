import { Metadata } from "next";
import Link from "next/link";
import {
  Megaphone, TrendingUp, Users, BarChart3,
  Mail, CheckCircle, Info
} from "lucide-react";
import { getAdSlotsConfig } from "@/server/system-settings-store";
import { computeAdCampaignStatus } from "@/lib/ad-slots-config";
import SlotCard from "@/components/ads/slot-card";

export const metadata: Metadata = {
  title: "Reklam ver — EkoMobil.az",
  description:
    "EkoMobil.az-da banner reklam yerləşdirin. Hər ay minlərlə aktiv alıcı və satıcıya çatın. Slot qiymətləri, ölçüləri və müraciət forması."
};

export const dynamic = "force-dynamic";

const PAGE_ORDER: Array<"home" | "listings" | "parts" | "global"> = ["home", "listings", "parts", "global"];
const PAGE_LABELS: Record<string, string> = {
  home: "Ana Səhifə",
  listings: "Elanlar Səhifəsi",
  parts: "Ehtiyat Hissələri",
  global: "Bütün Səhifələr"
};

const PROCESS_STEPS = [
  {
    num: "01",
    title: "Slot seçin",
    desc: "Saytdakı yerləşdirmə mövqeyini, ölçünü və müddəti seçin."
  },
  {
    num: "02",
    title: "Müraciət göndərin",
    desc: "Forma doldurun — 1–2 iş günü ərzində əlaqə saxlayacağıq."
  },
  {
    num: "03",
    title: "Ödəniş edin",
    desc: "Şərtlər razılaşdırıldıqdan sonra ödəniş linki göndərilir."
  },
  {
    num: "04",
    title: "Reklamınız yayımlanır",
    desc: "Ödəniş təsdiqindən sonra admin tərəfindən banner aktivləşdirilir."
  }
];

export default async function AdvertisePage() {
  const config = await getAdSlotsConfig();

  // Group slots by page
  const grouped = new Map<string, typeof config.slots>();
  for (const page of PAGE_ORDER) {
    const slots = config.slots.filter((s) => s.page === page);
    if (slots.length > 0) grouped.set(page, slots);
  }

  // Count available vs occupied
  const totalAvailable = config.slots.filter(
    (s) => !computeAdCampaignStatus(s.campaign).isLive
  ).length;

  return (
    <main className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800/50 px-4 py-1.5 text-xs font-medium text-slate-300 mb-8">
            <Megaphone className="h-3.5 w-3.5" />
            Reklam Xidməti
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Avtomobil auditoriyasına<br />
            <span className="text-sky-400">birbaşa çatın</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            EkoMobil.az-da banner reklam yerləşdirərək hər ay minlərlə aktiv alıcı, satıcı və avtomobil həvəskarına çatın.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <TrendingUp className="h-4 w-4 text-sky-400" />
              Yüksək niyyətli trafik
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="h-4 w-4 text-sky-400" />
              Yerli, hədəfli auditoriya
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <BarChart3 className="h-4 w-4 text-sky-400" />
              Şəffaf hesabat
            </div>
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="border-b border-slate-100 bg-slate-50 py-14 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-xl font-semibold text-slate-900 mb-10">
            Reklam necə işləyir?
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step) => (
              <div key={step.num} className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-sm font-bold">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Availability notice ── */}
      <div className="mx-auto max-w-6xl px-4 pt-10">
        <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
          totalAvailable > 0
            ? "bg-emerald-50 border border-emerald-100"
            : "bg-amber-50 border border-amber-100"
        }`}>
          {totalAvailable > 0 ? (
            <>
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span className="text-emerald-800">
                Hazırda <strong>{totalAvailable} slot</strong> mövcuddur. Müraciət edin, tez cavab veririk.
              </span>
            </>
          ) : (
            <>
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span className="text-amber-800">
                Hazırda bütün slotlar məşğuldur. Gözləmə siyahısına qoşulun — slot boşalanda sizi ilk bildirəcəyik.
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Slot groups ── */}
      <section className="mx-auto max-w-6xl px-4 py-10 space-y-12">
        {Array.from(grouped.entries()).map(([page, slots]) => (
          <div key={page}>
            <h2 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
              <span className="h-px flex-1 bg-slate-100" />
              {PAGE_LABELS[page] ?? page}
              <span className="h-px flex-1 bg-slate-100" />
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {slots.map((slot) => (
                <SlotCard key={slot.id} slot={slot} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── IAB size reference ── */}
      <section className="border-t border-slate-100 bg-slate-50 py-14 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-lg font-semibold text-slate-900 mb-2">Reklam ölçüləri haqqında</h2>
          <p className="text-center text-sm text-slate-500 mb-8 max-w-xl mx-auto">
            Bütün formatlar IAB standartlarına uyğundur. Kreativinizi bu ölçülərdə PNG, JPG və ya GIF formatında hazırlayın.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-6 text-left font-semibold text-slate-700">Format</th>
                  <th className="py-3 pr-6 text-left font-semibold text-slate-700">Ölçü</th>
                  <th className="py-3 pr-6 text-left font-semibold text-slate-700">Ən çəki</th>
                  <th className="py-3 text-left font-semibold text-slate-700">Yerləşdirmə</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["Leaderboard", "728 × 90 px", "≤ 150 KB", "Səhifə üstü / altı"],
                  ["Wide Banner", "970 × 90 px", "≤ 200 KB", "Desktop geniş banner"],
                  ["Medium Rectangle", "300 × 250 px", "≤ 200 KB", "Kənar panel, kart arası"],
                  ["Mobile Banner", "320 × 50 px", "≤ 50 KB", "Mobil görünüş"]
                ].map(([fmt, size, weight, place]) => (
                  <tr key={fmt}>
                    <td className="py-3 pr-6 font-medium text-slate-800">{fmt}</td>
                    <td className="py-3 pr-6 font-mono text-slate-600">{size}</td>
                    <td className="py-3 pr-6 text-slate-500">{weight}</td>
                    <td className="py-3 text-slate-500">{place}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="py-16 px-4 text-center">
        <div className="mx-auto max-w-lg">
          <Mail className="mx-auto mb-4 h-8 w-8 text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Sualınız var?</h2>
          <p className="text-slate-500 text-sm mb-6">
            Xüsusi paket, endirimlər və ya birləşik kampaniyalar üçün bizimlə əlaqə saxlayın.
          </p>
          <a
            href={`mailto:${config.contactEmail}`}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            <Mail className="h-4 w-4" />
            {config.contactEmail}
          </a>
          <p className="mt-6 text-xs text-slate-400">
            <Link href="/pricing" className="underline hover:text-slate-600">Qiymət planlarına</Link>
            {" "}baxın · <Link href="/trust" className="underline hover:text-slate-600">Dəstək</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
