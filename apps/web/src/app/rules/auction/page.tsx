import Link from "next/link";
import { getNoShowPenaltyAzn, getSellerBreachPenaltyAzn } from "@/lib/auction-fees";

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
        Auksion üçün əsas qaydalar.
      </p>

      <div className="mt-8 space-y-10 text-slate-700 leading-relaxed">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Platformanın rolu və məsuliyyətin həddi</h2>
          <p className="mt-3">
            EkoMobil auksion üçün texniki sistemi verir: lot, təkliflər, bildirişlər və platforma haqqı ödəniş linkləri.
            Avtomobilin və ya hissənin əsas satış pulu platformadan keçmir.
          </p>
          <p className="mt-3">
            Elan və lot üzrə təqdim edilən bütün məlumatların düzgünlüyü satıcının məsuliyyətindədir. Platforma
            məlumatların yerləşdirilməsi və yayımlanması üçün imkan yaradır; müstəqil ekspert rəyi və ya hüquqi zəmanət
            vermir.
          </p>
          <p className="mt-3">
            EkoMobil alqı-satqının tərəfi, escrow xidməti və ya texniki ekspertiza qərarı verən qurum deyil. Nəqliyyat
            vasitəsinin faktiki keyfiyyəti, gizli qüsurlar və yekun alış qərarı tərəflərin və cəlb etdikləri ekspertiza
            mərkəzlərinin məsuliyyətindədir.
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
            <li>Elan hazır olur: avtomobildə VIN + satıcı + media, hissədə satıcı + media.</li>
            <li>Lot parametrləri seçilir (başlanğıc qiymət, vaxt, istəyə görə rezerv/deposit).</li>
            <li>Lot haqqı ödənir və lot canlıya çıxır.</li>
            <li>Auksion bitəndən sonra nəticə təsdiq edilir.</li>
          </ol>
          <p className="mt-3 text-sm text-slate-600">
            Qeyd: ayrıca &quot;sorğu topla sonra auksionu başlat&quot; mərhələsi məcburi deyil. Satıcı birbaşa lot yarada bilər; alıcı
            iştirak etməzsə lot satışsız bağlanır və yalnız lot haqqı tətbiq olunur.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Təklif vermə (alıcı)</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Tələb olunan doğrulamalar tamamlanır (məsələn telefon/deposit).</li>
            <li>Təklif verilir və qaydalar qəbul edilir.</li>
            <li>Saxta və manipulyativ təklif qadağandır.</li>
            <li>Qalib olduqda əsas ödəniş satıcıya birbaşa edilir.</li>
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
              <strong>Alıcı öhdəliyinin pozulması:</strong> qalib alıcı öhdəliyini yerinə yetirmədikdə satıcı
              bunu qeydə ala bilər; platforma alıcı öhdəlik haqqı (hissə üçün {getNoShowPenaltyAzn("part")} ₼,
              avtomobil üçün {getNoShowPenaltyAzn("vehicle")} ₼) üzrə checkout axını təsdiq ekranından başladılır.
              EkoMobil öhdəlik pozuntularına qarşı sıfır tolerans mövqeyini saxlayır.
            </li>
            <li>
              <strong>Satıcı öhdəliyinin pozulması:</strong> qalib alıcı satıcının satışı rədd etdiyini və ya
              öhdəliyini pozduğunu qeydə ala bilər; platforma satıcı öhdəlik haqqı (hissə üçün {getSellerBreachPenaltyAzn("part")} ₼,
              avtomobil üçün {getSellerBreachPenaltyAzn("vehicle")} ₼) üçün checkout yaradılır — ödənişi satıcı
              etməlidir. EkoMobil hər iki tərəfin öhdəliyini eyni şəkildə qoruyur.
            </li>
            <li>
              <strong>Mübahisə:</strong> tərəflərdən biri mübahisə bildirdikdə iş ops/hüquq proseduruna keçə bilər; platforma
              məhkəmə və ya arbitraj əvəzi deyil.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Sənədlər</h2>
          <p className="mt-3">
            Tələb olunan sənədləri satıcı yükləyir və təqdim edir. Platforma sənədlərin paylaşılması və yayımlanması üçün
            texniki imkan verir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Ekspertiza və rəsmi servis tərəfdaşları</h2>
          <p className="mt-3">
            Platformada ekspertiza şirkətləri və rəsmi servis mərkəzləri qeydiyyatdan keçib öz yoxlama xidmətlərini
            təqdim edə bilər. Bu tərəfdaşlıq etibarlılığı artırmaq üçündür; konkret diaqnostika nəticəsinin hüquqi
            məsuliyyəti həmin xidmət göstərən mərkəzə aiddir.
          </p>
          <p className="mt-3">
            Tərəfdaş müraciəti üçün{" "}
            <Link href="/partners/inspection" className="text-[#0891B2] hover:underline">
              ekspertiza tərəfdaşlığı səhifəsinə
            </Link>{" "}
            keçid edə bilərsiniz.
          </p>
        </section>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link href="/auction" className="btn-primary">Auksiona bax</Link>
      </div>
    </div>
  );
}
