import Link from "next/link";
import { getAdminOverview, getCrmSnapshot, getFinanceSnapshot } from "@/server/admin-store";

function StatCard({
  label,
  value,
  tone = "slate",
  href,
  accent
}: {
  label: string;
  value: string;
  tone?: "slate" | "brand";
  href?: string;
  accent?: boolean;
}) {
  const inner = (
    <>
      <p className={`text-xs font-semibold uppercase tracking-wide ${tone === "brand" ? "text-[#0891B2]" : accent ? "text-sky-600" : "text-slate-500"}`}>
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${accent ? "text-[#0891B2]" : "text-slate-900"}`}>{value}</p>
    </>
  );
  if (!href) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-5">{inner}</div>;
  }
  return (
    <Link
      href={href}
      className={`rounded-2xl border bg-white p-5 transition hover:shadow-sm ${
        accent ? "border-sky-200 bg-sky-50/40" : "border-slate-200"
      }`}
    >
      {inner}
    </Link>
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Aylıq gəlir" tone="brand" value={`${overview.monthlyRevenueAzn.toLocaleString("az-AZ")} ₼`} href="/admin/finance" />
        <StatCard label="Bütün istifadəçilər" value={overview.usersTotal.toLocaleString("az-AZ")} href="/admin/users" />
        <StatCard label="Aktiv elanlar" value={overview.activeListings.toLocaleString("az-AZ")} href="/admin/listings?status=active" />
        <StatCard
          label="Yeni müraciətlər"
          value={overview.newSupportRequests.toLocaleString("az-AZ")}
          href="/admin/support-requests?status=new"
          accent={overview.newSupportRequests > 0}
        />
        <StatCard label="Canlı auksionlar" value={overview.liveAuctions.toLocaleString("az-AZ")} href="/admin/auctions?status=live" />
        <StatCard label="Auksion həll gözləyən" value={overview.unresolvedCases.toLocaleString("az-AZ")} href="/admin/auctions?status=ended_pending_confirmation" />
        <StatCard
          label="Açıq insidentlər"
          value={overview.openIncidents.toLocaleString("az-AZ")}
          href="/admin/incidents?status=open"
          accent={overview.openIncidents > 0}
        />
        <StatCard label="Aktiv istifadəçi" value={overview.activeUsers.toLocaleString("az-AZ")} href="/admin/users" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Maliyyə xülasəsi</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Plan gəliri</span><span className="font-semibold">{finance.listingPlanRevenueAzn.toLocaleString("az-AZ")} ₼</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Auksion gəliri</span><span className="font-semibold">{finance.auctionRevenueAzn.toLocaleString("az-AZ")} ₼</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Öhdəlik gəliri</span><span className="font-semibold">{finance.obligationRevenueAzn.toLocaleString("az-AZ")} ₼</span></div>
            <div className="mt-3 border-t border-slate-100 pt-3 flex justify-between text-base"><span className="font-bold text-slate-900">Cəmi</span><span className="font-bold text-slate-900">{finance.totalRevenueAzn.toLocaleString("az-AZ")} ₼</span></div>
          </div>
          <Link href="/admin/finance" className="mt-4 inline-flex text-sm font-semibold text-[#0891B2] hover:underline">
            Maliyyə panelini aç
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">CRM xülasəsi</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Cəmi sorğu</p><p className="text-lg font-bold">{crm.totalLeads}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Yeni</p><p className="text-lg font-bold">{crm.newLeads}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Prosesdə</p><p className="text-lg font-bold">{crm.inProgressLeads}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Orta cavab</p><p className="text-lg font-bold">{crm.avgResponseMinutes} dəq</p></div>
          </div>
          <Link href="/admin/crm" className="mt-4 inline-flex text-sm font-semibold text-[#0891B2] hover:underline">
            CRM panelini aç
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Link href="/admin/support-requests" className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0891B2]/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0891B2]">Dəstək</p>
          <h3 className="mt-2 font-bold text-slate-900">Müraciət inbox</h3>
          <p className="mt-1 text-sm text-slate-500">İstifadəçi sorğuları, cavablar və arxiv.</p>
        </Link>
        <Link href="/admin/users" className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0891B2]/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0891B2]">İstifadəçilər</p>
          <h3 className="mt-2 font-bold text-slate-900">Rollar və status</h3>
          <p className="mt-1 text-sm text-slate-500">Hesab idarəetməsi və profil baxışı.</p>
        </Link>
        <Link href="/admin/listings" className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0891B2]/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0891B2]">Elanlar</p>
          <h3 className="mt-2 font-bold text-slate-900">Moderasiya</h3>
          <p className="mt-1 text-sm text-slate-500">Status, redaktə və bulk əməliyyatlar.</p>
        </Link>
        <Link href="/admin/incidents" className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0891B2]/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0891B2]">Moderasiya</p>
          <h3 className="mt-2 font-bold text-slate-900">İnsident qutusu</h3>
          <p className="mt-1 text-sm text-slate-500">Şikayət, qayda pozuntusu və saxta məlumat halları.</p>
        </Link>
        <Link href="/admin/auctions" className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0891B2]/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0891B2]">Auksion idarəsi</p>
          <h3 className="mt-2 font-bold text-slate-900">Risk və dondurma paneli</h3>
          <p className="mt-1 text-sm text-slate-500">Lot dondurma, əl baxışı bayraqları və sürətli keçidlər.</p>
        </Link>
        <Link href="/admin/invoices" className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#0891B2]/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0891B2]">Maliyyə</p>
          <h3 className="mt-2 font-bold text-slate-900">İnvoyslar</h3>
          <p className="mt-1 text-sm text-slate-500">Ödəniş qəbzləri və e-poçt statusu.</p>
        </Link>
      </div>
    </div>
  );
}
