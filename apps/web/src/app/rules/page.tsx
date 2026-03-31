import Link from "next/link";

export const metadata = {
  title: "Qaydalar | EkoMobil",
  description: "EkoMobil platformasının elan və istifadə qaydaları"
};

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <nav className="mb-8 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">Ana səhifə</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Qaydalar</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900">Platforma qaydaları</h1>
      <p className="mt-2 text-slate-500">Qısa və əsas qaydalar.</p>

      <div className="mt-10 space-y-8 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">Platforma statusu</h2>
          <p className="mt-3">
            EkoMobil avtomobil satıcısı deyil. Platforma yalnız elan, auksion infrastrukturu, trust siqnalları,
            əlaqə və moderasiya imkanları təqdim edir. Avtomobilin əsas satış ödənişi və təhvil-təslim prosesi
            alıcı ilə satıcı arasında birbaşa tamamlanır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Elan dərc qaydaları</h2>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>Hər elan üçün unikal VIN kodu tələb olunur</li>
            <li>Yürüş real və yoxlanıla bilən olmalıdır</li>
            <li>Şəkillər avtomobilin faktiki vəziyyətini əks etməlidir</li>
            <li>Qiymət manat (₼) ilə göstərilməlidir</li>
            <li>Eyni avtomobil üçün təkrarlanan elanlar qadağandır</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Auksion qaydaları</h2>
          <p className="mt-3">
            Ətraflı öhdəlik cədvəli, mərhələli inkişaf planı və platforma məsuliyyətinin həddi üçün{" "}
            <Link href="/rules/auction" className="font-medium text-[#0891B2] hover:underline">
              Auksion çərçivəsi
            </Link>{" "}
            səhifəsinə baxın.
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>Lot yalnız yoxlamadan sonra canlıya çıxır.</li>
            <li>Təklif üçün hesab doğrulaması tələb oluna bilər.</li>
            <li>Əsas ödəniş platformadan keçmir; birbaşa satıcıya ödənilir.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Qadağan olunanlar</h2>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>Saxta və ya aldadıcı məlumat</li>
            <li>Başqasının şəkillərinin icazəsiz istifadəsi</li>
            <li>Spam və təkrarlanan mesajlar</li>
            <li>Qeyri-qanuni məzmun</li>
            <li>Saxta bid, qiymət şişirtmək məqsədli hesablar və koordinasiyalı manipulyasiya</li>
          </ul>
        </section>

      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link href="/rules/auction" className="btn-primary">Auksion qaydaları</Link>
      </div>
    </div>
  );
}
