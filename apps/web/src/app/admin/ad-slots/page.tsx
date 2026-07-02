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
          Reklam slotlarını idarə edin: &quot;Ödənişli reklam&quot; rejimində şəkil yükləyin, büdcə və gündəlik tarif təyin edin — müddət avtomatik hesablanır və bitəndə reklam öz-özünə sönür.
        </p>
      </div>
      <AdSlotsManager initial={config} readOnly={!canEdit} />
    </div>
  );
}
