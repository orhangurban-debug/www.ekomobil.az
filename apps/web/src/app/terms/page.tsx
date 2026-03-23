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
            EkoMobil yalnız elanların dərc edilməsi, axtarış və əlaqə imkanlarının təmin edilməsi ilə məhdudlaşır. 
            Alıcı ilə satıcı arasında bağlanan müqavilələr birbaşa tərəflər arasında bağlanır. 
            Platforma bu müqavilələrin tərəfi deyil və məsuliyyət daşımır.
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
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">5. Etibar və yoxlama</h2>
          <p className="mt-3">
            EkoMobil VIN yoxlaması, yürüş uyğunluğu və satıcı doğrulaması kimi etibar siqnalları təqdim edir. 
            Bu məlumatlar köməkçi xarakter daşıyır və tam zəmanət vermir. 
            Alıcı öz məsuliyyəti ilə əlavə yoxlama (ekspertiza) edə bilər.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">6. Məsuliyyətin məhdudlaşdırılması</h2>
          <p className="mt-3">
            Platforma elanların dəqiqliyinə, satıcıların etibarlılığına və alıcı-satıcı mübahisələrinə görə 
            birbaşa məsuliyyət daşımır. İstifadəçilər öz riskləri ilə əməliyyatlar həyata keçirirlər.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">7. Dəyişikliklər</h2>
          <p className="mt-3">
            EkoMobil bu şərtləri əvvəlcədən xəbərdar etməklə dəyişə bilər. 
            Dəyişikliklər saytda dərc edildikdən sonra qüvvəyə minir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">8. Əlaqə</h2>
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
