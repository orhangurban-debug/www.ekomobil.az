import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Refund və cərimə siyasəti | EkoMobil",
  description: "EkoMobil platformasında geri qaytarma, texniki nasazlıq kompensasiyası və cərimə mübahisə qaydaları"
};

const EFFECTIVE_DATE = "28 aprel 2026";
const CONTACT_EMAIL = "info@ekomobil.az";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}

export default function RefundPolicyPage() {
  return (
    <div className="bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Refund və cərimə siyasəti</h1>
        <p className="mt-2 text-slate-500">Son yenilənmə: {EFFECTIVE_DATE}</p>
        <p className="mt-1 text-sm text-slate-400">
          Bu sənəd ödənişlərin geri qaytarılması, kompensasiya və intizam ödənişləri üzrə vahid qaydanı müəyyən edir.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <Section id="scope" title="1. Tətbiq dairəsi">
            <p>
              Bu siyasət EkoMobil platformasında alınan xidmətlərə tətbiq edilir: elan planları, boost paketləri,
              biznes abunəlikləri və auksion üzrə intizam ödənişləri.
            </p>
            <p>
              Kart məlumatları EkoMobil tərəfindən saxlanmır. Ödəniş emalı bank/prosessor tərəfindən aparılır.
            </p>
          </Section>

          <Section id="listing-plans" title="2. Elan planları üzrə qayda">
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>Elan uğurla aktivləşibsə, plan ödənişi geri qaytarılmır.</li>
              <li>Elan platforma texniki xətası səbəbindən aktivləşməyibsə, geri qaytarma və ya kredit tətbiq edilir.</li>
              <li>Texniki nasazlıq iddiası hadisədən sonra 7 iş günü ərzində təqdim olunmalıdır.</li>
            </ul>
          </Section>

          <Section id="boost" title="3. Boost xidmətləri üzrə qayda">
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>Boost (İrəli çək/VIP/Premium) aktivləşdikdən sonra geri qaytarılmır.</li>
              <li>Boost texniki səbəblə aktivləşməyibsə, bərpa aktivasiya və ya kredit tətbiq edilir.</li>
              <li>Müddət dolduqdan sonra istifadə olunmayan hissə üçün proporsional refund tətbiq edilmir.</li>
            </ul>
          </Section>

          <Section id="business-subscription" title="4. Biznes abunəliyi üzrə qayda">
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>Başlanmış cari ay üçün ödəniş geri qaytarılmır.</li>
              <li>Ləğv edildikdə növbəti dövr üçün yenilənmə dayandırılır.</li>
              <li>Platforma texniki nasazlığı ilə sübut olunmuş kəsinti halında kredit və ya qismən kompensasiya tətbiq edilə bilər.</li>
            </ul>
          </Section>

          <Section id="auction-penalties" title="5. Auksion intizam ödənişləri">
            <p>
              Auksion no-show və seller-breach ödənişləri intizam mexanizmidir, avtomobilin satış qiyməti deyil.
              Bu ödənişlər yalnız qayda pozuntusu təsdiqləndikdə tətbiq olunur.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>Sorğu üçün minimum sübut: lot ID, tərəf yazışması/sistem logu, hadisə vaxtı.</li>
              <li>İlkin baxış: 2 iş günü, yekun qərar: 10 iş günü.</li>
              <li>Qərardan sonra 5 iş günü ərzində apellyasiya mümkündür; apellyasiya cavabı 10 iş günü ərzində verilir.</li>
            </ul>
          </Section>

          <Section id="dispute" title="6. Mübahisə və müraciət proseduru">
            <p>
              Refund və cərimə mübahisələri üçün sorğunu{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#0891B2] hover:underline">{CONTACT_EMAIL}</a>{" "}
              ünvanına və ya platformadakı dəstək forması vasitəsilə göndərin.
            </p>
            <p>
              Sorğuda əməliyyat ID-si, tarix, hadisə təsviri və mövcud sübutlar göstərilməlidir. Natamam sorğular
              əlavə informasiya tələb edilənə qədər gözləməyə keçirilə bilər.
            </p>
          </Section>
        </div>

        <div className="mt-16 flex flex-wrap gap-4 border-t border-slate-200 pt-8 text-sm">
          <Link href="/terms" className="text-[#0891B2] hover:underline">İstifadəçi Razılaşması</Link>
          <Link href="/rules" className="text-[#0891B2] hover:underline">Platforma Qaydaları</Link>
          <Link href="/pricing" className="text-[#0891B2] hover:underline">Qiymətlər</Link>
        </div>
      </div>
    </div>
  );
}
