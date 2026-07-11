import Link from "next/link";
import type { Metadata } from "next";
import { InspectionPartnerApplicationForm } from "@/components/partners/inspection-partner-application-form";

export const metadata: Metadata = {
  title: "Servis profili əlavə et | EkoMobil",
  description:
    "Rəsmi servis, ekspertiza şirkəti, mexanik, elektrik, EV mütəxəssisi və bütün avtomobil xidmət təminatçılarının EkoMobil platformasına qeydiyyatı."
};

export default async function InspectionPartnersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const initialType = params.type ?? null;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Ana səhifə</Link>
        <span className="mx-2">/</span>
        <Link href="/services" className="hover:text-slate-900">Servislər</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Profil əlavə et</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900">Servis profili əlavə et</h1>
      <p className="mt-2 text-sm text-slate-600">
        Rəsmi servis, ekspertiza, mexanik, elektrik, EV mütəxəssisi — bütün servis növləri üçün profil yaradın.
      </p>

      <div className="mt-5 grid gap-3 rounded-2xl border border-slate-900/10 bg-white/60 p-5 text-sm text-slate-700 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-slate-900">Nə qazanırsınız?</p>
          <p className="mt-1 text-xs leading-relaxed">
            Filtrlənə bilən kataloqda görünürlük, yeni müştəri axını, profil səhifəsi, birbaşa zəng/WhatsApp düyməsi.
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Kim profil yarada bilər?</p>
          <p className="mt-1 text-xs leading-relaxed">
            Rəsmi servis, ekspertiza şirkəti, mexanik, elektrik, dəmirçi, EV/Hibrid, ECU, ADAS, kondisioner, audio, cam, şin ustası.
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Növbəti addım</p>
          <p className="mt-1 text-xs leading-relaxed">
            Müraciət admin yoxlamasından keçir. Təsdiqdən sonra profil aktiv olur. İlk qeydiyyat üçün 30 günlük pulsuz sınaq tətbiq olunur.{" "}
            <Link href="/pricing#services" className="font-medium text-[#0057FF] hover:underline">
              Qiymət planlarına bax →
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8">
        <InspectionPartnerApplicationForm initialType={initialType} />
      </div>
    </div>
  );
}
