import Link from "next/link";
import type { Metadata } from "next";
import { SupportRequestForm } from "@/components/support/support-request-form";

export const metadata: Metadata = {
  title: "Etibar mexanizmləri",
  description: "EkoMobil platformasında VIN məlumatı, servis tarixçəsi, yürüş təsdiqi və qəza arxivi haqqında məlumat."
};

const sections = [
  {
    id: "vin-yoxlama",
    title: "VIN Məlumatı",
    content: "VIN (Vehicle Identification Number) avtomobilin unikal identifikatorudur. EkoMobil-də VIN nömrəsi paylaşılır və alıcıya rəsmi/xarici mənbələrdən tarixçə yoxlaması üçün yönləndirmələr təqdim olunur. Tarixçə nəticələrinin müstəqil yoxlanması alıcının məsuliyyətindədir."
  },
  {
    id: "servis-tarixcesi",
    title: "Servis Tarixçəsi",
    content: "Satıcı servis tarixçəsi üzrə link və ya sənəd istinadı əlavə edə bilər. EkoMobil bu istinadları elan daxilində göstərir ki, alıcı məlumatı mənbə üzərindən müstəqil yoxlaya bilsin."
  },
  {
    id: "yurus-tesdigi",
    title: "Yürüş Təsdiqi",
    content: "Elan məlumatlarına əsaslanan avtomatik risk yoxlaması yürüş fərqi ehtimalını aşkarladıqda xəbərdarlıq göstərə bilər. Bu xəbərdarlıq ilkin siqnaldır və alıcı tərəfindən servis yoxlaması ilə təsdiqlənməlidir."
  },
  {
    id: "qeza-arxivi",
    title: "Qəza Arxivi",
    content: "Qəza tarixçəsi barədə məlumat satıcının təqdim etdiyi istinadlar və alıcının istifadə etdiyi xarici hesabat xidmətləri əsasında qiymətləndirilməlidir. EkoMobil alıcıya bu yoxlama üçün yönləndirmə təqdim edir."
  }
];

export default function TrustPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <nav className="mb-8 text-sm text-slate-500">
        <Link href="/" className="hover:text-[#0891B2]">Ana səhifə</Link>
        <span className="mx-2">/</span>
        <span className="text-[#3E2F28]">Etibar mexanizmləri</span>
      </nav>

      <h1 className="text-3xl font-bold text-[#3E2F28]">Etibar mexanizmləri</h1>
      <p className="mt-2 text-slate-600">
        EkoMobil elan məlumatlarının dolğunluğunu və risk siqnallarını avtomatik qiymətləndirir; yekun texniki/hüquqi yoxlama alıcı və satıcıya məxsusdur.
      </p>

      <div className="mt-10 space-y-12">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-xl font-semibold text-[#3E2F28]">{section.title}</h2>
            <p className="mt-3 text-slate-600 leading-relaxed">{section.content}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/listings?vinVerified=1" className="btn-primary text-sm">
          VIN nömrəsi olan elanlara bax
        </Link>
        <Link href="/partners/inspection" className="btn-secondary text-sm">
          Ekspertiza tərəfdaşı kimi qoşul
        </Link>
        <Link href="/" className="btn-secondary text-sm">
          Ana səhifəyə qayıt
        </Link>
      </div>

      <section id="support-request" className="mt-12 scroll-mt-24">
        <SupportRequestForm />
      </section>
    </div>
  );
}
