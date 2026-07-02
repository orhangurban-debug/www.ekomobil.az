import Link from "next/link";
import { Search, ShieldCheck, Handshake } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Search,
    title: "Kəşf et & müqayisə et",
    desc: "Minlərlə elan arasında filtr, VIN yoxlaması və müqayisə aləti ilə seçim edin."
  },
  {
    step: "02",
    icon: ShieldCheck,
    title: "Etibar siqnallarını yoxla",
    desc: "Etibar xalı, qiymət analizi, yürüş bayraqları və servis tarixçəsi linklərinə baxın."
  },
  {
    step: "03",
    icon: Handshake,
    title: "Əlaqə qur & razılaş",
    desc: "Satıcı ilə birbaşa əlaqə, test sürüşü sorğusu və ya auksionda real vaxtda təklif verin."
  }
];

export function HowItWorks() {
  return (
    <section className="border-y border-slate-900/8 bg-white/50 py-16 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0057FF]">Necə işləyir?</p>
            <h2 className="section-title mt-2">3 addımda etibarlı alqı-satqı</h2>
          </div>
          <Link href="/trust" className="btn-secondary text-sm">
            Etibar mərkəzi →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative rounded-2xl border border-slate-900/8 bg-white/80 p-6 backdrop-blur-xl">
                <span className="text-5xl font-black text-[#0057FF]/10">{item.step}</span>
                <div className="mt-2 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0057FF]/10 text-[#0057FF]">
                  <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
