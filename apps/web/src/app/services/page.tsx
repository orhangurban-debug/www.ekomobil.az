import Link from "next/link";
import type { Metadata } from "next";
import { SupportRequestForm } from "@/components/support/support-request-form";

export const metadata: Metadata = {
  title: "Servislər və ustalar | EkoMobil",
  description:
    "Ekspertiza, rəsmi servis, dəmirçi, elektrik və digər avtomobil xidmətləri üçün tərəfdaşlıq və xidmət kataloqu."
};

const serviceCategories = [
  {
    title: "Ekspertiza",
    description: "Tam texniki yoxlama, boya ölçümü, diaqnostika və yoxlama hesabatı.",
    ctaHref: "/partners/inspection",
    ctaLabel: "Ekspertiza tərəfdaşı ol"
  },
  {
    title: "Rəsmi servis",
    description: "Brend servis mərkəzləri üçün servis tarixçəsi və rəsmi baxış xidmətləri.",
    ctaHref: "/partners/inspection",
    ctaLabel: "Rəsmi servis kimi qoşul"
  },
  {
    title: "Dəmirçi və kuzov",
    description: "Kuzov təmiri, düzəltmə və struktur işləri üzrə usta profilləri.",
    ctaHref: "/trust#support-request",
    ctaLabel: "Müraciət et"
  },
  {
    title: "Elektrik və elektronika",
    description: "ECU, sensor, elektrik sistemi diaqnostikası və təmiri.",
    ctaHref: "/trust#support-request",
    ctaLabel: "Müraciət et"
  },
  {
    title: "Mühərrik və sürətlər qutusu",
    description: "Mühərrik, transmissiya və əsas aqreqatlar üzrə ixtisaslaşmış xidmətlər.",
    ctaHref: "/trust#support-request",
    ctaLabel: "Müraciət et"
  },
  {
    title: "Ümumi usta xidmətləri",
    description: "Kiçik təmir, periodik baxım və yerində xidmət göstərən ustalar.",
    ctaHref: "/trust#support-request",
    ctaLabel: "Müraciət et"
  }
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Ana səhifə
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Servislər</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900">Servislər, ekspertiza və ustalar</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        EkoMobil-də ekspertiza şirkətləri, rəsmi servis mərkəzləri və fərdi ustalar platformaya qoşularaq xidmətlərini
        təqdim edə bilərlər. Bu bölmə mərhələli olaraq genişləndirilir.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        EkoMobil xidmətləri siyahıya alır və müştəri-satıcı əlaqəsini asanlaşdırır. Platforma konkret təmir və diaqnostika
        nəticəsinə hüquqi zəmanət vermir; xidmət keyfiyyəti xidmət göstərən tərəfin məsuliyyətindədir.
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {serviceCategories.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            <Link href={item.ctaHref} className="btn-secondary mt-4 inline-flex">
              {item.ctaLabel}
            </Link>
          </article>
        ))}
      </div>

      <section className="mt-10">
        <SupportRequestForm
          initialRequestType="partnership"
          initialSubject="Servis/Usta tərəfdaşlıq müraciəti"
        />
      </section>
    </div>
  );
}
