import Link from "next/link";
import { requirePageRoles } from "@/lib/rbac";
import { RoleAccessGate } from "@/components/ui/role-access-gate";
import { getEffectiveDealerPlan } from "@/server/business-plan-store";
import { getBusinessAnalyticsSummary } from "@/server/business-analytics-store";

export default async function DealerAnalyticsPage() {
  const auth = await requirePageRoles(["admin", "dealer"]);
  if (!auth.ok) {
    return <RoleAccessGate reason={auth.reason} preset="dealer-analytics" />;
  }

  const plan = await getEffectiveDealerPlan(auth.user.id);
  if (!plan.analyticsEnabled) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl alert-warning border p-6">
          <h1 className="text-xl font-bold text-amber-200">Analitika bu plan üçün aktiv deyil</h1>
          <p className="mt-2 text-sm text-amber-200">
            Aktiv planınız: <strong>{plan.nameAz}</strong>. Salon Peşəkar və ya daha yüksək plan seçin.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/pricing#dealer" className="btn-primary">Planı yüksəlt</Link>
            <Link href="/dealer" className="btn-secondary">Salon paneli</Link>
          </div>
        </div>
      </div>
    );
  }

  const summary = await getBusinessAnalyticsSummary(auth.user.id, "vehicle");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Salon analitika paneli</h1>
          <p className="mt-1 text-sm text-white/50">Plan: {plan.nameAz}</p>
        </div>
        <Link href="/dealer" className="btn-secondary">Salon panelinə qayıt</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="card p-4"><div className="text-xs text-white/50">Aktiv elan</div><div className="mt-1 text-2xl font-bold">{summary.activeCount}</div></div>
        <div className="card p-4"><div className="text-xs text-white/50">Baxış</div><div className="mt-1 text-2xl font-bold">{summary.totalViews.toLocaleString("az-AZ")}</div></div>
        <div className="card p-4"><div className="text-xs text-white/50">Əlaqə klik</div><div className="mt-1 text-2xl font-bold">{summary.totalContactClicks.toLocaleString("az-AZ")}</div></div>
        <div className="card p-4"><div className="text-xs text-white/50">Test sürüş klik</div><div className="mt-1 text-2xl font-bold">{summary.totalTestDriveClicks.toLocaleString("az-AZ")}</div></div>
      </div>

      <div className="mt-6 card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-3">
          <h2 className="font-semibold text-white">Ən çox baxılan elanlar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
              <tr>
                <th className="px-4 py-2 text-left">Elan</th>
                <th className="px-4 py-2 text-left">Şəhər</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Baxış</th>
                <th className="px-4 py-2 text-right">Əlaqə</th>
                <th className="px-4 py-2 text-right">Test sürüş</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {summary.topListings.map((item) => (
                <tr key={item.listingId}>
                  <td className="px-4 py-2"><Link className="font-medium text-white hover:text-[#0057FF]" href={`/listings/${item.listingId}`}>{item.title}</Link></td>
                  <td className="px-4 py-2">{item.city}</td>
                  <td className="px-4 py-2">{item.status}</td>
                  <td className="px-4 py-2 text-right">{item.viewCount.toLocaleString("az-AZ")}</td>
                  <td className="px-4 py-2 text-right">{item.contactClickCount.toLocaleString("az-AZ")}</td>
                  <td className="px-4 py-2 text-right">{item.testDriveClickCount.toLocaleString("az-AZ")}</td>
                </tr>
              ))}
              {summary.topListings.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-white/40" colSpan={6}>Hələ statistik məlumat yoxdur.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
