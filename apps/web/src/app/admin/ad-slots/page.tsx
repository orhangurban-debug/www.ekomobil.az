import { AdSlotsManager } from "@/components/admin/ad-slots-manager";
import { requirePageRoles } from "@/lib/rbac";
import { getAdSlotsConfig } from "@/server/system-settings-store";

export default async function AdminAdSlotsPage() {
  const auth = await requirePageRoles(["admin", "support"]);
  const canEdit = auth.ok && auth.user.role === "admin";
  const config = await getAdSlotsConfig();
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-5">
        <h2 className="text-xl font-bold text-slate-900">Reklam yerləri və qiymətlər</h2>
        <p className="mt-1 text-sm text-slate-600">
          Saytdakı reklam slotlarını aktiv/deaktiv edin, məzmunu redaktə edin və aylıq qiymət cədvəlini idarə edin.
        </p>
      </div>
      <AdSlotsManager initial={config} readOnly={!canEdit} />
    </div>
  );
}
