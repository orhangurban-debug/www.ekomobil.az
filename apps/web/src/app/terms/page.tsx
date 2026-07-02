import Link from "next/link";
import type { ReactNode } from "react";
import { ContactActionButton } from "@/components/support/contact-action-button";

export const metadata = {
  title: "İstifadəçi Razılaşması | EkoMobil",
  description: "EkoMobil platformasının istifadəçi razılaşması və istifadə şərtləri"
};

const EFFECTIVE_DATE = "4 iyun 2026";
const COMPANY_NAME = "EkoMobil MMC";
const COMPANY_EMAIL = "info@ekomobil.az";
const COMPANY_ADDRESS = "Bakı, Azərbaycan";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="card">
      {/* Hero */}
      <div className="border-b border-slate-900/10 bg-white/60 px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-slate-900">İstifadəçi Razılaşması</h1>
        <p className="mt-2 text-slate-500">Son yenilənmə: {EFFECTIVE_DATE}</p>
        <p className="mt-1 text-sm text-slate-400">
          Bu saytdan istifadə etməklə aşağıdakı şərtlərə razı olduğunuzu təsdiqləyirsiniz.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Quick nav */}
        <nav className="mb-12 rounded-2xl border border-slate-900/10 bg-white/60 px-5 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Mündəricat</p>
          <ol className="space-y-1 text-sm text-[#0057FF]">
            {[
              { href: "#parties", label: "1. Tərəflər" },
              { href: "#platform-role", label: "2. Platformanın rolu" },
              { href: "#registration", label: "3. Qeydiyyat" },
              { href: "#user-types", label: "4. İstifadəçi növünə görə öhdəliklər" },
              { href: "#listing-rules", label: "5. Elan qaydaları" },
              { href: "#paid-services", label: "6. Ödənişli xidmətlər" },
              { href: "#prohibited", label: "7. Qadağalar" },
              { href: "#sanctions", label: "8. İntizam tədbirləri" },
              { href: "#liability", label: "9. Məsuliyyətin məhdudlaşdırılması" },
              { href: "#ip", label: "10. İntellektual mülkiyyət" },
              { href: "#termination", label: "11. Hesabın bağlanması" },
              { href: "#force-majeure", label: "12. Fors-major" },
              { href: "#disputes", label: "13. Mübahisələrin həlli" },
              { href: "#changes", label: "14. Şərtlərin dəyişdirilməsi" },
              { href: "#contact", label: "15. Əlaqə" }
            ].map((item) => (
              <li key={item.href}>
                <a href={item.href} className="hover:underline">{item.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-12">

          <Section id="parties" title="1. Tərəflər">
            <p>
              Bu razılaşma <strong>{COMPANY_NAME}</strong> (&quot;EkoMobil&quot;, &quot;platforma&quot;, &quot;biz&quot;) ilə
              ekomobil.az domenini istifadə edən hər bir fiziki və ya hüquqi şəxs (&quot;istifadəçi&quot;, &quot;siz&quot;)
              arasındadır.
            </p>
            <p>
              Platformaya daxil olmaqla, qeydiyyatdan keçmədən belə, bu razılaşmanın bütün şərtlərini
              oxuduğunuzu, başa düşdüyünüzü və qəbul etdiyinizi təsdiqləyirsiniz.
            </p>
            <p className="text-sm text-slate-500">
              Bu razılaşma Azərbaycan Respublikasının Mülki Məcəlləsi, &quot;Elektron ticarət haqqında&quot; Qanunu
              (2005), &quot;İstehlakçıların hüquqlarının müdafiəsi haqqında&quot; Qanunu (1995) və müvafiq vergi
              qanunvericiliyi çərçivəsində tənzimlənir.
            </p>
          </Section>

          <Section id="platform-role" title="2. Platformanın rolu">
            <p>
              EkoMobil bir <strong>reklam və elan platformasıdır</strong>. Biz satıcı, alıcı, vasitəçi, broker
              və ya komissioner deyilik. Platforma satıcılar ilə potensial alıcıları birləşdirmək üçün texniki
              mühit yaradır.
            </p>
            <Sub title="Biz etmirik:">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Avtomobilin mülkiyyət hüququ, texniki vəziyyəti, qanuni sənədləri ilə bağlı heç bir zəmanət vermirik</li>
                <li>Elan məlumatlarının doğruluğunu müstəqil olaraq yoxlamırıq (moderasiya istisna olmaqla)</li>
                <li>Alıcı ilə satıcı arasındakı əsas ödənişi emal etmirik</li>
                <li>Satışdan sonra yaranan hər hansı mülki, cinayət və ya inzibati məsuliyyəti daşımırıq</li>
              </ul>
            </Sub>
            <Sub title="Biz edirik:">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Elan yerləşdirmə, axtarış, şəkil emalı, VIN yoxlama texniki infrastrukturunu təmin edirik</li>
                <li>Elanların moderasiyasını, saxtakarlıq siqnallarını izləyirik</li>
                <li>Auksion axınını idarə edir, platforma haqlarını emal edirik</li>
                <li>İstifadəçi uyğunluğu pozuntuları üçün sanksiyalar tətbiq edirik</li>
              </ul>
            </Sub>
          </Section>

          <Section id="registration" title="3. Qeydiyyat">
            <Sub title="Fərdi istifadəçilər">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Bir şəxsə məxsus <strong>yalnız 1 aktiv hesab</strong> ola bilər</li>
                <li>Qeydiyyat zamanı real ad, telefon nömrəsi və e-poçt ünvanı tələb olunur</li>
                <li>18 yaşından kiçik şəxslər qeydiyyatdan keçə bilməz</li>
                <li>Hesab məlumatlarının gizli saxlanması istifadəçinin öhdəliyidir</li>
              </ul>
            </Sub>
            <Sub title="Biznes hesabları (salon / mağaza)">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Hüquqi şəxslər VÖEN (vergi ödəyicisinin eyniləşdirmə nömrəsi) ilə qeydiyyatdan keçməlidir</li>
                <li>Biznes hesabları aktiv abunə planı olmadan elan yerləşdirə bilməz</li>
                <li>Bir biznes subyektinin bir çox hesabı ola bilməz; filial idarəetməsi Enterprise plan vasitəsilə həll olunur</li>
              </ul>
            </Sub>
            <p>
              EkoMobil şübhəli hesablar üçün əlavə sənəd (şəxsiyyət vəsiqəsi, VÖEN arayışı və s.) tələb
              etmək hüququnu özündə saxlayır.
            </p>
          </Section>

          <Section id="user-types" title="4. İstifadəçi növünə görə öhdəliklər">
            <Sub title="Alıcılar">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Alıcı avtomobili <strong>öz məsuliyyəti ilə</strong> yoxlamalı, ekspertiza cəlb etməli, sənədləri təsdiq etdirməlidir</li>
                <li>Satın alınan avtomobilin gizli qüsurları, hüquqi mübahisəsi, borc yükü üçün platforma məsuliyyət daşımır</li>
                <li>Auksion qalib alıcısı öhdəliyini yerinə yetirməkdən imtina edərsə intizam ödənişi tətbiq olunur</li>
                <li>Platforma vasitəsilə heç bir ödəniş almayan alıcı bank vasitəsilə geri ödəmə (chargeback) tələb edə bilməz — mübahisə platformanın proseduruna yönləndirilməlidir</li>
              </ul>
            </Sub>
            <Sub title="Satıcılar (fərdi)">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Satıcı elan etdiyi avtomobilin <strong>hüquqi sahibi</strong> olduğunu və ya satış hüququna malik olduğunu zəmanət verir</li>
                <li>Avtomobilin texniki vəziyyəti, qəza tarixçəsi, girov yükü, saxlanma qeydi barədə <strong>tam və doğru məlumat</strong> vermək satıcının öhdəliyidir</li>
                <li>Yanlış məlumat nəticəsində üçüncü şəxslərə dəyən ziyan satıcının şəxsi məsuliyyətindədir</li>
                <li>Elan qeydiyyatı zamanı verilən bəyannamə hüquqi öhdəlik doğurur</li>
              </ul>
            </Sub>
            <Sub title="Salon mərkəzləri">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Salonlar aktiv VÖEN, hüquqi şəxs statusu və müvafiq ticarət icazəsi ilə fəaliyyət göstərməlidir</li>
                <li>Salon öz profili altında yerləşdirilən bütün elanların məzmunundan <strong>tam məsul</strong>dur</li>
                <li>Müştəriyə satış öncəsi yazılı sınaq aktı / müqavilə tərtib etmək salonun öhdəliyidir</li>
                <li>Salon hesabının hər hansı işçisi tərəfindən edilən pozuntu birbaşa hesab sahibinin məsuliyyətidir</li>
              </ul>
            </Sub>
            <Sub title="Servis tərəfdaşları">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Platforma üzərindən servis profili yaradan şirkət müvafiq lisenziya, sertifikat, peşəkar məsuliyyət sığortasına malik olmalıdır</li>
                <li>Servis göstərənin iş nəticəsi, garanti öhdəliyi, müştəriyə dəyən ziyan servis şirkətinin məsuliyyətindədir — platforma bu münasibətin tərəfi deyil</li>
                <li>Yanlış, aşırı iddialı servis məlumatı (sertifikat, reytinq) platformanın müvafiq nəzarəti olmadan dərc edilə bilməz</li>
              </ul>
            </Sub>
            <Sub title="Auksion iştirakçıları">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Auksionun gedişi, depozit saxlanması, intizam ödənişləri <Link href="/rules/auction" className="text-[#0057FF] hover:underline">Auksion çərçivəsi</Link> sənədinə tabedir — bu razılaşma ilə bərabər qüvvə daşıyır</li>
                <li>Hər bir bid <strong>bağlayıcı öhdəlikdir</strong>; texniki nasazlıq, şəbəkə problemi və ya istifadəçi xətası bid-i ləğv etmir</li>
                <li>Satıcı lotu canlıya çıxardıqda qalib alıcıya satış öhdəliyi yaranır; imtina intizam ödənişi ilə nəticələnir</li>
              </ul>
            </Sub>
          </Section>

          <Section id="listing-rules" title="5. Elan qaydaları">
            <Sub title="Ümumi tələblər">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Yalnız satıcıya məxsus və ya satış hüququ olan avtomobillər elan edilə bilər</li>
                <li>Bütün məlumatlar (qiymət, yürüş, texniki vəziyyət, avadanlıq) doğru olmalıdır</li>
                <li>Şəkillər elan olunan avtomobilin özünə aid olmalı, reklam üst-üstə yazısı olmadan real vəziyyəti əks etdirməlidir</li>
                <li>Qiymət Azərbaycan manatı (₼) ilə göstərilməlidir</li>
              </ul>
            </Sub>
            <Sub title="90 günlük dublikat qaydası">
              <p className="text-sm">
                Eyni VIN nömrəsinə məxsus avtomobil üçün son 90 gün ərzində artıq elan yerləşdirilmişsə,
                yeni elan avtomatik bloklanır. Bu qayda:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                <li>Eyni avtomobilin birdən çox elanını önləyir</li>
                <li>Koordinasiyalı qiymət manipulyasiyasına qarşı müdafiə edir</li>
                <li>90 gün dolduqdan sonra həmin avtomobil üçün yeni elan açmaq mümkündür</li>
              </ul>
            </Sub>
            <Sub title="Elan aktivlik müddəti">
              <p className="text-sm">
                Hər elan seçilmiş plana uyğun müddət ərzində aktivdir (30–90 gün). Müddət bitdikdə elan
                avtomatik arxivlənir; satış baş versə istifadəçi elanı &quot;Satıldı&quot; kimi qeyd etməlidir.
                Arxivlənmiş elan yenidən aktivləşdirilə bilər (ödənişlə).
              </p>
            </Sub>
          </Section>

          <Section id="paid-services" title="6. Ödənişli xidmətlər">
            <Sub title="Elan planları">
              <p className="text-sm">
                Elan planları (Standart, VIP) hər elan üçün ayrıca bir dəfəlik ödənişdir. Plan qiyməti
                avtomobilin elan qiymətinə görə dəyişir — bax:{" "}
                <Link href="/pricing#listings" className="text-[#0057FF] hover:underline">Qiymət cədvəli</Link>.
              </p>
            </Sub>
            <Sub title="İrəlilətmə xidmətləri">
              <p className="text-sm">
                İrəli çək, VIP, Premium — elan planından ayrıca satın alınır. Xidmət aktivləşdikdən sonra
                ləğv edilə bilməz. Müddətli paketlər (3, 5, 15, 30 gün) qeyd edilmiş müddət doldumdan sonra
                avtomatik dayandırılır, uzadılmır.
              </p>
            </Sub>
            <Sub title="Salon / mağaza abunəliyi">
              <p className="text-sm">
                Aylıq abunəlik hər ay eyni tarixdə yenilənir. Abunəlik ləğv edilmədən əvvəlki dövr üçün
                ödəniş geri qaytarılmır. Abunəlik ləğv edildikdə aktiv elanlar mövcud planın bitişinə qədər
                görünür, sonra arxivlənir.
              </p>
            </Sub>
            <Sub title="Geri qaytarma siyasəti">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li><strong>Elan planı:</strong> Uğurla aktivləşmiş plan geri qaytarılmır; texniki aktivləşmə xətasında 7 iş günü daxilində refund/kredit tətbiq edilir</li>
                <li><strong>İrəlilətmə xidməti:</strong> Aktivləşmiş irəlilətmə geri qaytarılmır; texniki aktivləşmə xətasında bərpa və ya kredit tətbiq edilə bilər</li>
                <li><strong>Salon abunəsi:</strong> Başlanmış ay geri qaytarılmır; ləğv yalnız növbəti dövr üçün qüvvəyə minir</li>
                <li><strong>Auksion intizam ödənişləri:</strong> Yalnız qayda pozuntusu təsdiqləndikdə tətbiq edilir və ayrıca mübahisə proseduruna tabedir</li>
              </ul>
              <p className="mt-2 text-sm">
                Tam qaydalar üçün{" "}
                <Link href="/refund-policy" className="text-[#0057FF] hover:underline">Refund və cərimə siyasəti</Link>{" "}
                sənədinə baxın.
              </p>
            </Sub>
            <p className="rounded-lg bg-amber-500/10 border border-amber-200 px-4 py-3 text-sm text-amber-700">
              Ödəniş prosesini üçüncü tərəf ödəniş sistemi (bank/prosessor) həyata keçirir. EkoMobil kart
              məlumatlarını saxlamır.
            </p>
          </Section>

          <Section id="prohibited" title="7. Qadağalar">
            <p>Aşağıdakı hərəkətlər platformada qadağandır:</p>
            <Sub title="Məlumat bütövlüyü">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Saxta, yanıltıcı və ya eksik məlumat yerləşdirmək</li>
                <li>Başqa şəxsə məxsus avtomobili sahibi kimi elan etmək</li>
                <li>Yürüşü, texniki vəziyyəti, qəza tarixçəsini gizlətmək və ya manipulyasiya etmək</li>
                <li>Satılmış avtomobil üçün aktiv elan saxlamaq</li>
              </ul>
            </Sub>
            <Sub title="Hesab manipulyasiyası">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Bir şəxs üçün birdən çox hesab açmaq</li>
                <li>Bloklanmış hesabın yerini tutmaq üçün yeni hesab açmaq</li>
                <li>Başqasının hesabından icazəsiz istifadə</li>
                <li>Avtomatlaşdırılmış bot, scraper, spam sistemi ilə platformaya yük vurmaq</li>
              </ul>
            </Sub>
            <Sub title="Elan manipulyasiyası">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Eyni avtomobil üçün 90 gün ərzində birdən çox aktiv elan</li>
                <li>Auksionlarda koordinasiyalı saxta bid (shill bidding)</li>
                <li>Qiymət endirimi bildirişi göndərmək üçün süni qiymət artırma-azaltma</li>
                <li>Başqa istifadəçilərin şəkil və məzmununu icazəsiz istifadə</li>
              </ul>
            </Sub>
            <Sub title="Ümumi qadağalar">
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                <li>Qeyri-qanuni, oğurlanmış, girov altında olan avtomobilin satışı</li>
                <li>Platforma daxilindən kənar ödəniş mexanizmi (kripto, hawala) vasitəsilə alıcını yönləndirmək</li>
                <li>Digər istifadəçiləri təhdid etmək, təhqir etmək, spam göndərmək</li>
                <li>Platformanın infrastrukturuna ziyan vurmaq (DDoS, injection, scraping)</li>
              </ul>
            </Sub>
          </Section>

          <Section id="sanctions" title="8. İntizam tədbirləri">
            <p>
              Qaydaların pozulması aşağıdakı tədbirlərdən birini və ya bir neçəsini tətbiq etdirə bilər.
              Tətbiq olunan sanksiya pozuntunun ağırlığına görə seçilir:
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-900/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-900/10 bg-white/60 text-left text-xs text-slate-500">
                    <th className="px-4 py-3 font-semibold">Sanksiya səviyyəsi</th>
                    <th className="px-4 py-3 font-semibold">Tədbirlər</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/10">
                  {[
                    { level: "Xəbərdarlıq", action: "E-poçt bildirişi; pozucu elanın düzəldilməsi tələbi" },
                    { level: "Müvəqqəti məhdudiyyət", action: "Elan yerləşdirmə 7–30 günlük müvəqqəti blok" },
                    { level: "Elanın silinməsi", action: "Pozucu elan geri qaytarılmadan silinir; ödəniş geri verilmir" },
                    { level: "Hesabın dayandırılması", action: "Hesab 30–90 gün dayandırılır; aktiv elanlar gizlənir" },
                    { level: "Daimi ban", action: "Hesab birdəfəlik bağlanır; ödənişlər geri qaytarılmır; yeni hesab qadağandır" }
                  ].map((row) => (
                    <tr key={row.level}>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.level}</td>
                      <td className="px-4 py-3 text-slate-600">{row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm">
              Ağır pozuntular (fırıldaqçılıq, oğurluq, saxta VIN) birbaşa daimi ban ilə nəticələnə bilər.
              Bu hallarda platforma qeydiyyat məlumatları, elan tarixçəsi, texniki loglar və şikayət qeydlərini
              qanuni əsasla hüquq-mühafizə orqanlarına təqdim edə bilər.{" "}
              <Link href="/legal" className="text-[#0057FF] hover:underline">
                Hüquqi məlumat
              </Link>
            </p>
          </Section>

          <Section id="liability" title="9. Məsuliyyətin məhdudlaşdırılması">
            <p>
              Qanunun icazə verdiyi ən geniş həddə:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>
                EkoMobil platforma vasitəsilə tamamlanan (və ya tamamlanmayan) alqı-satqı əməliyyatının tərəfi deyil
                və bu əməliyyatlara görə <strong>heç bir məsuliyyət daşımır</strong>.
              </li>
              <li>
                Elan məlumatlarının doğruluğu, avtomobilin texniki vəziyyəti, mülkiyyət hüququ, girov yükü,
                sığorta statusu, vergi borcu, gizli qüsurlar barədə platforma <strong>heç bir zəmanət vermir</strong>.
              </li>
              <li>
                İstifadəçinin elan məlumatlarına əsasən gördüyü hər hansı zərər, itki, tələb, xərc EkoMobil-ə
                aid edilə bilməz.
              </li>
              <li>
                Platforma texniki nasazlıq, planlı texniki iş, üçüncü tərəf xidmət fasilələri, kibertəhlükəsizlik
                hadisəsi nəticəsindəki fasilə zamanı xidmət mövcudluğunu zəmanət etmir.
              </li>
              <li>
                EkoMobil heç bir halda istifadəçinin ödədiyi platforma xidmət haqlarını üstələyən birbaşa,
                dolayı, törəmə və ya cəzalandırıcı zərəri kompensasiya etməyəcəkdir.
              </li>
              <li>
                Satıcı, alıcı, salon, servis şirkəti və ya auksion iştirakçısı öz öhdəliklərindən irəli gələn
                bütün üçüncü tərəf tələblərindən platformanı azad edir (indemnification).
              </li>
            </ul>
            <p className="rounded-lg bg-amber-500/10 border border-amber-200 px-4 py-3 text-sm text-amber-700">
              Həmin avtomobilin alınması qərarı <strong>alıcının özünün məsuliyyətidir</strong>.
              Platforma ekspertiza, hüquqi yoxlama əvəzi deyil.
            </p>
          </Section>

          <Section id="ip" title="10. İntellektual mülkiyyət">
            <p className="text-sm">
              Platforma brendi, dizaynı, kodu, alqoritmi, istifadəçi interfeysi{" "}
              <strong>{COMPANY_NAME}</strong> şirkətinə məxsusdur və qorunur.
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              <li>
                İstifadəçinin platformaya yüklədiyi şəkil, mətn, video (&quot;məzmun&quot;) özünə məxsusdur;
                platforma bu məzmunu xidmət çərçivəsinde göstərmək, indeksləmək, emal etmək üçün
                ödənişsiz, qeyri-müstəsna lisenziya alır.
              </li>
              <li>
                Platformanın məzmununu kütləvi yığmaq (scraping), yenidən dərc etmək, ticarət məqsədi ilə
                istifadə etmək yalnız yazılı icazə ilə mümkündür.
              </li>
              <li>
                Başqasının əqli mülkiyyətini, ticarət nişanını, logosunu icazəsiz istifadə etmək qadağandır.
              </li>
            </ul>
          </Section>

          <Section id="termination" title="11. Hesabın bağlanması">
            <Sub title="İstifadəçi tərəfindən">
              <p className="text-sm">
                Hesabınızı istənilən vaxt Parametrlər bölməsindən bağlaya bilərsiniz. Aktiv abunəliklər
                bitməkdə olan dövrü tamamlayır, geri qaytarılmır. Bağlama tamamlandıqdan sonra məlumatlar
                hüquqi öhdəliklərimiz çərçivəsində saxlanıla bilər (bax: Məxfilik Siyasəti).
              </p>
            </Sub>
            <Sub title="EkoMobil tərəfindən">
              <p className="text-sm">
                Bu razılaşmanın əhəmiyyətli pozuntusu, uzun müddətli fəaliyyətsizlik (18 ay+) və ya hüquqi
                tələb olduqda EkoMobil hesabı bağlaya bilər. Ağır olmayan hallarda əvvəlcədən e-poçt bildirişi
                göndərilir.
              </p>
            </Sub>
          </Section>

          <Section id="force-majeure" title="12. Fors-major">
            <p className="text-sm">
              Platformanın nəzarəti xaricindəki hadisələr (təbii fəlakət, enerji kəsilməsi, kiberhücum,
              pandemiya, hükümətin tənzimləyici tədbirləri, xidmət təminatçısının fasilə verməsi) nəticəsində
              yarana biləcək gecikmə, xidmət fasiləsi və ya itki üçün EkoMobil məsuliyyət daşımır.
            </p>
            <p className="text-sm">
              Fors-major halı aradan qaldıqdan sonra platforma xidmətlərini mümkün qədər tezliklə
              bərpa etmək üçün lazımi tədbirləri görür.
            </p>
          </Section>

          <Section id="disputes" title="13. Mübahisələrin həlli">
            <p>
              Bu razılaşmadan doğan mübahisələr ilk növbədə{" "}
              <ContactActionButton intent="legal" />{" "}
              vasitəsilə həll edilməyə çalışılır. Refund və cərimə mübahisələrində ilkin cavab müddəti 2 iş günü,
              yekun qərar müddəti 10 iş günüdür; qərardan sonra 5 iş günü ərzində apellyasiya vermək mümkündür.
              30 gün ərzində razılığa gəlinmirsə, mübahisə
              Azərbaycan Respublikası qanunvericiliyinə uyğun olaraq Bakı şəhəri məhkəmələrinin yurisdiksiyasına
              verilir. Tətbiq olunan hüquq: Azərbaycan Respublikasının qanunvericiliyi.
            </p>
          </Section>

          <Section id="changes" title="14. Şərtlərin dəyişdirilməsi">
            <p>
              EkoMobil bu razılaşmanı istənilən vaxt dəyişdirə bilər. Əhəmiyyətli dəyişikliklər effektiv
              tarixdən ən azı <strong>14 gün əvvəl</strong> e-poçt bildirişi və saytdakı xəbərdarlıq
              vasitəsilə elan ediləcəkdir. Dəyişiklikdən sonra platformaya daxil olmaqla yeni şərtləri qəbul
              etmiş olursunuz.
            </p>
            <p>
              Cari versiyaya həmişə{" "}
              <Link href="/terms" className="text-[#0057FF] hover:underline">ekomobil.az/terms</Link>{" "}
              ünvanından daxil ola bilərsiniz. Yuxarıdakı &quot;Son yenilənmə&quot; tarixi hər dəyişiklikdə güncəllənir.
            </p>
          </Section>

          <Section id="contact" title="15. Əlaqə">
            <p>Bu razılaşma ilə bağlı suallarınız üçün:</p>
            <div className="mt-3 rounded-xl border border-slate-900/10 bg-white/60 px-5 py-4 text-sm space-y-3">
              <p><strong>{COMPANY_NAME}</strong></p>
              <p>{COMPANY_ADDRESS}</p>
              <p className="text-slate-500">Hüquqi rekvizitlər (VÖEN və qeydiyyat məlumatı) sorğu əsasında təqdim edilir.</p>
              <ContactActionButton intent="legal" />
            </div>
          </Section>

        </div>

        {/* Footer links */}
        <div className="mt-16 flex flex-wrap gap-4 border-t border-slate-900/10 pt-8 text-sm">
          <Link href="/privacy" className="text-[#0057FF] hover:underline">Məxfilik Siyasəti</Link>
          <Link href="/rules" className="text-[#0057FF] hover:underline">Platforma Qaydaları</Link>
          <Link href="/refund-policy" className="text-[#0057FF] hover:underline">Refund siyasəti</Link>
          <Link href="/pricing" className="text-[#0057FF] hover:underline">Qiymətlər</Link>
        </div>
      </div>
    </div>
  );
}
