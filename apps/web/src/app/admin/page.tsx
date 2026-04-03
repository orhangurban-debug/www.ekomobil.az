import Link from "next/link";
import { getAdminOverview, getCrmSnapshot, getFinanceSnapshot } from "@/server/admin-store";

function StatCard({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "brand" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className={`text-xs font-semibold uppercase tracking-wide ${tone === "brand" ? "text-[#0891B2]" : "text-slate-500"}`}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [overview, finance, crm] = await Promise.all([
    getAdminOverview(),
    getFinanceSnapshot(),
    getCrmSnapshot()
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Aylıq gəlir" tone="brand" value={`${overview.monthlyRevenueAzn.toLocaleString("az-AZ")} ₼`} />
        <StatCard label="Bütün istifadəçilər" value={overview.usersTotal.toLocaleString("az-AZ")} />
        <StatCard label="Aktiv istifadəçi" value={overview.activeUsers.toLocaleString("az-AZ")} />
        <StatCard label="Aktiv elanlar" value={overview.activeListings.toLocaleString("az-AZ")} />
        <StatCard label="Canlı auksionlar" value={overview.liveAuctions.toLocaleString("az-AZ")} />
        <StatCard label="Həll gözləyən case" value={overview.unresolvedCases.toLocaleString("az-AZ")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Maliyyə xülasəsi</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Plan gəliri</span><span className="font-semibold">{finance.listingPlanRevenueAzn.toLocaleString("az-AZ")} ₼</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Auksion gəliri</span><span className="font-semibold">{finance.auctionRevenueAzn.toLocaleString("az-AZ")} ₼</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Öhdəlik gəliri</span><span className="font-semibold">{finance.obligationRevenueAzn.toLocaleString("az-AZ")} ₼</span></div>
            <div className="mt-3 border-t border-slate-100 pt-3 flex justify-between text-base"><span className="font-bold text-slate-900">Total</span><span className="font-bold text-slate-900">{finance.totalRevenueAzn.toLocaleString("az-AZ")} ₼</span></div>
          </div>
          <Link href="/admin/finance" className="mt-4 inline-flex text-sm font-semibold text-[#0891B2] hover:underline">
            Maliyyə panelini aç
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">CRM xülasəsi</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Total lead</p><p className="text-lg font-bold">{crm.totalLeads}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Yeni</p><p className="text-lg font-bold">{crm.newLeads}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Prosesdə</p><p className="text-lg font-bold">{crm.inProgressLeads}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Orta cavab</p><p className="text-lg font-bold">{crm.avgResponseMinutes} dəq</p></div>
          </div>
          <Link href="/admin/crm" className="mt-4 inline-flex text-sm font-semibold text-[#0891B2] hover:underline">
            CRM panelini aç
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/incidents" className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0891B2]/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0891B2]">Moderation</p>
          <h3 className="mt-2 font-bold text-slate-900">Incident Inbox</h3>
          <p className="mt-1 text-sm text-slate-500">Şikayət, qayda pozuntusu və saxta məlumat case-ləri.</p>
        </Link>
        <Link href="/admin/auctions" className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0891B2]/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0891B2]">Auction control</p>
          <h3 className="mt-2 font-bold text-slate-900">Risk & freeze panel</h3>
          <p className="mt-1 text-sm text-slate-500">Lot freeze, manual-review bayraqları və sürətli keçidlər.</p>
        </Link>
        <Link href="/admin/audit" className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0891B2]/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0891B2]">Governance</p>
          <h3 className="mt-2 font-bold text-slate-900">Admin audit timeline</h3>
          <p className="mt-1 text-sm text-slate-500">Kim nəyi nə vaxt dəyişdi izləmə jurnalı.</p>
        </Link>
      </div>
    </div>
  );
}
