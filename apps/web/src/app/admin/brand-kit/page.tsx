import Image from "next/image";

interface ColorToken {
  name: string;
  hex: string;
  usage: string;
}

const logoColors: ColorToken[] = [
  { name: "Eko Brown", hex: "#3E2F28", usage: "Loqo 'Eko' hissəsi, əsas tünd mətn" },
  { name: "Mobil Blue", hex: "#0891B2", usage: "Loqo 'Mobil' hissəsi, primary aksent" },
  { name: "White", hex: "#FFFFFF", usage: "Loqo ikonunun daxili işarəsi" }
];

const sitePalette: ColorToken[] = [
  { name: "Primary", hex: "#0891B2", usage: "CTA, aktiv link, vurğu komponentləri" },
  { name: "Primary Hover", hex: "#0E7490", usage: "Primary hover vəziyyəti" },
  { name: "Deep Base", hex: "#3E2F28", usage: "Brend tünd tonu, başlıqlar" },
  { name: "Soft Brown", hex: "#E5D3B3", usage: "Fon accent, yumşaq bölmələr" },
  { name: "Soft Brown Border", hex: "#D4C4A8", usage: "Bej border və ayırıcılar" },
  { name: "Canvas", hex: "#FFFFFF", usage: "Əsas page fonu" }
];

function ColorSwatch({ item }: { item: ColorToken }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="h-20 rounded-xl border border-slate-200" style={{ backgroundColor: item.hex }} />
      <p className="mt-3 text-sm font-semibold text-slate-900">{item.name}</p>
      <p className="mt-1 text-xs font-mono text-slate-600">{item.hex}</p>
      <p className="mt-2 text-xs text-slate-500">{item.usage}</p>
    </div>
  );
}

function LogoPreviewCard({
  title,
  className
}: {
  title: string;
  className?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className={`mt-4 rounded-xl border border-slate-200 p-6 ${className ?? ""}`}>
        <Image
          src="/brand/ekomobil-logo.png"
          alt="EkoMobil loqosu preview"
          width={1024}
          height={768}
          className="mx-auto h-36 w-auto rounded-lg border border-[#0891B2]/20 shadow-sm"
        />
      </div>
    </div>
  );
}

export default function AdminBrandKitPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-5">
        <h2 className="text-xl font-bold text-slate-900">Brend Kit: Loqo və Dizayn Rəngləri</h2>
        <p className="mt-1 text-sm text-slate-600">
          Komandanın gələcək dizayn işlərində eyni standartı qoruması üçün təsdiqli rənglər və loqo preview-ları.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Loqo rəngləri</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {logoColors.map((item) => (
            <ColorSwatch key={item.name} item={item} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Saytın əsas palitrası</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sitePalette.map((item) => (
            <ColorSwatch key={item.name} item={item} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Loqo istifadəsi üçün vizual nümunələr</h3>
        <div className="grid gap-4 lg:grid-cols-3">
          <LogoPreviewCard title="Ağ fonda standart loqo" />
          <LogoPreviewCard title="Bej fonda loqo" className="bg-[#E5D3B3]" />
          <LogoPreviewCard title="Tünd fonda loqo" className="bg-[#1f2937]" />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Original fayl</p>
        <div className="mt-3 flex items-center gap-3">
          <Image
            src="/brand/ekomobil-logo.png"
            alt="EkoMobil loqosu original"
            width={1024}
            height={768}
            className="h-20 w-auto rounded-md border border-slate-200"
          />
          <a href="/brand/ekomobil-logo.png" download className="btn-secondary text-xs">
            PNG yüklə
          </a>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">UI Preview</p>
          <div className="mt-4 space-y-3">
            <button type="button" className="btn-primary">Primary düymə</button>
            <button type="button" className="btn-secondary ml-2">Secondary düymə</button>
            <div className="rounded-xl border border-[#D4C4A8] bg-[#E5D3B3]/40 p-4 text-sm text-[#3E2F28]">
              Yumşaq vurğu bloku (Soft Brown səth).
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Qısa qaydalar</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>Loqoda &quot;Eko&quot; yalnız `#3E2F28`, &quot;Mobil&quot; yalnız `#0891B2` ilə istifadə olunsun.</li>
            <li>Primary action elementlərdə `#0891B2`, hover üçün `#0E7490` tətbiq edin.</li>
            <li>Fon kontrastı üçün açıq səthlərdə ağ, yumşaq bölmələrdə `#E5D3B3` istifadə edin.</li>
            <li>Mətn oxunaqlılığı üçün tünd mətnlərdə `#3E2F28` və ya slate tonlarını qoruyun.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
