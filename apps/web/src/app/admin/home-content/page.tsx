import { HomeContentManager } from "@/components/admin/home-content-manager";
import { requirePageRoles } from "@/lib/rbac";
import { getHomeContentConfig } from "@/server/system-settings-store";

export default async function AdminHomeContentPage() {
  const auth = await requirePageRoles(["admin", "support"]);
  const canEdit = auth.ok && auth.user.role === "admin";
  const config = await getHomeContentConfig();
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-5">
        <h2 className="text-xl font-bold text-slate-900">Ana səhifə məzmunu</h2>
        <p className="mt-1 text-sm text-slate-600">
          Hero slaydlarını, şəkilləri, mətnləri və kateqoriyaları real zamanda idarə edin. Dəyişikliklər saxlanıldıqdan sonra saytda dərhal əks olunur.
        </p>
      </div>
      <HomeContentManager initial={config} readOnly={!canEdit} />
    </div>
  );
}
