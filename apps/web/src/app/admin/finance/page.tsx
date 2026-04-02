import { getFinanceSnapshot } from "@/server/admin-store";

function FinanceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default async function AdminFinancePage() {
  const finance = await getFinanceSnapshot();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Peşəkar maliyyə paneli</h2>
        <p className="mt-1 text-sm text-slate-500">
          Plan satışları, auksion gəlirləri və öhdəlik axınlarının toplu monitorinqi.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FinanceCard label="Ümumi gəlir" value={`${finance.totalRevenueAzn.toLocaleString("az-AZ")} ₼`} />
        <FinanceCard label="Elan planı gəliri" value={`${finance.listingPlanRevenueAzn.toLocaleString("az-AZ")} ₼`} />
        <FinanceCard label="Auksion gəliri" value={`${finance.auctionRevenueAzn.toLocaleString("az-AZ")} ₼`} />
        <FinanceCard label="Öhdəlik haqları" value={`${finance.obligationRevenueAzn.toLocaleString("az-AZ")} ₼`} />
        <FinanceCard label="Seller bond" value={`${finance.sellerBondRevenueAzn.toLocaleString("az-AZ")} ₼`} />
      </div>
    </div>
  );
}
