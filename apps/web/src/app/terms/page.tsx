import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "İstifadəçi Razılaşması | EkoMobil",
  description: "EkoMobil platformasının istifadəçi razılaşması və istifadə şərtləri"
};

const EFFECTIVE_DATE = "1 may 2025";
const COMPANY_NAME = "EkoMobil MMC";
const COMPANY_EMAIL = "legal@ekomobil.az";
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
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-slate-900">İstifadəçi Razılaşması</h1>
        <p className="mt-2 text-slate-500">Son yenilənmə: {EFFECTIVE_DATE}</p>
        <p className="mt-1 text-sm text-slate-400">
          Bu saytdan istifadə etməklə aşağıdakı şərtlərə razı olduğunuzu təsdiqləyirsiniz.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Quick nav */}
        <nav className="mb-12 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Mündəricat</p>
          <ol className="space-y-1 text-sm text-[#0891B2]">
            {[
              { href: "#parties", label: "1. Tərəflər" },
              { href: "#platform-role", label: "2. Platformanın rolu" },
              { href: "#registration", label: "3. Qeydiyyat" },
              { href: "#listing-rules", label: "4. Elan qaydaları" },
              { href: "#paid-services", label: "5. Ödənişli xidmətlər" },
              { href: "#prohibited", label: "6. Qadağalar" },
              { href: "#sanctions", label: "7. İntizam tədbirləri" },
              { href: "#liability", label: "8. Məsuliyyətin məhdudlaşdırılması" },
              { href: "#termination", label: "9. Hesabın bağlanması" },
              { href: "#disputes", label: "10. Mübahisələrin həlli" },
              { href: "#changes", label: "11. Şərtlərin dəyişdirilməsi" },
              { href: "#contact", label: "12. Əlaqə" }
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

          <Section id="listing-rules" title="4. Elan qaydaları">
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

          <Section id="paid-services" title="5. Ödənişli xidmətlər">
            <Sub title="Elan planları">
              <p className="text-sm">
                Elan planları (Standart, VIP) hər elan üçün ayrıca bir dəfəlik ödənişdir. Plan qiyməti
                avtomobilin elan qiymətinə görə dəyişir — bax:{" "}
                <Link href="/pricing#listings" className="text-[#0891B2] hover:underline">Qiymət cədvəli</Link>.
              </p>
            </Sub>
            <Sub title="Boost (irəliləmə) xidmətləri">
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
                <li><strong>Elan planı:</strong> Elan texniki problem səbəbiylə heç aktivləşmədisə 7 iş günü ərzində geri qaytarılır</li>
                <li><strong>Boost xidməti:</strong> Aktivləşdikdən sonra geri qaytarılmır</li>
                <li><strong>Salon abunəsi:</strong> Başlanmış ay geri qaytarılmır; növbəti ay üçün ləğv mümkündür</li>
                <li><strong>Texniki nasazlıq:</strong> Sübut edilmiş platforma xətası olduqda ödəniş krediti şəklində kompensasiya edilə bilər</li>
              </ul>
            </Sub>
            <p className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Ödəniş prosesini üçüncü tərəf ödəniş sistemi (bank/prosessor) həyata keçirir. EkoMobil kart
              məlumatlarını saxlamır.
            </p>
          </Section>

          <Section id="prohibited" title="6. Qadağalar">
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

          <Section id="sanctions" title="7. İntizam tədbirləri">
            <p>
              Qaydaların pozulması aşağıdakı tədbirlərdən birini və ya bir neçəsini tətbiq etdirə bilər.
              Tətbiq olunan sanksiya pozuntunun ağırlığına görə seçilir:
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-4 py-3 font-semibold">Sanksiya səviyyəsi</th>
                    <th className="px-4 py-3 font-semibold">Tədbirlər</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { level: "Xəbərdarlıq", action: "E-poçt bildirişi; pozucu elanın düzəldilməsi tələbi" },
                    { level: "Müvəqqəti məhdudiyyət", action: "Elan yerləşdirmə 7–30 günlük müvəqqəti blok" },
                    { level: "Elanın silinməsi", action: "Pozucu elan geri qaytarılmadan silinir; ödəniş geri verilmir" },
                    { level: "Hesabın dayandırılması", action: "Hesab 30–90 gün dayandırılır; aktiv elanlar gizlənir" },
                    { level: "Daimi ban", action: "Hesab birdəfəlik bağlanır; ödənişlər geri qaytarılmır; yeni hesab qadağandır" }
                  ].map((row) => (
                    <tr key={row.level}>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.level}</td>
                      <td className="px-4 py-3 text-slate-600">{row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm">
              Ağır pozuntular (fırıldaqçılıq, oğurluq, saxta VIN) birbaşa daimi ban ilə nəticələnə bilər.
              Hüquq-mühafizə orqanlarına müraciət etmək hüququmuz qorunur.
            </p>
          </Section>

          <Section id="liability" title="8. Məsuliyyətin məhdudlaşdırılması">
            <p>
              Qanunun icazə verdiyi ən geniş həddə:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>
                EkoMobil platforma vasitəsilə tamamlanan (və ya tamamlanmayan) alqı-satqı əməliyyatı üçün
                heç bir məsuliyyət daşımır.
              </li>
              <li>
                İstifadəçinin elan məlumatlarına əsasən gördüyü hər hansı zərər, itki, tələb, xərc EkoMobil-ə
                aid edilə bilməz.
              </li>
              <li>
                Platforma texniki nasazlıq, dayanma müddəti, məlumat itkisi üçün məsuliyyəti məhdudlaşdırır —
                bu müddətdə ödənilmiş xidmət haqqının geri qaytarılması müzakirə edilə bilər.
              </li>
              <li>
                EkoMobil heç bir halda ödənilmiş elan haqlarını üstələyən zərəri kompensasiya etməyəcəkdir.
              </li>
            </ul>
          </Section>

          <Section id="termination" title="9. Hesabın bağlanması">
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

          <Section id="disputes" title="10. Mübahisələrin həlli">
            <p>
              Bu razılaşmadan doğan mübahisələr ilk növbədə{" "}
              <a href={`mailto:${COMPANY_EMAIL}`} className="text-[#0891B2] hover:underline">{COMPANY_EMAIL}</a>{" "}
              ünvanına yazılı müraciətlə həll edilməyə çalışılır. 30 gün ərzində razılığa gəlinmirsə, mübahisə
              Azərbaycan Respublikası qanunvericiliyinə uyğun olaraq Bakı şəhəri məhkəmələrinin yurisdiksiyasına
              verilir. Tətbiq olunan hüquq: Azərbaycan Respublikasının qanunvericiliyi.
            </p>
          </Section>

          <Section id="changes" title="11. Şərtlərin dəyişdirilməsi">
            <p>
              EkoMobil bu razılaşmanı istənilən vaxt dəyişdirə bilər. Əhəmiyyətli dəyişikliklər effektiv
              tarixdən ən azı <strong>14 gün əvvəl</strong> e-poçt bildirişi və saytdakı xəbərdarlıq
              vasitəsilə elan ediləcəkdir. Dəyişiklikdən sonra platformaya daxil olmaqla yeni şərtləri qəbul
              etmiş olursunuz.
            </p>
            <p>
              Cari versiyaya həmişə{" "}
              <Link href="/terms" className="text-[#0891B2] hover:underline">ekomobil.az/terms</Link>{" "}
              ünvanından daxil ola bilərsiniz. Yuxarıdakı &quot;Son yenilənmə&quot; tarixi hər dəyişiklikdə güncəllənir.
            </p>
          </Section>

          <Section id="contact" title="12. Əlaqə">
            <p>Bu razılaşma ilə bağlı suallarınız üçün:</p>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm space-y-1">
              <p><strong>{COMPANY_NAME}</strong></p>
              <p>{COMPANY_ADDRESS}</p>
              <p>
                E-poçt:{" "}
                <a href={`mailto:${COMPANY_EMAIL}`} className="text-[#0891B2] hover:underline">{COMPANY_EMAIL}</a>
              </p>
            </div>
          </Section>

        </div>

        {/* Footer links */}
        <div className="mt-16 flex flex-wrap gap-4 border-t border-slate-200 pt-8 text-sm">
          <Link href="/privacy" className="text-[#0891B2] hover:underline">Məxfilik Siyasəti</Link>
          <Link href="/rules" className="text-[#0891B2] hover:underline">Platforma Qaydaları</Link>
          <Link href="/pricing" className="text-[#0891B2] hover:underline">Qiymətlər</Link>
        </div>
      </div>
    </div>
  );
}
