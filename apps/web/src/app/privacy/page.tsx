import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Məxfilik Siyasəti | EkoMobil",
  description: "EkoMobil platformasının məxfilik siyasəti — hansı məlumatlar toplanır, necə istifadə olunur"
};

const EFFECTIVE_DATE = "1 may 2025";
const COMPANY_EMAIL = "privacy@ekomobil.az";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}

function DataTable({ rows }: { rows: { category: string; examples: string; purpose: string }[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
            <th className="px-4 py-3 font-semibold">Kateqoriya</th>
            <th className="px-4 py-3 font-semibold">Nümunələr</th>
            <th className="px-4 py-3 font-semibold hidden sm:table-cell">Məqsəd</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.category} className="align-top">
              <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{row.category}</td>
              <td className="px-4 py-3 text-slate-600">{row.examples}</td>
              <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{row.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Məxfilik Siyasəti</h1>
        <p className="mt-2 text-slate-500">Son yenilənmə: {EFFECTIVE_DATE}</p>
        <p className="mt-1 text-sm text-slate-400">
          Məlumatlarınızın necə toplandığını, istifadə edildiyini və qorunduğunu izah edir.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Quick nav */}
        <nav className="mb-12 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Mündəricat</p>
          <ol className="space-y-1 text-sm text-[#0891B2]">
            {[
              { href: "#collection", label: "1. Hansı məlumatları toplayırıq?" },
              { href: "#use", label: "2. Məlumatları necə istifadə edirik?" },
              { href: "#sharing", label: "3. Məlumatları kimlərlə paylaşırıq?" },
              { href: "#retention", label: "4. Məlumatları nə qədər saxlayırıq?" },
              { href: "#cookies", label: "5. Çərəzlər (cookies) və izləmə" },
              { href: "#rights", label: "6. İstifadəçi hüquqları" },
              { href: "#security", label: "7. Məlumat təhlükəsizliyi" },
              { href: "#minors", label: "8. Uşaqların məxfiliyi" },
              { href: "#changes", label: "9. Siyasətin dəyişdirilməsi" },
              { href: "#contact", label: "10. Əlaqə" }
            ].map((item) => (
              <li key={item.href}>
                <a href={item.href} className="hover:underline">{item.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-12">

          <Section id="collection" title="1. Hansı məlumatları toplayırıq?">
            <p>
              EkoMobil aşağıdakı kateqoriyalarda məlumat toplayır:
            </p>
            <DataTable rows={[
              {
                category: "Hesab məlumatları",
                examples: "Ad, soyad, e-poçt, telefon, VÖEN (biznes), parol (hash)",
                purpose: "Hesab yaratma, doğrulama, əlaqə"
              },
              {
                category: "Elan məlumatları",
                examples: "Avtomobil məlumatları, şəkillər, qiymət, VIN, yürüş, şəhər",
                purpose: "Elan dərcetmə, axtarış indeksi"
              },
              {
                category: "Ödəniş məlumatları",
                examples: "Əməliyyat ID, məbləğ, tarix (kart detalları saxlanmır)",
                purpose: "Ödəniş tarixi, geri ödəmə prosesi"
              },
              {
                category: "Texniki məlumatlar",
                examples: "IP ünvanı, brauzer növü, cihaz, seans token",
                purpose: "Təhlükəsizlik, saxtakarlıq aşkarlanması"
              },
              {
                category: "İstifadə məlumatları",
                examples: "Baxılan səhifələr, axtarış sorğuları, klik axını",
                purpose: "UX təkmilləşdirmə, tövsiyə sistemi"
              },
              {
                category: "Kommunikasiya",
                examples: "Dəstək yazışmaları, bildirim tercihlər",
                purpose: "Müştəri xidməti"
              }
            ]} />
          </Section>

          <Section id="use" title="2. Məlumatları necə istifadə edirik?">
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li><strong>Xidmət göstərmək:</strong> Elan dərcetmə, axtarış, auksion, boost aktivləşmə</li>
              <li><strong>Hesabı idarə etmək:</strong> Giriş, parol sıfırlama, doğrulama bildirişləri</li>
              <li><strong>Saxtakarlığa qarşı:</strong> Dublikat hesab, spam, bot aktivliyinin aşkarlanması</li>
              <li><strong>Ödəniş prosesi:</strong> Tranzaksiya tarixçəsi, hesab-faktura göndərmə</li>
              <li><strong>Məhsul inkişafı:</strong> Axtarış davranışına görə UI təkmilləşdirmə</li>
              <li><strong>Hüquqi öhdəliklər:</strong> Vergi, audit, hüquq-mühafizə tələbləri</li>
              <li><strong>Bildirişlər:</strong> Elan baxış statistikası, plan bitim xəbərdarlığı, yeni mesaj (razılıqla)</li>
            </ul>
            <p className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
              Məlumatlarınızı üçüncü tərəf reklam şirkətlərinə <strong>satmırıq</strong>.
              Profilə əsaslanan reklam göstərmirik.
            </p>
          </Section>

          <Section id="sharing" title="3. Məlumatları kimlərlə paylaşırıq?">
            <p className="text-sm font-medium text-slate-700">Aşağıdakı hallarda məlumatlar paylaşıla bilər:</p>
            <div className="mt-3 space-y-3">
              {[
                {
                  who: "Texniki xidmət təminatçıları",
                  what: "Hosting, CDN, e-poçt göndərmə, ödəniş prosesoru — yalnız xidməti yerinə yetirmək üçün lazım olan həcmdə"
                },
                {
                  who: "Digər istifadəçilər",
                  what: "Elan məlumatları (ad/telefon) — yalnız elanda açıq göstərməyi seçdiyiniz məlumatlar"
                },
                {
                  who: "Hüquq-mühafizə orqanları",
                  what: "Qanuni tələb, məhkəmə qərarı və ya fövqəladə təhlükəsizlik hallarında"
                },
                {
                  who: "Biznesin ötürülməsi",
                  what: "EkoMobil-in birləşməsi, satışı, yenidən quruluşu halında — bu siyasət qüvvəsini saxlamaq şərtilə"
                }
              ].map((item) => (
                <div key={item.who} className="rounded-lg border border-slate-200 px-4 py-3 text-sm">
                  <p className="font-medium text-slate-800">{item.who}</p>
                  <p className="mt-1 text-slate-500">{item.what}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="retention" title="4. Məlumatları nə qədər saxlayırıq?">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-4 py-3 font-semibold">Məlumat növü</th>
                    <th className="px-4 py-3 font-semibold">Saxlama müddəti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { type: "Aktiv hesab məlumatları", duration: "Hesab aktiv olduğu müddətcə" },
                    { type: "Elan tarixi (arxivlənmiş)", duration: "3 il (hüquqi uyğunluq üçün)" },
                    { type: "Ödəniş əməliyyat qeydləri", duration: "7 il (vergi qanunvericiliyi)" },
                    { type: "Texniki log faylları (IP, seans)", duration: "90 gün" },
                    { type: "Dəstək yazışmaları", duration: "2 il" },
                    { type: "Silinmiş hesab məlumatları", duration: "30 gün (sonra tamamilə silinir)" }
                  ].map((row) => (
                    <tr key={row.type}>
                      <td className="px-4 py-3 text-slate-700">{row.type}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="cookies" title="5. Çərəzlər (cookies) və izləmə">
            <p>
              EkoMobil müəyyən çərəzlər istifadə edir. Onları funksional əhəmiyyətinə görə qruplaşdırırıq:
            </p>
            <div className="mt-4 space-y-3 text-sm">
              {[
                {
                  type: "Zəruri çərəzlər",
                  desc: "Giriş seansi, CSRF qoruması, dil seçimi. Bunlar olmadan sayt düzgün işləmir — deaktiv edilə bilməz.",
                  badge: "bg-slate-100 text-slate-700"
                },
                {
                  type: "Funksional çərəzlər",
                  desc: "Favori elanlar, son baxılan elanlar, axtarış filtrləri. Deaktiv edilə bilər — bəzi funksiyalar əlçatmaz olar.",
                  badge: "bg-blue-50 text-blue-700"
                },
                {
                  type: "Analitik çərəzlər",
                  desc: "Platforma istifadəsini anlamaq üçün anonimləşdirilmiş statistika. Deaktiv edilə bilər.",
                  badge: "bg-purple-50 text-purple-700"
                }
              ].map((item) => (
                <div key={item.type} className="flex items-start gap-3 rounded-lg border border-slate-200 px-4 py-3">
                  <span className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${item.badge}`}>
                    {item.type}
                  </span>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm">
              Brauzer parametrlərindən çərəzləri idarə edə bilərsiniz. Üçüncü tərəf izləmə pikseli
              və ya reklam şəbəkəsi çərəzi istifadə etmirik.
            </p>
          </Section>

          <Section id="rights" title="6. İstifadəçi hüquqları">
            <p>Məlumatlarınıza dair aşağıdakı hüquqlara sahibsiniz:</p>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li><strong>Giriş hüququ:</strong> Platformada saxladığımız məlumatlarınızın surətini tələb edə bilərsiniz</li>
              <li><strong>Düzəliş hüququ:</strong> Yanlış məlumatları düzəltməyi tələb edə bilərsiniz</li>
              <li><strong>Silinmə hüququ:</strong> Hesabınızı silməyi tələb edə bilərsiniz; hüquqi öhdəlik doğuran məlumatlar istisnadır</li>
              <li><strong>Ötürmə hüququ:</strong> Elan məlumatlarınızı maşın oxunabilir formatda (JSON/CSV) ixrac edə bilərsiniz</li>
              <li><strong>Etiraz hüququ:</strong> Analitik məqsədli emaldan imtina edə bilərsiniz</li>
              <li><strong>Şikayət hüququ:</strong> Azərbaycan Respublikasının müvafiq dövlət orqanına şikayət vermək hüququnuz var</li>
            </ul>
            <p className="text-sm">
              Hüquqlarınızı həyata keçirmək üçün{" "}
              <a href={`mailto:${COMPANY_EMAIL}`} className="text-[#0891B2] hover:underline">{COMPANY_EMAIL}</a>{" "}
              ünvanına yazın. 30 iş günü ərzində cavablandırılır.
            </p>
          </Section>

          <Section id="security" title="7. Məlumat təhlükəsizliyi">
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>Bütün məlumat ötürülməsi <strong>TLS/HTTPS</strong> ilə şifrələnir</li>
              <li>Parollar <strong>scrypt</strong> ilə hash-lənir, açıq mətn saxlanmır</li>
              <li>Kart məlumatları bizim serverlərə <strong>heç vaxt düşmür</strong> — prosessor tokenizasiyasından istifadə olunur</li>
              <li>Daxili giriş məhdudlaşdırılmış rol əsaslı hüquqlarla idarə olunur</li>
              <li>Şübhəli aktivlik avtomatik aşkarlanır və bloklanır</li>
            </ul>
            <p className="text-sm">
              Məlumat pozuntusu baş verərsə, qanunvericiliyin tələb etdiyi müddət ərzində (72 saat) istifadəçilər
              məlumatlandırılacaq.
            </p>
          </Section>

          <Section id="minors" title="8. Uşaqların məxfiliyi">
            <p>
              EkoMobil 18 yaşdan kiçik şəxslərə xidmət göstərmir. Uşağın məlumatlarını bilərəkdən
              toplamırıq. Belə məlumatla rastlaşsaq, dərhal silirik. Şübhəniz varsa{" "}
              <a href={`mailto:${COMPANY_EMAIL}`} className="text-[#0891B2] hover:underline">{COMPANY_EMAIL}</a>{" "}
              ünvanına yazın.
            </p>
          </Section>

          <Section id="changes" title="9. Siyasətin dəyişdirilməsi">
            <p>
              Bu siyasəti vaxtaşırı yeniləyə bilərik. Əhəmiyyətli dəyişikliklər baş versə, effektiv
              tarixdən ən azı <strong>14 gün əvvəl</strong> e-poçt bildirişi göndərəcəyik.
              Yuxarıdakı "Son yenilənmə" tarixi hər dəfə güncəllənir.
            </p>
          </Section>

          <Section id="contact" title="10. Əlaqə">
            <p>Məxfilik məsələləri üçün:</p>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm space-y-1">
              <p><strong>EkoMobil MMC — Məxfilik Məsul Şəxs</strong></p>
              <p>Bakı, Azərbaycan</p>
              <p>
                E-poçt:{" "}
                <a href={`mailto:${COMPANY_EMAIL}`} className="text-[#0891B2] hover:underline">{COMPANY_EMAIL}</a>
              </p>
              <p className="text-slate-400 text-xs">Cavab müddəti: 30 iş günü</p>
            </div>
          </Section>

        </div>

        {/* Footer links */}
        <div className="mt-16 flex flex-wrap gap-4 border-t border-slate-200 pt-8 text-sm">
          <Link href="/terms" className="text-[#0891B2] hover:underline">İstifadəçi Razılaşması</Link>
          <Link href="/rules" className="text-[#0891B2] hover:underline">Platforma Qaydaları</Link>
          <Link href="/pricing" className="text-[#0891B2] hover:underline">Qiymətlər</Link>
        </div>
      </div>
    </div>
  );
}
