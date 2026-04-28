import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Platforma Qaydaları | EkoMobil",
  description: "EkoMobil-in elan, hesab, ödəniş və istifadə qaydaları"
};

const EFFECTIVE_DATE = "28 aprel 2026";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}

function RuleList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function RulesPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Platforma Qaydaları</h1>
        <p className="mt-2 text-slate-500">Son yenilənmə: {EFFECTIVE_DATE}</p>
        <p className="mt-1 text-sm text-slate-400">
          EkoMobil-dən istifadə hər istifadəçinin bu qaydaları qəbul etdiyini bildirir.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Quick nav */}
        <nav className="mb-12 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Mündəricat</p>
          <ol className="grid grid-cols-1 gap-1 text-sm text-[#0891B2] sm:grid-cols-2">
            {[
              { href: "#platform-status", label: "1. Platformanın statusu" },
              { href: "#account-rules", label: "2. Hesab qaydaları" },
              { href: "#listing-rules", label: "3. Elan yerləşdirmə qaydaları" },
              { href: "#photo-rules", label: "4. Foto və media qaydaları" },
              { href: "#duplicate-rule", label: "5. Dublikat elan qaydası (90 gün)" },
              { href: "#paid-services-rules", label: "6. Ödənişli xidmətlər qaydası" },
              { href: "#business-rules", label: "7. Biznes hesabları üçün əlavə qaydalar" },
              { href: "#prohibited", label: "8. Qadağan olunan fəaliyyətlər" },
              { href: "#moderation", label: "9. Moderasiya və şikayət" },
              { href: "#sanctions", label: "10. İntizam tədbirləri" },
              { href: "#auction-link", label: "11. Auksion qaydaları" },
              { href: "#legal-links", label: "12. Hüquqi sənədlər" }
            ].map((item) => (
              <li key={item.href}>
                <a href={item.href} className="hover:underline">{item.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-12">

          <Section id="platform-status" title="1. Platformanın statusu">
            <p>
              EkoMobil <strong>elan platformasıdır</strong> — alıcı, satıcı, broker, komissioner deyil.
              Platforma avtomobil sahiblərini potensial alıcılarla texniki mühit vasitəsilə birləşdirir.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm">
              <p className="font-semibold text-slate-800">Əsas prinsip</p>
              <p className="mt-2 text-slate-600">
                Hər elanda təqdim olunan məlumatların doğruluğu, avtomobilin texniki vəziyyəti, sənədlərinin
                tamlığı, qiymətinin ədalətliliyi <strong>yalnız satıcının məsuliyyətindədir</strong>.
                EkoMobil bu məsələlərə görə heç bir hüquqi məsuliyyət daşımır.
              </p>
            </div>
          </Section>

          <Section id="account-rules" title="2. Hesab qaydaları">
            <RuleList items={[
              "Hər fiziki şəxs yalnız 1 hesab aça bilər",
              "Qeydiyyat məlumatları (ad, e-poçt, telefon) real və doğru olmalıdır",
              "Hesab şifrəsi gizli saxlanmalıdır; başqasının hesabından istifadə qadağandır",
              "Bloklanmış istifadəçinin yeni hesab açması qadağandır",
              "18 yaşdan kiçik şəxslər qeydiyyatdan keçə bilməz",
              "Şübhəli hallarda EkoMobil əlavə doğrulama (şəxsiyyət vəsiqəsi) tələb edə bilər"
            ]} />
          </Section>

          <Section id="listing-rules" title="3. Elan yerləşdirmə qaydaları">
            <RuleList items={[
              "Yalnız sahibi olduğunuz və ya satış hüququnuz olan avtomobili elan edə bilərsiniz",
              "Qiymət, yürüş, il, texniki vəziyyət, komplektasiya haqqında məlumatlar dəqiq olmalıdır",
              "Satılmış avtomobil üçün elan aktivdə saxlanmamalıdır — satış baş verdikdə 'Satıldı' işarəsi qoyun",
              "Qiymət Azərbaycan manatı (₼) ilə göstərilməlidir",
              "Əlaqə məlumatı (telefon) real olmalı və sizə aid olmalıdır",
              "Xarici sayta, sosial şəbəkəyə, rəqib platformaya link qoymaq qadağandır",
              "Elan başlığında və ya açıqlamasında spam söz, həddindən çox nida/sual işarəsi istifadəsi moderasiyaya səbəb olur"
            ]} />
          </Section>

          <Section id="photo-rules" title="4. Foto və media qaydaları">
            <RuleList items={[
              "Şəkillər elan olunan avtomobilin özünə aid olmalıdır",
              "Aydın çəkilmiş, işıqlı, müasir şəkillər tövsiyə olunur (bax: şəkil bələdçisi)",
              "Saxta, başqa avtomobilin, internet şəkilinin istifadəsi qadağandır",
              "Şəkillərin üzərindəki əlaqə məlumatı (telefon, link, QR) qadağandır",
              "Şəkillər platformaya yüklənməzdən əvvəl avtomatik JPEG-ə çevrilir, sıxılır (85%, max 1280 px)",
              "Logo, su nişanı, reklam başlıqlı şəkillər qəbul edilmir",
              "Avtomobilin daxili, kuzov, mühərrik, altlıq şəkilləri yerləşdirmək güvəni artırır"
            ]} />
          </Section>

          <Section id="duplicate-rule" title="5. Dublikat elan qaydası (90 gün)">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="font-semibold text-amber-900">90 günlük dublikat qaydası</p>
              <p className="mt-2 text-sm text-amber-800 leading-relaxed">
                Eyni VIN nömrəsinə məxsus avtomobil üçün son 90 gün ərzində artıq elan
                yerləşdirilmişsə, yeni elan avtomatik bloklanır. 90 gün dolduqdan sonra həmin
                avtomobil üçün yeni elan açmaq mümkündür.
              </p>
            </div>
            <p className="text-sm">Bu qayda nə üçün var?</p>
            <RuleList items={[
              "Eyni avtomobilin birdən çox aktiv elanı alıcıları çaşdırır",
              "Koordinasiyalı qiymət manipulyasiyasının qarşısını alır",
              "Axtarış nəticələrinin keyfiyyətini qoruyur"
            ]} />
            <p className="text-sm">
              VIN-siz elanlar (VIN daxil edilmədikdə) üçün eyni istifadəçinin bir avtomobil modeli/ili
              kombinasiyası üçün eyni anda yalnız 1 aktiv elanı ola bilər.
            </p>
          </Section>

          <Section id="paid-services-rules" title="6. Ödənişli xidmətlər qaydası">
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Elan planları (Standart / VIP)</p>
                <RuleList items={[
                  "Hər elan üçün ayrıca bir dəfəlik ödəniş — qiymət avtomobilin elan qiymətinə görə dəyişir",
                  "Pulsuz plan: eyni anda yalnız 1 aktiv pulsuz elan (fərdi istifadəçi üçün)",
                  "Ödənişli planlar (Standart, VIP): eyni anda limitsiz sayda aktiv ola bilər",
                  "Plan aktivləşdikdən sonra geri qaytarılmır (texniki nasazlıq istisna)"
                ]} />
              </div>
              <div className="rounded-lg border border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Boost xidmətləri (İrəli çək / VIP / Premium)</p>
                <RuleList items={[
                  "Elan planından ayrıca satın alınır — istənilən plana əlavə edilə bilər",
                  "Xidmət aktivləşdikdən sonra ləğv edilə bilməz, geri qaytarılmır",
                  "Müddətli paketlər vaxt dolduqda avtomatik dayandırılır, uzadılmır",
                  "Salon / mağaza abunəsindəki boost kreditləri aylıq yenilənir, keçmir"
                ]} />
              </div>
              <div className="rounded-lg border border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Biznes abunəliyi (Salon / Mağaza)</p>
                <RuleList items={[
                  "Abunəlik aktiv olmadan biznes hesabı elan yerləşdirə bilməz",
                  "Aylıq abunəlik hər ay eyni tarixdə yenilənir",
                  "Abunəlik ləğv edildikdə aktiv elanlar mövcud dövrün sonuna qədər görünür",
                  "Keçmiş dövrə görə ödəniş geri qaytarılmır"
                ]} />
              </div>
            </div>
          </Section>

          <Section id="business-rules" title="7. Biznes hesabları üçün əlavə qaydalar">
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
              <p className="font-semibold">Biznes üçün pulsuz plan mövcud deyil</p>
              <p className="mt-1">
                Avtomobil salonları və ehtiyat hissə mağazaları kommersiya subyektlərdir.
                Aktiv olmaq üçün ödənişli abunə planı seçilməlidir.
              </p>
            </div>
            <RuleList items={[
              "Biznes hesabları VÖEN ilə qeydiyyatdan keçməlidir",
              "Elan məlumatları şirkətin real inventarını əks etdirməlidir",
              "Salon inventarında olmayan avtomobil elan edilə bilməz",
              "CSV toplu yüklənmədə eyni VIN-in 90 günlük dublikat qaydası tətbiq olunur",
              "Salon planında mövcud olan boost kreditlərindən başqa əlavə boost da alına bilər",
              "Filial idarəetməsi yalnız Enterprise planında mövcuddur; hər filial ayrıca hesab ola bilməz"
            ]} />
          </Section>

          <Section id="prohibited" title="8. Qadağan olunan fəaliyyətlər">
            <div className="space-y-4">
              {[
                {
                  title: "Saxtakarlıq",
                  items: [
                    "Saxta yürüş, texniki vəziyyət, komplektasiya məlumatı vermək",
                    "Qəza, su basması, struktur hasarını gizlətmək",
                    "Başqasına məxsus avtomobili öz adından elan etmək",
                    "VIN nömrəsini dəyişdirilmiş avtomobilin satışı"
                  ]
                },
                {
                  title: "Hesab manipulyasiyası",
                  items: [
                    "Bir şəxs üçün birdən çox hesab açmaq",
                    "Bloklanmış hesabı əvəzləmək üçün yeni hesab açmaq",
                    "Bot, makro, scraper ilə avtomatik elan yerləşdirmək"
                  ]
                },
                {
                  title: "Elan manipulyasiyası",
                  items: [
                    "Eyni avtomobil üçün 90 gün ərzində birdən çox elan açmaq",
                    "Satılmış avtomobili aktiv elanda saxlamaq",
                    "Süni qiymət artırma-azaltma ilə bildirim toplamaq",
                    "Auksionlarda koordinasiyalı saxta bid (shill bidding)"
                  ]
                },
                {
                  title: "Qeyri-qanuni fəaliyyət",
                  items: [
                    "Oğurlanmış, girov altında, mülkiyyəti mübahisəli avtomobilin satışı",
                    "Pul yuyulması, vergidən yayınma məqsədli tranzaksiyalar",
                    "Digər istifadəçilərə təhdid, şantaj, zorbalıq"
                  ]
                }
              ].map((group) => (
                <div key={group.title} className="rounded-lg border border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">{group.title}</p>
                  <RuleList items={group.items} />
                </div>
              ))}
            </div>
          </Section>

          <Section id="moderation" title="9. Moderasiya və şikayət">
            <p>
              EkoMobil elanları moderasiya edir. Moderasiya aşağıdakı üsullarla baş verir:
            </p>
            <RuleList items={[
              "Avtomatik aşkarlama: dublikat VIN, qadağalı açar söz, bot aktivliyi",
              "İnsan moderasiyası: şikayət daxil olan elanlar, şübhəli aktivlik",
              "İstifadəçi şikayəti: hər elanda 'Şikayət et' düyməsi mövcuddur"
            ]} />
            <p className="text-sm">
              Moderasiya qərarına etiraz üçün{" "}
              <a href="mailto:info@ekomobil.az" className="text-[#0891B2] hover:underline">
                info@ekomobil.az
              </a>{" "}
              ünvanına yazın. İlkin cavab müddəti 2 iş günü, əsaslı etirazların yekun baxışı 5 iş günü ərzində tamamlanır.
            </p>
          </Section>

          <Section id="sanctions" title="10. İntizam tədbirləri">
            <p>
              Qaydaların pozulması aşağıdakı tədbirləri tətbiq etdirə bilər (pozuntunun ağırlığına görə):
            </p>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-4 py-3 font-semibold">Sanksiya</th>
                    <th className="px-4 py-3 font-semibold">Tətbiq şərtləri</th>
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">Geri qaytarma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    {
                      sanction: "Xəbərdarlıq",
                      condition: "İlk / yüngül pozuntu",
                      refund: "—"
                    },
                    {
                      sanction: "Elanın düzəldilməsi tələbi",
                      condition: "Natamam/yanıltıcı məlumat",
                      refund: "—"
                    },
                    {
                      sanction: "Elanın silinməsi",
                      condition: "Qayda pozuntusu aşkar edildi",
                      refund: "Ödəniş geri verilmir"
                    },
                    {
                      sanction: "Müvəqqəti blok (7–30 gün)",
                      condition: "Təkrarlanan pozuntu",
                      refund: "Aktiv planlar blok müddətindən uzadılır"
                    },
                    {
                      sanction: "Hesabın dayandırılması (30–90 gün)",
                      condition: "Ağır/sistemli pozuntu",
                      refund: "Abunəlik ödənişi geri verilmir"
                    },
                    {
                      sanction: "Daimi ban",
                      condition: "Fırıldaqçılıq, saxta VIN, qanun pozuntusu",
                      refund: "Heç bir geri qaytarma yoxdur"
                    }
                  ].map((row) => (
                    <tr key={row.sanction} className="align-top">
                      <td className="px-4 py-3 font-medium text-slate-800">{row.sanction}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{row.condition}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">{row.refund}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm">
              EkoMobil ağır hallarda hüquq-mühafizə orqanlarına müraciət etmək hüququnu özündə saxlayır.
            </p>
            <p className="text-sm">
              Ödənişə təsir edən intizam qərarlarında istifadəçi 5 iş günü ərzində apellyasiya edə bilər. Ətraflı qaydalar{" "}
              <Link href="/refund-policy" className="text-[#0891B2] hover:underline">Refund və cərimə siyasəti</Link>{" "}
              sənədində göstərilir.
            </p>
          </Section>

          <Section id="auction-link" title="11. Auksion qaydaları">
            <p>
              Canlı hərracın öhdəlik cədvəli, satıcı/alıcı axını, cərimə strukturu ayrıca sənəddə
              verilmişdir:
            </p>
            <Link
              href="/rules/auction"
              className="inline-flex items-center gap-2 rounded-xl border border-[#0891B2]/30 bg-[#0891B2]/5 px-5 py-3 text-sm font-semibold text-[#0891B2] transition hover:bg-[#0891B2]/10"
            >
              Auksion çərçivəsi sənədinə keç
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </Section>

          <Section id="legal-links" title="12. Hüquqi sənədlər">
            <p className="text-sm text-slate-500">Bu qaydalar aşağıdakı sənədlərlə tamamlanır:</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                {
                  href: "/terms",
                  title: "İstifadəçi Razılaşması",
                  desc: "Tərəflər, öhdəliklər, ödəniş şərtləri, mübahisə həlli"
                },
                {
                  href: "/privacy",
                  title: "Məxfilik Siyasəti",
                  desc: "Toplanan məlumatlar, istifadəsi, istifadəçi hüquqları"
                },
                {
                  href: "/pricing",
                  title: "Qiymət cədvəli",
                  desc: "Elan, boost, salon, mağaza plan qiymətləri"
                },
                {
                  href: "/refund-policy",
                  title: "Refund siyasəti",
                  desc: "Geri qaytarma, intizam ödənişləri və apellyasiya proseduru"
                },
                {
                  href: "/rules/auction",
                  title: "Auksion çərçivəsi",
                  desc: "Canlı hərrac öhdəlikləri, cərimə strukturu"
                }
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-[#0891B2]/40 hover:bg-white"
                >
                  <span className="text-sm font-semibold text-[#0891B2]">{item.title}</span>
                  <span className="mt-0.5 text-xs text-slate-500">{item.desc}</span>
                </Link>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
