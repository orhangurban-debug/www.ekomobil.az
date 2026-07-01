import { ClipboardCheck, ShieldCheck, TrendingUp, Gavel, type LucideIcon } from "lucide-react";

interface TrustFeature {
  icon: LucideIcon;
  title: string;
  desc: string;
  tone: "teal" | "sky" | "amber" | "rose";
}

const features: TrustFeature[] = [
  {
    icon: ShieldCheck,
    title: "VIN & Sənəd İstinadları",
    desc: "Satıcılar VIN məlumatı və servis tarixçəsini link və ya sənəd formatında əlavə edir, elanın keyfiyyəti artar.",
    tone: "teal"
  },
  {
    icon: ClipboardCheck,
    title: "Etibar Skoru",
    desc: "Hər elan məlumatlarının dolğunluğuna görə avtomatik etibar skoru alır — alıcı üçün şəffaf meyar.",
    tone: "sky"
  },
  {
    icon: TrendingUp,
    title: "Qiymət Analizi",
    desc: "Bazar məlumatlarına əsasən elanın qiymət mövqeyi göstərilir: bazara uyğun, aşağı və ya yüksək.",
    tone: "amber"
  },
  {
    icon: Gavel,
    title: "Canlı Auksion",
    desc: "Real vaxt sayac, auto-bid sistemi və tam hərrac tarixi ilə şəffaf hərrac platforması.",
    tone: "rose"
  }
];

export function TrustFeaturesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="section-title">Niyə EkoMobil?</h2>
          <p className="section-subtitle mt-1">Hər elan məlumat dolğunluğu və risk siqnalları üzrə qiymətləndirilir</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="feature-card">
                <div className={`icon-tile icon-tile-${feature.tone} mx-auto`}>
                  <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
