import Link from "next/link";
import { ContactActionButton } from "@/components/support/contact-action-button";

export const metadata = {
  title: "Hüquqi məlumat | EkoMobil",
  description: "Fırıldaqçılıqla mübarizə, hüquq-mühafizə əməkdaşlığı və platforma məsuliyyətinin həddi"
};

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <nav className="mb-8 text-sm text-white/50">
        <Link href="/" className="hover:text-white">
          Ana səhifə
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">Hüquqi məlumat</span>
      </nav>

      <h1 className="text-3xl font-bold text-white">Hüquqi məlumat və fırıldaqçılıqla mübarizə</h1>
      <p className="mt-2 text-white/50">
        EkoMobil alqı-satqının tərəfi deyil; lakin qanuna uyğun qaydada fırıldaqçılıq hallarına qarşı
        texniki və hüquqi tədbirlər görür.
      </p>

      <div className="mt-8 space-y-8 text-white/80 leading-relaxed">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Platformanın rolu</h2>
          <p className="mt-3">
            EkoMobil istifadəçilərə elan yerləşdirmək və bir-biri ilə əlaqə saxlamaq üçün texniki platforma verir.
            Avtomobilin və ya hissənin faktiki vəziyyəti, mülkiyyət hüququ, gizli qüsurlar və yekun alış qərarı
            satıcı ilə alıcı arasındadır. Platforma bu münasibətlərin tərəfi deyil və heç bir zəmanət vermir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">Fırıldaqçılıq və saxta elanlara qarşı tədbirlər</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Telefon təsdiqi, elan dublikat yoxlaması, media və VIN siqnalları</li>
            <li>İstifadəçi şikayətləri və admin insident idarəetməsi</li>
            <li>Hesab dayandırma, elan silmə və daimi ban sanksiyaları</li>
            <li>Texniki fəaliyyət jurnalı (IP hash, cihaz izi, əməliyyat tarixçəsi)</li>
            <li>Qeydiyyat zamanı razılaşma qəbulunun server tərəfində qeydiyyatı</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">Hüquq-mühafizə orqanları ilə əməkdaşlıq</h2>
          <p className="mt-3">
            Qanuni tələb, məhkəmə qərarı, rəsmi araşdırma sorğusu və ya fövqəladə təhlükəsizlik halında EkoMobil
            müvafiq qanunvericiliyə uyğun olaraq istifadəçi məlumatlarını təqdim edə bilər. Bu məlumatlara daxil ola bilər:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Qeydiyyat məlumatları (ad, email, telefon, şəhər)</li>
            <li>Elan və auksion tarixçəsi</li>
            <li>Şikayət və insident qeydləri</li>
            <li>Texniki loglar (IP hash, sessiya izi, fəaliyyət jurnalı)</li>
            <li>Ödəniş və komisyon qeydləri (bank kart məlumatları saxlanmır)</li>
            <li>KYC məlumatları (təsdiq prosesindən keçmiş istifadəçilər üçün)</li>
          </ul>
          <p className="mt-3 text-sm text-white/65">
            Rəsmi sorğular yalnız səlahiyyətli orqanlar tərəfindən, rəsmi sənəd və ya qanuni əsasla daxil edilməlidir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">Şikayət və yalan şikayət qaydası</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            <li>
              <strong>Şikayət edən</strong> iddiasını sübutla (foto, sənəd, yazışma, yoxlama nəticəsi) təqdim etməlidir
              və yalan şikayətə görə məsuliyyət daşıdığını qəbul edir.
            </li>
            <li>
              <strong>Şikayət olunan</strong> (satıcı) haqlı olduğunu iddia edirsə, 7 gün ərzində müdafiə sübutu təqdim
              edə bilər.
            </li>
            <li>Platforma hər iki tərəfin sübutunu yoxlayır və insident qeydi aparır.</li>
            <li>
              Müdafiə sübutu verilməsə, şikayət qanuni qaydada <strong>hüquq-mühafizə orqanlarına</strong> ötürülə bilər.
            </li>
            <li>
              Sübutu olmayan və ya qəsdən yalan şikayət aşkar edilərsə, şikayət edən barədə intizam tədbirləri tətbiq
              oluna bilər.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">Rəsmi sorğu necə göndərilir?</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            <li>Orqanın rəsmi adı, sorğu nömrəsi və qanuni əsas göstərilməlidir</li>
            <li>Subyekt (istifadəçi ID, elan ID, telefon və ya email) dəqiq göstərilməlidir</li>
            <li>Tələb olunan məlumatın həcmi və cavab müddəti qeyd edilməlidir</li>
            <li>Sorğu rəsmi kanallarla (möhürlü sənəd, rəsmi email) təqdim edilməlidir</li>
          </ol>
          <p className="mt-4">
            Ümumi istifadəçi şikayətləri üçün{" "}
            <Link href="/trust" className="text-[#0891B2] hover:underline">
              etibar mərkəzi
            </Link>
            , hüquqi müraciətlər üçün isə{" "}
            <ContactActionButton intent="legal" /> istifadə edin.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">Əlaqəli sənədlər</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/terms" className="text-[#0891B2] hover:underline">
                İstifadəçi Razılaşması
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-[#0891B2] hover:underline">
                Məxfilik Siyasəti
              </Link>
            </li>
            <li>
              <Link href="/rules" className="text-[#0891B2] hover:underline">
                Platforma Qaydaları
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
