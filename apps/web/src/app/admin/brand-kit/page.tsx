import { BrandKitSettingsForm } from "@/components/admin/brand-kit-settings-form";
import { getBrandSettings } from "@/server/system-settings-store";

export default async function AdminBrandKitPage() {
  const brand = await getBrandSettings();
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-5">
        <h2 className="text-xl font-bold text-slate-900">Brend Kit: Loqo və Dizayn Rəngləri</h2>
        <p className="mt-1 text-sm text-slate-600">
          Buradan loqoları, rəngləri və əlavə brand şəkillərini redaktə edə bilərsiniz. Dəyişikliklər avtomatik olaraq saytda tətbiq olunur.
        </p>
      </div>
      <BrandKitSettingsForm initial={brand} />
    </div>
  );
}
