import Link from "next/link";
import type { Metadata } from "next";
import { InspectionPartnerApplicationForm } from "@/components/partners/inspection-partner-application-form";

export const metadata: Metadata = {
  title: "Servis profili əlavə et | EkoMobil",
  description:
    "Rəsmi servis, ekspertiza şirkəti, mexanik, elektrik, EV mütəxəssisi və bütün avtomobil xidmət təminatçılarının EkoMobil platformasına qeydiyyatı."
};

export default function InspectionPartnersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-white/50">
        <Link href="/" className="hover:text-white">Ana səhifə</Link>
        <span className="mx-2">/</span>
        <Link href="/services" className="hover:text-white">Servislər</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Profil əlavə et</span>
      </nav>

      <h1 className="text-3xl font-bold text-white">Servis profili əlavə et</h1>
      <p className="mt-2 text-sm text-white/65">
        Rəsmi servis, ekspertiza, mexanik, elektrik, EV mütəxəssisi — bütün servis növləri üçün tərəfdaşlıq müraciəti.
      </p>

      <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-white">Nə qazanırsınız?</p>
          <p className="mt-1 text-xs leading-relaxed">
            Filtrlənə bilən kataloqda görünürlük, yeni müştəri axını, profil səhifəsi, birbaşa zəng/WhatsApp düyməsi.
          </p>
        </div>
        <div>
          <p className="font-semibold text-white">Kim müraciət edə bilər?</p>
          <p className="mt-1 text-xs leading-relaxed">
            Rəsmi servis, ekspertiza şirkəti, mexanik, elektrik, dəmirçi, EV/Hibrid, ECU, ADAS, kondisioner, audio, cam, şin ustası.
          </p>
        </div>
        <div>
          <p className="font-semibold text-white">Növbəti addım</p>
          <p className="mt-1 text-xs leading-relaxed">
            Müraciət 1-3 iş günü ərzində nəzərdən keçirilir. İlk qeydiyyat üçün 30 günlük pulsuz aktivləşdirmə də tətbiq oluna bilər.{" "}
            <Link href="/pricing#services" className="font-medium text-[#0891B2] hover:underline">
              Qiymət planlarına bax →
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8">
        <InspectionPartnerApplicationForm />
      </div>
    </div>
  );
}
