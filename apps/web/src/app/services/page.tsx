import Link from "next/link";
import type { Metadata } from "next";
import {
  SERVICE_PROVIDER_TYPE_LABELS,
  SERVICE_PROVIDER_GROUPS,
  demoServiceListings,
  type ServiceProviderType
} from "@/lib/services-marketplace";

export const metadata: Metadata = {
  title: "Servislər və ustalar | EkoMobil",
  description:
    "Ekspertiza, rəsmi servis, dəmirçi, elektrik və digər avtomobil xidmətləri. EkoMobil-də servis provayderləri və ustalar."
};

function filterHref(input: { type?: ServiceProviderType; city?: string; q?: string }): string {
  const params = new URLSearchParams();
  if (input.type) params.set("type", input.type);
  if (input.city) params.set("city", input.city);
  if (input.q) params.set("q", input.q);
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
  const qParam = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const allTypes = SERVICE_PROVIDER_GROUPS.flatMap((g) => g.types);
  const selectedType = allTypes.find((item) => item === typeParam);
  const selectedCity = cityParam.trim();
  const cityOptions = Array.from(new Set(demoServiceListings.map((item) => item.city))).sort();

  const filteredListings = demoServiceListings.filter((item) => {
    if (selectedType && item.providerType !== selectedType) return false;
    if (selectedCity && item.city !== selectedCity) return false;
    if (qParam && !item.name.toLowerCase().includes(qParam) && !item.about.toLowerCase().includes(qParam)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Ana səhifə</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Servislər</span>
      </nav>

      {/* Hero */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Servislər və ustalar</h1>
            <p className="mt-1 text-sm text-slate-500">
              {filteredListings.length} servis provayderı tapıldı
            </p>
          </div>
          <Link href="/partners/inspection" className="btn-primary text-sm">
            + Servis profili əlavə et
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar filterlər */}
        <aside className="w-full shrink-0 lg:w-60">
          <div className="sticky top-24 space-y-5 rounded-2xl border border-slate-200 bg-white p-4">
            {/* Axtarış */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Axtarış
              </label>
              <form method="get" action="/services">
                {selectedType && <input type="hidden" name="type" value={selectedType} />}
                {selectedCity && <input type="hidden" name="city" value={selectedCity} />}
                <input
                  type="search"
                  name="q"
                  defaultValue={qParam}
                  placeholder="Ad, xidmət..."
                  className="input-field text-sm"
                />
              </form>
            </div>

            {/* Xidmət növü — qruplu */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Xidmət növü
              </p>
              <div className="space-y-0.5">
                <Link
                  href={filterHref({ city: selectedCity || undefined, q: qParam || undefined })}
                  className={`block rounded-lg px-3 py-2 text-sm transition ${
                    !selectedType
                      ? "bg-[#0891B2]/10 font-medium text-[#0891B2]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Hamısı
                </Link>
                {SERVICE_PROVIDER_GROUPS.map((group) => (
                  <div key={group.id}>
                    <p className="mt-3 mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {group.label}
                    </p>
                    {group.types.map((type) => (
                      <Link
                        key={type}
                        href={filterHref({ type, city: selectedCity || undefined, q: qParam || undefined })}
                        className={`block rounded-lg px-3 py-1.5 text-sm transition ${
                          selectedType === type
                            ? "bg-[#0891B2]/10 font-medium text-[#0891B2]"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {SERVICE_PROVIDER_TYPE_LABELS[type]}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Şəhər */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Şəhər</p>
              <div className="space-y-1">
                <Link
                  href={filterHref({ type: selectedType, q: qParam || undefined })}
                  className={`block rounded-lg px-3 py-2 text-sm transition ${
                    !selectedCity
                      ? "bg-[#0891B2]/10 font-medium text-[#0891B2]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Bütün şəhərlər
                </Link>
                {cityOptions.map((city) => (
                  <Link
                    key={city}
                    href={filterHref({ type: selectedType, city, q: qParam || undefined })}
                    className={`block rounded-lg px-3 py-2 text-sm transition ${
                      selectedCity === city
                        ? "bg-[#0891B2]/10 font-medium text-[#0891B2]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 leading-relaxed">
              Platforma xidmət keyfiyyətinə zəmanət vermir. Keyfiyyət xidmət göstərənin məsuliyyətindədir.
            </div>
          </div>
        </aside>

        {/* Elanlar */}
        <div className="flex-1">
          {/* Aktiv filterlər */}
          {(selectedType ?? selectedCity ?? qParam) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedType && (
                <Link
                  href={filterHref({ city: selectedCity || undefined, q: qParam || undefined })}
                  className="inline-flex items-center gap-1 rounded-full bg-[#0891B2]/10 px-3 py-1 text-xs font-medium text-[#0891B2]"
                >
                  {SERVICE_PROVIDER_TYPE_LABELS[selectedType]} ×
                </Link>
              )}
              {selectedCity && (
                <Link
                  href={filterHref({ type: selectedType, q: qParam || undefined })}
                  className="inline-flex items-center gap-1 rounded-full bg-[#0891B2]/10 px-3 py-1 text-xs font-medium text-[#0891B2]"
                >
                  {selectedCity} ×
                </Link>
              )}
              {qParam && (
                <Link
                  href={filterHref({ type: selectedType, city: selectedCity || undefined })}
                  className="inline-flex items-center gap-1 rounded-full bg-[#0891B2]/10 px-3 py-1 text-xs font-medium text-[#0891B2]"
                >
                  &quot;{qParam}&quot; ×
                </Link>
              )}
            </div>
          )}

          {filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
              <p className="font-medium text-slate-700">Servis elanı tapılmadı</p>
              <p className="text-sm text-slate-400">Filterləri dəyişin və ya axtarışı genişləndirin.</p>
              <Link href="/services" className="btn-secondary text-sm">Bütün servisləre bax</Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredListings.map((item) => (
                <article
                  key={item.slug}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#0891B2]/30 hover:shadow-md"
                >
                  {/* Başlıq */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/services/${item.slug}`} className="text-base font-semibold text-slate-900 hover:text-[#0891B2]">
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {SERVICE_PROVIDER_TYPE_LABELS[item.providerType]} • {item.city}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {item.rating.toFixed(1)} ★
                    </span>
                  </div>

                  {/* Açıqlama */}
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{item.about}</p>

                  {/* Xidmət etiketleri */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.services.slice(0, 3).map((service) => (
                      <span key={service} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                        {service}
                      </span>
                    ))}
                    {item.services.length > 3 && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-400">
                        +{item.services.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Göstəricilər */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                    <span>{item.reviewCount} rəy</span>
                    <span>Cavab: ~{item.responseMinutes} dəq</span>
                  </div>

                  {/* Düymələr */}
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <Link href={`/services/${item.slug}`} className="btn-primary text-sm flex-1 justify-center text-center">
                      Profili gör
                    </Link>
                    <a href={`tel:${item.phone}`} className="btn-secondary text-sm px-3">Zəng</a>
                    <a
                      href={`https://wa.me/${item.whatsapp.replace("+", "")}`}
                      className="btn-secondary text-sm px-3"
                      target="_blank"
                      rel="noreferrer"
                    >
                      WA
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Servis provayderi CTA */}
          <section className="mt-12">
            <div className="flex flex-col gap-4 rounded-2xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Servis provayderisinizsə platformaya qoşulun</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Rəsmi servis, ekspertiza, mexanik, elektrik, EV/Hibrid — bütün növ servis profilləri üçün tərəfdaşlıq müraciəti.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  {["Servis şəkilləri", "Sertifikat upload", "Lokasiya", "1 ay pulsuz start"].map((item) => (
                    <span key={item} className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0891B2]" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href="/partners/inspection"
                className="shrink-0 rounded-xl bg-[#0891B2] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0e7490]"
              >
                Profil əlavə et →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
