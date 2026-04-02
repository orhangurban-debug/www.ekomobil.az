import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Etibar mexanizmləri",
  description: "EkoMobil platformasının VIN yoxlaması, servis tarixçəsi, yürüş təsdiqi və qəza arxivi haqqında məlumat."
};

const sections = [
  {
    id: "vin-yoxlama",
    title: "VIN Yoxlama",
    content: "Hər avtomobilin şəxsiyyəti rəsmi mənbələr vasitəsilə təsdiqlənir. VIN (Vehicle Identification Number) kodu avtomobilin unikal identifikatorudur və qəza tarixçəsi, sahib dəyişiklikləri, texniki vəziyyət haqqında məlumat verir."
  },
  {
    id: "servis-tarixcesi",
    title: "Servis Tarixçəsi",
    content: "Rəsmi servis mərkəzlərindən texniki qulluq qeydlərinin tam tarixi. Baxım, təmir və hissə dəyişiklikləri haqqında şəffaf məlumat əldə edə bilərsiniz."
  },
  {
    id: "yurus-tesdigi",
    title: "Yürüş Təsdiqi",
    content: "DYP məlumat bazası ilə elandakı yürüş rəqəminin uyğunluğu yoxlanılır. Avtomobilin real yürüşü ilə elan məlumatı uyğun gəlmirsə, sizə xəbərdarlıq göstərilir."
  },
  {
    id: "qeza-arxivi",
    title: "Qəza Arxivi",
    content: "Qəza və zərər tarixçəsi məlumat bazaları ilə inteqrasiya. Avtomobilin keçmişində qeydə alınmış qəza və ya ciddi zərər varsa, bunu əvvəlcədən biləcəksiniz."
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
        EkoMobil hər elanı şəffaflıq protokoluna uyğun yoxlayır.
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
        <Link href="/" className="btn-secondary text-sm">
          Ana səhifəyə qayıt
        </Link>
      </div>
    </div>
  );
}
