import Link from "next/link";

export const metadata = {
  title: "Məxfilik siyasəti | EkoMobil",
  description: "EkoMobil platformasının məxfilik siyasəti"
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <nav className="mb-8 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Ana səhifə</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Məxfilik siyasəti</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900">Məxfilik siyasəti</h1>
      <p className="mt-2 text-slate-500">Son yeniləmə: 2026</p>

      <div className="mt-10 space-y-8 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">1. Toplanan məlumatlar</h2>
          <p className="mt-3">
            EkoMobil aşağıdakı məlumatları toplaya bilər:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li><strong>Hesab məlumatları:</strong> email, şifrə (hash), ad, telefon, şəhər</li>
            <li><strong>Elan məlumatları:</strong> avtomobil təsviri, VIN, qiymət, şəkillər</li>
            <li><strong>Texniki məlumatlar:</strong> IP ünvanı, brauzer növü, cihaz məlumatları</li>
            <li><strong>İstifadə məlumatları:</strong> səhifə görüntüləmələri, axtarış sorğuları, favorilər</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">2. Məlumatların istifadəsi</h2>
          <p className="mt-3">
            Toplanan məlumatlar aşağıdakı məqsədlər üçün istifadə olunur:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>Platforma xidmətlərinin təmin edilməsi</li>
            <li>İstifadəçi hesablarının idarə edilməsi</li>
            <li>Elanların nümayişi və axtarış imkanları</li>
            <li>Alıcı-satıcı əlaqəsinin təmin edilməsi</li>
            <li>Platformanın təhlükəsizliyi və sui-istifadənin qarşısının alınması</li>
            <li>Analitika və xidmətin təkmilləşdirilməsi</li>
            <li>Auksion risk skoru, bidder uyğunluğu və dispute audit izinin saxlanılması</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">3. Məlumatların paylaşılması</h2>
          <p className="mt-3">
            Şəxsi məlumatlarınız üçüncü tərəflərlə yalnız aşağıdakı hallarda paylaşılır:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>Qanuni tələb və ya məhkəmə qərarı ilə</li>
            <li>Dövlət orqanlarının sorğularına cavab olaraq</li>
            <li>İstifadəçinin açıq razılığı ilə (məsələn, satıcı ilə əlaqə üçün telefon/email)</li>
            <li>Auksion qalibi müəyyən edildikdən sonra satışın tamamlanması üçün qarşı tərəflə zəruri əlaqə məlumatlarının paylaşılması</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">4. Auksion və ödəniş məlumatları</h2>
          <p className="mt-3">
            Auksion iştirakında bid tarixçəsi, cihaz və risk siqnalları, bidder uyğunluğu, no-show qeydləri,
            xidmət haqları və success fee invoice kimi platforma gəlirləri ilə bağlı əməliyyat məlumatları saxlanıla bilər.
          </p>
          <p className="mt-3">
            EkoMobil avtomobilin əsas satış ödənişini qəbul etmədiyi üçün alıcı ilə satıcı arasında birbaşa tamamlanan
            əsas alış məbləği platformanın ödəniş sistemi daxilində saxlanılmır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">5. Cookie və texnologiyalar</h2>
          <p className="mt-3">
            Platforma sessiya idarəetməsi, avtorizasiya və istifadə təcrübəsi üçün cookie və yerli saxlama 
            (localStorage) istifadə edir. Zəruri cookie-lər xidmətin işləməsi üçün tələb olunur.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">6. Məlumatların qorunması</h2>
          <p className="mt-3">
            Şifrələr hash edilmiş formada saxlanılır. Məlumatlar təhlükəsiz serverlərdə və 
            şəbəkə protokolları ilə ötürülür. Müntəzəm təhlükəsizlik yoxlamaları həyata keçirilir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">7. İstifadəçi hüquqları</h2>
          <p className="mt-3">
            İstifadəçilər öz məlumatlarına daxil olmaq, düzəliş etmək və ya silmək tələb edə bilər. 
            Hesab silinməsi üçün <a href="mailto:info@ekomobil.az" className="text-brand-600 hover:underline">info@ekomobil.az</a> ünvanına müraciət edin.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">8. Dəyişikliklər</h2>
          <p className="mt-3">
            Məxfilik siyasəti dəyişdikdə bu səhifədə yenilənəcək. 
            Əhəmiyyətli dəyişikliklər haqqında email vasitəsilə xəbərdar edə bilərik.
          </p>
        </section>
      </div>

      <div className="mt-12 flex gap-4">
        <Link href="/terms" className="btn-secondary">İstifadəçi şərtləri</Link>
        <Link href="/" className="btn-primary">Ana səhifəyə qayıt</Link>
      </div>
    </div>
  );
}
