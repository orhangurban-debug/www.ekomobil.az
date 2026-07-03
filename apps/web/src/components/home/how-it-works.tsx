import Link from "next/link";
import { Search, ShieldCheck, Handshake } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Search,
    title: "Kəşf et",
    desc: "Filtr, VIN yoxlaması və müqayisə aləti ilə seçim edin."
  },
  {
    step: "02",
    icon: ShieldCheck,
    title: "Yoxla",
    desc: "Etibar xalı, qiymət mövqeyi və yürüş bayraqlarına baxın."
  },
  {
    step: "03",
    icon: Handshake,
    title: "Razılaş",
    desc: "Satıcı ilə birbaşa əlaqə, test sürüşü və ya auksion."
  }
];

export function HowItWorks() {
  return (
    <section className="border-y border-slate-900/8 bg-white/50 py-14 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="section-title">Necə işləyir?</h2>
          <Link href="/trust" className="btn-secondary text-sm">
            Etibar mərkəzi →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="relative rounded-2xl border border-slate-900/8 bg-white/80 p-5 backdrop-blur-xl">
                <span className="text-4xl font-black text-[#0057FF]/10">{item.step}</span>
                <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0057FF]/10 text-[#0057FF]">
                  <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
