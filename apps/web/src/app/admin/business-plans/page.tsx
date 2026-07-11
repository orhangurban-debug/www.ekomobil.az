import Link from "next/link";
import { BusinessPlanSubscriptionsManager } from "@/components/admin/business-plan-subscriptions-manager";
import { requirePageRoles } from "@/lib/rbac";
import { getDealerPlanCatalog, getPartsPlanCatalog, listBusinessPlanSubscriptions } from "@/server/business-plan-store";

export default async function AdminBusinessPlansPage() {
  const auth = await requirePageRoles(["admin", "support"]);
  const canEdit = auth.ok && auth.user.role === "admin";
  const [items, dealerPlans, partsPlans] = await Promise.all([
    listBusinessPlanSubscriptions(300),
    getDealerPlanCatalog(),
    getPartsPlanCatalog()
  ]);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Biznes plan abunələri</h2>
        <p className="mt-1 text-sm text-slate-500">
          Salon və mağaza planlarının aktivliyi, bitmə tarixi və status idarəsi.
          Profil moderasiyası üçün{" "}
          <Link href="/admin/salon-profiles" className="text-[#0891B2] hover:underline">Salon profilləri</Link>
          {" "}və{" "}
          <Link href="/admin/magaza-profiles" className="text-[#0891B2] hover:underline">Mağaza profilləri</Link>
          {" "}səhifələrinə keçin.
        </p>
      </div>
      <BusinessPlanSubscriptionsManager
        initialItems={items}
        dealerPlans={dealerPlans}
        partsPlans={partsPlans}
        readOnly={!canEdit}
      />
    </div>
  );
}
