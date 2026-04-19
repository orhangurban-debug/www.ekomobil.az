import Link from "next/link";
import type { Metadata } from "next";
import { SupportRequestForm } from "@/components/support/support-request-form";
import {
  SERVICE_PROVIDER_TYPE_LABELS,
  demoServiceListings,
  type ServiceProviderType
} from "@/lib/services-marketplace";

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

const providerTypes: ServiceProviderType[] = [
  "inspection_company",
  "official_service",
  "auto_electrician",
  "body_shop",
  "mechanic"
];

function filterHref(input: { type?: ServiceProviderType; city?: string }): string {
  const params = new URLSearchParams();
  if (input.type) params.set("type", input.type);
  if (input.city) params.set("city", input.city);
  const query = params.toString();
  return query ? `/services?${query}` : "/services";
}

export default async function ServicesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const typeParam = typeof params.type === "string" ? params.type : "";
  const cityParam = typeof params.city === "string" ? params.city : "";
  const selectedType = providerTypes.find((item) => item === typeParam);
  const selectedCity = cityParam.trim();
  const cityOptions = Array.from(new Set(demoServiceListings.map((item) => item.city))).sort();
  const filteredListings = demoServiceListings.filter((item) => {
    if (selectedType && item.providerType !== selectedType) return false;
    if (selectedCity && item.city !== selectedCity) return false;
    return true;
  });

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
        təqdim edə bilərlər. Bu bölmə elan kataloqu kimi işləyir: salon və mağazada olduğu kimi servislərdə də profil və
        xidmət elanları yerləşdirilir.
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Servis elanları</h2>
          <Link href="/services?type=inspection_company" className="btn-secondary text-sm">
            Ekspertiza elanlarına bax
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Link href={filterHref({ city: selectedCity || undefined })} className={`rounded-full px-3 py-1.5 text-xs font-medium ${!selectedType ? "bg-[#0891B2]/10 text-[#0891B2]" : "bg-slate-100 text-slate-600"}`}>
            Hamısı
          </Link>
          {providerTypes.map((type) => (
            <Link
              key={type}
              href={filterHref({ type, city: selectedCity || undefined })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                selectedType === type ? "bg-[#0891B2]/10 text-[#0891B2]" : "bg-slate-100 text-slate-600"
              }`}
            >
              {SERVICE_PROVIDER_TYPE_LABELS[type]}
            </Link>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Link href={filterHref({ type: selectedType })} className={`rounded-lg border px-3 py-1.5 text-xs ${!selectedCity ? "border-[#0891B2] text-[#0891B2]" : "border-slate-200 text-slate-600"}`}>
            Bütün şəhərlər
          </Link>
          {cityOptions.map((city) => (
            <Link
              key={city}
              href={filterHref({ type: selectedType, city })}
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                selectedCity === city ? "border-[#0891B2] text-[#0891B2]" : "border-slate-200 text-slate-600"
              }`}
            >
              {city}
            </Link>
          ))}
        </div>

        {filteredListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Seçilən filterlər üzrə servis elanı tapılmadı.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredListings.map((item) => (
              <article key={item.slug} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {SERVICE_PROVIDER_TYPE_LABELS[item.providerType]} • {item.city}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {item.rating.toFixed(1)} ★
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{item.about}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.services.slice(0, 4).map((service) => (
                    <span key={service} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                      {service}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{item.reviewCount} rəy</span>
                  <span>Orta cavab: {item.responseMinutes} dəq</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/services/${item.slug}`} className="btn-secondary text-sm">
                    Profilə bax
                  </Link>
                  <a href={`tel:${item.phone}`} className="btn-secondary text-sm">Zəng et</a>
                  <a href={`https://wa.me/${item.whatsapp.replace("+", "")}`} className="btn-secondary text-sm" target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <SupportRequestForm
          initialRequestType="partnership"
          initialSubject="Servis/Usta tərəfdaşlıq müraciəti"
        />
      </section>
    </div>
  );
}
