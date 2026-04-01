import Link from "next/link";

export const metadata = {
  title: "İstifadəçi şərtləri | EkoMobil",
  description: "EkoMobil platformasının istifadəçi şərtləri və qaydaları"
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <nav className="mb-8 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Ana səhifə</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">İstifadəçi şərtləri</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900">İstifadəçi şərtləri</h1>
      <p className="mt-2 text-slate-500">Son yeniləmə: 2026</p>

      <div className="mt-10 space-y-8 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">1. Ümumi müddəalar</h2>
          <p className="mt-3">
            EkoMobil (ekomobil.az) avtomobil alqı-satqısı üçün platforma xidməti təqdim edir. Platforma avtomobil satmır; 
            alıcı və satıcı arasında vasitəçi kimi çıxış edir. Bu şərtlər platformadan istifadə edən bütün istifadəçilərə tətbiq olunur.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">2. Platforma rolu</h2>
          <p className="mt-3">
            EkoMobil yalnız elanların və auksion məlumatlarının yerləşdirilməsi, axtarış və əlaqə imkanlarının təmin
            edilməsi ilə məhdudlaşır. Alıcı ilə satıcı arasında bağlanan razılaşmalar birbaşa tərəflər arasında bağlanır.
            Platforma həmin razılaşmaların tərəfi deyil.
          </p>
          <p className="mt-3">
            EkoMobil satıcı, alıcı, agent, komisyonçu və ya escrow xidməti göstərən maliyyə vasitəçisi kimi çıxış etmir.
            Platforma avtomobilin əsas satış məbləğini qəbul etmir, saxlamır və tərəflər arasında bölüşdürmür.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">3. Elan qaydaları</h2>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>Elanlar dəqiq və etibarlı məlumat əsasında dərc edilməlidir.</li>
            <li>VIN kodu, yürüş və digər texniki məlumatlar doğru olmalıdır.</li>
            <li>Qeyri-qanuni və ya aldadıcı məzmun qadağandır.</li>
            <li>Platforma əks halda elanları silmək və hesabı məhdudlaşdırmaq hüququnu saxlayır.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">4. Ödəniş təhlükəsizliyi</h2>
          <p className="mt-3">
            Alıcı ilə satıcı arasında ödəniş birbaşa tərəflər arasında həyata keçirilir. 
            Tövsiyə olunur: ödənişi yalnız fiziki görüşdə və avtomobili yoxladıqdan sonra edin. 
            Bank köçürməsi və ya rəsmi qəbz əsasında ödəniş təhlükəsizlik üçün tövsiyə olunur.
          </p>
          <p className="mt-3">
            Platforma yalnız öz xidmət haqlarını, məsələn elan planı, auksion lot haqqı, bidder deposit, no-show cəriməsi
            və ya satıcı success fee invoice kimi ödənişləri qəbul edə bilər. Avtomobilin əsas alış qiyməti
            birbaşa alıcı ilə satıcı arasında tamamlanmalıdır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">5. Auksion qaydalarının hüquqi çərçivəsi</h2>
          <p className="mt-3">
            EkoMobil auksion modulu yalnız alıcı və satıcını bir araya gətirən rəqəmsal infrastruktur, elan,
            moderasiya, bildiriş və qayda mühərriki təqdim edir. Hərracın nəticəsində yaranan əsas satış münasibəti
            tərəflər arasında formalaşır.
          </p>
          <p className="mt-3">
            Qalib təklif hüquqi və ya məhsul qaydaları baxımından bağlayıcı hesab edilə bilər, lakin avtomobilin
            tam ödənişinin qəbulu, təhvil-təslim, notariat əməliyyatları və mülkiyyət keçidi tərəflərin öz aralarında
            həll etdiyi prosesdir. Platforma yalnız öz xidmət haqları və intizam ödənişləri üzrə tərəfdir.
          </p>
          <p className="mt-3">
            Satıcı və alıcı auksion iştirakı zamanı öz öhdəliklərini bilir və qəbul edir. Tərəflər arasında yaranan
            hər hansı mübahisə, gecikmiş ödəniş, təhvilin pozulması və ya elan məlumatının uyğunsuzluğu üzrə məsuliyyət
            birbaşa həmin tərəflərə aiddir; EkoMobil bu məsələlərdə vasitəçi və ya zəmanətçi kimi çıxış etmir. İstisna
            yalnız platformanın birbaşa təqdim etdiyi ödəniş xidməti (məsələn lot haqqı, qaydalarda göstərilən intizam
            cərimələri) ilə məhdudlaşır.
          </p>
          <p className="mt-3">
            Strukturlaşdırılmış auksion təsviri və mərhələli inkişaf planı saytın{" "}
            <Link href="/rules/auction" className="text-brand-600 hover:underline">
              Auksion çərçivəsi
            </Link>{" "}
            səhifəsində dərc olunur.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">6. Etibar və yoxlama</h2>
          <p className="mt-3">
            EkoMobil satıcının təqdim etdiyi VIN, servis tarixçəsi və digər istinadları yerləşdirmək və göstərmək üçün
            imkan yaradır. Bu məlumatların düzgünlüyü və tamlığı satıcının məsuliyyətindədir.
          </p>
          <p className="mt-3">
            Platforma müstəqil texniki araşdırma aparmır və ekspert rəyi vermir. Alıcı istədikdə əlavə yoxlamanı (ekspertiza
            və ya servis mərkəzi baxışı) özü təşkil edə bilər.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">7. Məsuliyyətin məhdudlaşdırılması</h2>
          <p className="mt-3">
            Platforma elanların dəqiqliyinə, satıcıların təqdim etdiyi məlumatların nəticələrinə və alıcı-satıcı
            münasibətlərinə görə birbaşa məsuliyyət daşımır. İstifadəçilər əməliyyatları öz qərarı ilə icra edirlər.
          </p>
          <p className="mt-3">
            Platforma avtomobilin texniki vəziyyəti, real bazar dəyəri, tərəflərin öhdəliklərini yerinə yetirməsi,
            əsas satış ödənişinin icrası və ya mülkiyyət keçidinin hüquqi nəticələri üçün zəmanət vermir.
            EkoMobil üzərində göstərilən məlumatlar məlumatlandırma məqsədi daşıyır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">8. Dəyişikliklər</h2>
          <p className="mt-3">
            EkoMobil bu şərtləri əvvəlcədən xəbərdar etməklə dəyişə bilər. 
            Dəyişikliklər saytda dərc edildikdən sonra qüvvəyə minir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">9. Əlaqə</h2>
          <p className="mt-3">
            Suallarınız üçün: <a href="mailto:info@ekomobil.az" className="text-brand-600 hover:underline">info@ekomobil.az</a>
          </p>
        </section>
      </div>

      <div className="mt-12 flex gap-4">
        <Link href="/privacy" className="btn-secondary">Məxfilik siyasəti</Link>
        <Link href="/" className="btn-primary">Ana səhifəyə qayıt</Link>
      </div>
    </div>
  );
}
