import Link from "next/link";
import { AUCTION_FEES } from "@/lib/auction-fees";

export const metadata = {
  title: "Auksion çərçivəsi | EkoMobil",
  description: "EkoMobil auksionunda satıcı və alıcı öhdəlikləri, mərhələli quruluş və platforma rolu"
};

export default function AuctionFrameworkPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <nav className="mb-8 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Ana səhifə
        </Link>
        <span className="mx-2">/</span>
        <Link href="/rules" className="hover:text-slate-900">
          Qaydalar
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Auksion çərçivəsi</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900">Auksion çərçivəsi</h1>
      <p className="mt-2 text-slate-500">
        Bu sənəd auksion iştirakçıları üçün öhdəlikləri və platformanın rolunu aydınlaşdırır. Hüquqi mətnlər üçün həmçinin{" "}
        <Link href="/terms" className="text-[#0891B2] hover:underline">
          istifadəçi şərtləri
        </Link>{" "}
        və{" "}
        <Link href="/pricing#auction" className="text-[#0891B2] hover:underline">
          qiymətlər
        </Link>{" "}
        bölməsinə baxın.
      </p>

      <div className="mt-8 space-y-10 text-slate-700 leading-relaxed">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Platformanın rolu və məsuliyyətin həddi</h2>
          <p className="mt-3">
            EkoMobil auksionda <strong>texniki infrastruktur</strong> (elan/lot, təklif emalı, bildirişlər, ödəniş linkləri
            üzrə platforma xidmət haqları) təqdim edir. Avtomobilin əsas alış məbləği platformada saxlanmır, saxlanılmır və
            tərəflər arasında bölüşdürülmür.
          </p>
          <p className="mt-3">
            Alıcı ilə satıcı arasında bağlanan hər hansı razılaşma birbaşa onların öhdəliyindədir. Platforma bu razılaşmanın
            icrasına, avtomobilin vəziyyətinə, ödənişin vaxtında edilməsinə və ya mübahisələrə görə{" "}
            <strong>məsuliyyət daşımır</strong>. Moderasiya, trust siqnalları və ops baxışı kömək xarakteri daşıyır, tam
            zəmanət deyil.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Avtomobil və avtomobil hissələri</h2>
          <p className="mt-3">
            Eyni auksion modulu həm tam avtomobil, həm də <strong>avtomobil hissəsi</strong> elanları üçün istifadə oluna
            bilər. Avtomobil üçün VIN doğrulaması tələb olunur; hissə üçün VIN tətbiq olunmur — satıcı doğrulaması və
            (hissəyə uyğun) media checklist kifayətdir.             Hissə elanı API ilə{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">listingKind: &quot;part&quot;</code> göndərilməklə
            yaradılır; veb üzərindən də eyni axın mövcuddur (lot yaradarkən uyğun elan növü seçilir).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Lot yaratma axını (satıcı)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            <li>
              Standart elan yaradılır: tam avtomobil üçün VIN, satıcı və media yoxlamaları; hissə üçün satıcı + media.
            </li>
            <li>Lot parametrləri (başlanğıc, rezerv, vaxt, opsional bidder deposit) təyin edilir.</li>
            <li>Satıcı öhdəlik bəndlərini qəbul edir və lot haqqı ödənilir; moderasiya/aktivasiya qaydalarına uyğun olaraq lot canlıya çıxır.</li>
            <li>Hərrac bitdikdən sonra satıcı qalib alıcı ilə off-platform satış addımlarını razılaşdırır və təsdiq ekranında nəticəni qeyd edir.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Təklif vermə (alıcı)</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Hesab və lot üçün tələb olunan doğrulamalar (məsələn telefon, deposit) yerinə yetirilməlidir.</li>
            <li>Təklif vermə auksion qaydalarının və şərtlərin qəbulu ilə bağlıdır.</li>
            <li>Saxta və ya manipulyativ təklif qadağandır; hesab məhdudlaşdırıla bilər.</li>
            <li>Qalib olduqda razılaşdırılmış çərçivədə satıcı ilə əlaqə və əsas ödəniş off-platform aparılmalıdır.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Əsas satışdan imtina və intizam ödənişləri</h2>
          <p className="mt-3">
            Aşağıdakı məbləğlər <strong>platforma xidmət/intizam haqlarıdır</strong>, avtomobilin qiyməti deyil. Dəqiq rəqəmlər{" "}
            <Link href="/pricing#auction" className="text-[#0891B2] hover:underline">
              qiymətlər səhifəsində
            </Link>{" "}
            göstərilir.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Alıcı no-show:</strong> qalib alıcı müəyyən edilmiş davranışı pozduqda satıcı no-show bildirişi edə bilər;
              platforma no-show cəriməsi ({AUCTION_FEES.NO_SHOW_PENALTY_AZN} ₼) üzrə ödəniş axını təsdiq ekranından başladılır.
            </li>
            <li>
              <strong>Satıcı öhdəliyinin pozulması:</strong> qalib alıcı satıcının satışı rədd etdiyini və ya öhdəliyini pozduğunu
              qeyd edə bilər; status yenilənir və satıcıya aid platforma cəriməsi ({AUCTION_FEES.SELLER_BREACH_PENALTY_AZN} ₼)
              üçün checkout təsdiq ekranından yaradılır (ödənişi satıcı etməlidir).
            </li>
            <li>
              <strong>Mübahisə:</strong> tərəflərdən biri mübahisə bildirdikdə iş ops/hüquq proseduruna keçə bilər; platforma
              məhkəmə və ya arbitraj əvəzi deyil.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Sənədlər: satıcı yükləyir, platforma yoxlayır</h2>
          <p className="mt-3">
            Peşəkar marketplace və beynəlxalq auksion praktikasında norma belədir: <strong>tələb olunan sənədləri satıcı özü
            təqdim edir</strong> (şəxsiyyət və ya şirkət sübutu, mülkiyyətə dair sənədlər, razılıq formaları və s. — hüquq
            şablonunu siz təsdiqləyəndən sonra siyahı dəqiqləşir). Platforma bu sənədləri <strong>yığmır və əvəzinə göndərmir</strong>
            — əks halda əməliyyat xərci, məxfilik riski və məsuliyyət bulanığıqlaşır.
          </p>
          <p className="mt-3">
            EkoMobil tərəfi: sənədlərin <strong>təhlükəsiz yüklənməsi</strong>, saxlanması (şifrəli obyekt saxlama),{" "}
            <strong>moderasiya/ops təsdiqi</strong>, avtomatik yoxlamalar (məsələn VIN sorğusu) və lotun aktivləşməsi üçün
            qaydalar. İstəyə bağlı olaraq yüksək dəyərli lotlar üçün <strong>“concierge”</strong> paketində əməkdaş təlimat
            verə bilər, amma sənədin mənbəyi yenə də satıcı olmalıdır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Mərhələli inkişaf xəritəsi</h2>
          <div className="mt-4 space-y-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <h3 className="font-semibold text-emerald-900">Mərhələ 1 — hazırda (tətbiq olunur)</h3>
              <p className="mt-2 text-sm text-emerald-900/90">
                Aydın məsuliyyət mətnləri (/terms, bu səhifə), satıcı lot formunda və alıcı təklifdə etiraf qutuları, simmetrik
                nəticə statusları (no-show, satıcı pozuntusu, mübahisə), hər iki intizam ödənişi üçün təsdiq ekranından checkout
                axını, lot sənəd vault (satıcı yükləyir, ops təsdiq/rədd; prod-da Vercel Blob), ops konsolda review siyahısı və
                açıq case-lər.
              </p>
            </div>
            <div className="rounded-xl border border-[#0891B2]/25 bg-[#0891B2]/5 p-4">
              <h3 className="font-semibold text-slate-900">Mərhələ 2 — növbəti (aktiv inkişaf)</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                <li>SLA taymerləri və avtomatik xatırlatmalar (cron + ops audit) — təsdiq və intizam ödənişi addımları üçün.</li>
                <li>Mübahisə kartında sübut yükləmə (tərəflər və ops üçün) — tətbiq olunur.</li>
                <li>Yüksək dəyərli lotlar üçün satıcı performans bond + deep KYC axını — tətbiq olunur (ops review ilə).</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-900">Mərhələ 3 — strateji (biznes qərarı ilə)</h3>
              <p className="mt-2 text-sm text-slate-600">
                Əsas məbləğ üçün escrow və ya sənədləşdirilmiş təhvil tərəfdaşlığı, sığorta/ekspertiza paketləri — yalnız ayrıca
                hüquqi və maliyyə modeli təsdiqləndikdən sonra.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link href="/auction" className="btn-primary">
          Auksiona bax
        </Link>
        <Link href="/auction/sell" className="btn-secondary">
          Lot yarat
        </Link>
        <Link href="/rules" className="btn-secondary">
          Ümumi qaydalar
        </Link>
      </div>
    </div>
  );
}
