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
        <FinanceCard
          label="Biznes abunə MRR (təxmini)"
          value={`${finance.businessSubscriptionsRevenueAzn.toLocaleString("az-AZ")} ₼`}
        />
        <FinanceCard label="Aktiv salon abunələri" value={String(finance.activeDealerSubscriptions)} />
        <FinanceCard label="Aktiv mağaza abunələri" value={String(finance.activePartsSubscriptions)} />
        <FinanceCard label="7 günə bitən abunələr" value={String(finance.expiringSubscriptions7d)} />
        <FinanceCard label="Öhdəlik haqları" value={`${finance.obligationRevenueAzn.toLocaleString("az-AZ")} ₼`} />
        <FinanceCard label="Seller bond" value={`${finance.sellerBondRevenueAzn.toLocaleString("az-AZ")} ₼`} />
      </div>
      {finance.expiringSubscriptions7d > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Xəbərdarlıq: Növbəti 7 gün ərzində bitəcək <strong>{finance.expiringSubscriptions7d}</strong> biznes abunəsi var.
          Auto-expiry cron bunu izləyir, lakin kommersiya komandası üçün manual renew follow-up tövsiyə olunur.
        </div>
      )}
    </div>
  );
}
