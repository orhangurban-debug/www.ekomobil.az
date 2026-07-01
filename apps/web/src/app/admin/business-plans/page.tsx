import { BusinessPlanSubscriptionsManager } from "@/components/admin/business-plan-subscriptions-manager";
import { requirePageRoles } from "@/lib/rbac";
import { listBusinessPlanSubscriptions } from "@/server/business-plan-store";

export default async function AdminBusinessPlansPage() {
  const auth = await requirePageRoles(["admin", "support"]);
  const canEdit = auth.ok && auth.user.role === "admin";
  const items = await listBusinessPlanSubscriptions(300);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Biznes plan abunələri</h2>
        <p className="mt-1 text-sm text-slate-500">
          Salon və mağaza planlarının aktivliyi, bitmə tarixi və status idarəsi.
        </p>
      </div>
      <BusinessPlanSubscriptionsManager initialItems={items} readOnly={!canEdit} />
    </div>
  );
}
