import Link from "next/link";
import { LISTING_PLANS } from "@/lib/listing-plans";
import { DEALER_PLANS } from "@/lib/dealer-plans";
import { AUCTION_FEES } from "@/lib/auction-fees";

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function SectionHeader({ label, title, sub }: { label: string; title: string; sub: string }) {
  return (
    <div className="mb-10 text-center">
      <span className="inline-block rounded-full bg-[#0891B2]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#0891B2]">
        {label}
      </span>
      <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
      <p className="mt-2 text-slate-500">{sub}</p>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="bg-slate-50">
      {/* ─── Page hero ─────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white px-4 py-14 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Şəffaf qiymət siyasəti
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-500">
          Fərdi satıcıdan böyük salona qədər hər kəs üçün ədalətli plan.
          Gizli ödəniş yoxdur.
        </p>
        <nav className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-medium">
          {[
            { href: "#listings", label: "Elan planları" },
            { href: "#dealer", label: "Salon abunəsi" },
            { href: "#auction", label: "Auksion haqları" }
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-slate-600 transition hover:border-[#0891B2] hover:text-[#0891B2]"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-5xl space-y-20 px-4 py-16 sm:px-6 lg:px-8">

        {/* ─── 1. Listing plans ──────────────────────────────────────── */}
        <section id="listings" className="scroll-mt-20">
          <SectionHeader
            label="Fərdi & dealer elanları"
            title="Elan qiymət planları"
            sub="Elanınızı daha çox alıcıya çatdırmaq üçün plan seçin. Hər elan 30 gün aktivdir."
          />

          <div className="grid gap-5 sm:grid-cols-3">
            {LISTING_PLANS.map((plan) => {
              const isVip = plan.id === "vip";
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
                    isVip
                      ? "border-[#0891B2] shadow-[0_0_0_1px_rgba(8,145,178,0.4),0_8px_32px_rgba(8,145,178,0.12)]"
                      : "border-slate-200 shadow-sm"
                  }`}
                >
                  {isVip && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0891B2] px-3 py-1 text-xs font-bold text-white shadow">
                      Ən populyar
                    </span>
                  )}
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-slate-900">{plan.nameAz}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className={`text-3xl font-bold ${isVip ? "text-[#0891B2]" : "text-slate-900"}`}>
                        {plan.priceAzn === 0 ? "Pulsuz" : `${plan.priceAzn} ₼`}
                      </span>
                      {plan.priceAzn > 0 && (
                        <span className="text-sm text-slate-400">/ 30 gün</span>
                      )}
                    </div>
                  </div>

                  <ul className="flex-1 space-y-2.5 text-sm text-slate-600">
                    {plan.id === "free" && (
                      <>
                        <li className="flex items-center gap-2"><CheckIcon />Standart sıralanma</li>
                        <li className="flex items-center gap-2"><CheckIcon />30 gün aktiv</li>
                        <li className="flex items-center gap-2"><CheckIcon />Əsas axtarış görünüşü</li>
                      </>
                    )}
                    {plan.id === "standard" && (
                      <>
                        <li className="flex items-center gap-2"><CheckIcon />Vurğulanmış kart</li>
                        <li className="flex items-center gap-2"><CheckIcon />1.5× prioritet sıralama</li>
                        <li className="flex items-center gap-2"><CheckIcon />Baxış statistikası</li>
                        <li className="flex items-center gap-2"><CheckIcon />30 gün aktiv</li>
                      </>
                    )}
                    {plan.id === "vip" && (
                      <>
                        <li className="flex items-center gap-2"><CheckIcon />Ön səhifə üstünlüyü</li>
                        <li className="flex items-center gap-2"><CheckIcon />3× prioritet sıralama</li>
                        <li className="flex items-center gap-2"><CheckIcon />Vurğulanmış görünüş + ribbon</li>
                        <li className="flex items-center gap-2"><CheckIcon />Baxış & klik statistikası</li>
                        <li className="flex items-center gap-2"><CheckIcon />30 gün aktiv</li>
                      </>
                    )}
                  </ul>

                  <Link
                    href="/publish"
                    className={`mt-6 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                      plan.priceAzn === 0
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-[#0891B2] text-white hover:bg-[#0e7490]"
                    }`}
                  >
                    {plan.priceAzn === 0 ? "Pulsuz yerləşdir" : "Plan seç"}
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <strong className="text-slate-900">Mövcud elanı yüksəlt:</strong>{" "}
            Artıq yerləşdirdiyiniz elanı Standart və ya VIP plana keçirmək üçün{" "}
            <Link href="/me" className="font-medium text-[#0891B2] hover:underline">Profil panelinizə</Link>{" "}
            daxil olun.
          </div>
        </section>

        {/* ─── 2. Dealer plans ───────────────────────────────────────── */}
        <section id="dealer" className="scroll-mt-20">
          <SectionHeader
            label="Avtomobil salonları"
            title="Salon abunə planları"
            sub="Aylıq sabit ödəniş ilə bütün inventarınızı idarə edin. Elan boost-ları ayrıca hesablanır."
          />

          <div className="grid gap-5 sm:grid-cols-3">
            {DEALER_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
                  plan.highlight
                    ? "border-[#0891B2] shadow-[0_0_0_1px_rgba(8,145,178,0.4),0_8px_32px_rgba(8,145,178,0.12)]"
                    : "border-slate-200 shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0891B2] px-3 py-1 text-xs font-bold text-white shadow">
                    Ən populyar
                  </span>
                )}
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-slate-900">{plan.nameAz}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${plan.highlight ? "text-[#0891B2]" : "text-slate-900"}`}>
                      {plan.priceAzn === 0 ? "Pulsuz" : `${plan.priceAzn} ₼`}
                    </span>
                    {plan.priceAzn > 0 && (
                      <span className="text-sm text-slate-400">/ ay</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {plan.maxListings === null
                      ? "Limitsiz aktiv elan"
                      : `Aylıq ${plan.maxListings} aktiv elan`}
                  </p>
                </div>

                <ul className="flex-1 space-y-2.5 text-sm text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckIcon />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/dealer"
                  className={`mt-6 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                    plan.priceAzn === 0
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "bg-[#0891B2] text-white hover:bg-[#0e7490]"
                  }`}
                >
                  {plan.priceAzn === 0 ? "Pulsuz başla" : "Abunə ol"}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">Böyük şəbəkə üçün xüsusi qiymət?</p>
                <p className="mt-1 text-sm text-slate-500">50+ elanı olan salonlar üçün fərdi müqavilə hazırlayırıq.</p>
              </div>
              <Link href="mailto:info@ekomobil.az" className="btn-secondary text-sm whitespace-nowrap">
                Bizimlə əlaqə
              </Link>
            </div>
          </div>
        </section>

        {/* ─── 3. Auction fees ───────────────────────────────────────── */}
        <section id="auction" className="scroll-mt-20">
          <SectionHeader
            label="Canlı hərrac"
            title="Auksion haqq strukturu"
            sub="Şəffaf, ədalətli, əvvəlcədən bəlli qiymətlər. Gizli rüsum yoxdur."
          />

          <div className="mb-6 rounded-2xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-5 text-sm text-slate-700">
            EkoMobil avtomobilin əsas satış ödənişini qəbul etmir. Qalib alıcı avtomobilin tam məbləğini birbaşa
            satıcıya ödəyir. Aşağıdakı haqlar yalnız platforma xidmətlərinə aiddir.
          </div>

          {/* Fee cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: "Lot yerləşdirmə",
                value: `${AUCTION_FEES.LOT_LISTING_FEE_AZN} ₼`,
                who: "Satıcı ödəyir",
                desc: "VIN yoxlama + ekspertiza daxil",
                color: "bg-[#0891B2]/10 text-[#0891B2]"
              },
              {
                label: "Satış komisyonu",
                value: `${(AUCTION_FEES.SELLER_COMMISSION_RATE * 100).toFixed(1)}%`,
                who: "Satıcıdan — uğurlu satışda",
                desc: `Maksimum ${AUCTION_FEES.SELLER_COMMISSION_CAP_AZN} ₼`,
                color: "bg-emerald-500/10 text-emerald-700"
              },
              {
                label: "Alıcı premium",
                value: "Pulsuz",
                who: "Pilot mərhələdə 0%",
                desc: "Açıq beta dövründə alıcıdan rüsum alınmır",
                color: "bg-slate-100 text-slate-600"
              },
              {
                label: "No-show cəriməsi",
                value: `${AUCTION_FEES.NO_SHOW_PENALTY_AZN} ₼`,
                who: "Qalib alıcı — platforma intizam haqqı",
                desc: "Qaydalara uyğun no-show qeydindən sonra; depozit tətbiq olunarsa qaydalar üzrə hesablanır",
                color: "bg-rose-500/10 text-rose-600"
              },
              {
                label: "Satıcı pozuntusu",
                value: `${AUCTION_FEES.SELLER_BREACH_PENALTY_AZN} ₼`,
                who: "Satıcı — platforma intizam haqqı",
                desc: "Qalib alıcının satıcı öhdəliyinin pozulması bildirdiyi hallarda (əsas avtomobil qiyməti deyil)",
                color: "bg-amber-500/10 text-amber-800"
              }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${item.color}`}>
                  {item.label}
                </span>
                <div className="mt-3 text-2xl font-bold text-slate-900">{item.value}</div>
                <p className="mt-1 text-xs font-medium text-slate-600">{item.who}</p>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Example calculation */}
          <div className="mt-6 rounded-2xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-6">
            <h3 className="font-semibold text-slate-900">Nümunə hesab</h3>
            <p className="mt-1 text-sm text-slate-500">
              BMW X5 — satış qiyməti <strong>72,000 ₼</strong>
            </p>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              {[
                { label: "Lot yerləşdirmə", value: `${AUCTION_FEES.LOT_LISTING_FEE_AZN} ₼` },
                { label: "Komisyon (1.5% × 72,000)", value: `${Math.min(72000 * 0.015, AUCTION_FEES.SELLER_COMMISSION_CAP_AZN).toLocaleString("az-AZ")} ₼` },
                { label: "Satıcının cəmi xərci", value: `${(AUCTION_FEES.LOT_LISTING_FEE_AZN + Math.min(72000 * 0.015, AUCTION_FEES.SELLER_COMMISSION_CAP_AZN)).toLocaleString("az-AZ")} ₼` }
              ].map((row) => (
                <div key={row.label} className="rounded-xl bg-white p-3">
                  <div className="text-xs text-slate-400">{row.label}</div>
                  <div className="mt-1 font-bold text-slate-900">{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* How it works steps */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-5 font-semibold text-slate-900">Necə işləyir?</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { step: "1", title: "Lot sifariş et", desc: "VIN doğrulama + ekspertiza EkoMobil tərəfindən aparılır" },
                { step: "2", title: "Hərrac başlayır", desc: "Qeydiyyatlı alıcılar real vaxt rejimində təklif verir" },
                { step: "3", title: "Ən yüksək təklif udur", desc: "48 saat ərzində qalib alıcı satıcı ilə növbəti addımı təsdiqləyir" },
                { step: "4", title: "Off-platform settlement", desc: "Əsas satış ödənişi birbaşa satıcıya edilir, platforma yalnız xidmət haqqını hesablayır" }
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0891B2] text-xs font-bold text-white">
                    {item.step}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                    <div className="mt-0.5 text-xs text-slate-500 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/auction" className="btn-primary">Auksiona bax</Link>
            <Link href="/auction/sell" className="btn-secondary">Lot sifariş et</Link>
          </div>
        </section>

        {/* ─── FAQ ───────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Tez-tez soruşulan suallar</h2>
          <div className="space-y-5 divide-y divide-slate-100">
            {[
              {
                q: "Elan planı bitəndən sonra nə baş verir?",
                a: "Elan 30 gün sonra arxivlənir. Sistemimizdən bildiriş alaraq eyni qiymətlə uzada bilərsiniz."
              },
              {
                q: "Salon abunəsini istənilən vaxt ləğv edə bilərəmmi?",
                a: "Bəli. Aylıq abunə növbəti ay üçün avtomatik uzadılmır — istənilən vaxt ləğv edə bilərsiniz."
              },
              {
                q: "Auksion lotunu uduzsam lot haqqı geri qaytarılırmı?",
                a: "Lot haqqı (20 ₼) VIN yoxlaması və ekspertiza xərclərini ödəyir. Satış baş tutmasa belə bu ödəniş geri qaytarılmır. Komisyon isə yalnız uğurlu satışda tutulur."
              },
              {
                q: "Avtomobilin əsas ödənişini EkoMobil qəbul edirmi?",
                a: "Xeyr. EkoMobil yalnız platforma xidmət haqlarını qəbul edir. Avtomobilin əsas satış məbləği birbaşa alıcı ilə satıcı arasında ödənilir."
              },
              {
                q: "Satıcı uduşdan sonra satmaqdan imtina edərsə?",
                a: "Bu, tərəflər arası öhdəlik məsələsidir. Platformada qalib alıcı satıcı öhdəliyinin pozulmasını qeyd edə bilər; qaydalara uyğun platforma intizam ödənişi və ops baxışı tətbiq oluna bilər. Əsas avtomobil pulu hələ də platformada saxlanmır."
              },
              {
                q: "Dealer Pro planında VIN kredit nədir?",
                a: "Hər kredit bir avtomobilin rəsmi mənbədən VIN sorğusunu əhatə edir. Pro planda aylıq 5 pulsuz kredit daxildir; əlavə kredit 3 ₼/ədəd."
              }
            ].map((item) => (
              <div key={item.q} className="pt-5 first:pt-0">
                <p className="font-medium text-slate-900">{item.q}</p>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
