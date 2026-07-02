import { TaxReportsPanel } from "@/components/admin/tax-reports-panel";
import { requirePageRoles } from "@/lib/rbac";

export default async function AdminTaxReportsPage() {
  await requirePageRoles(["admin"]);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Vergi hesabatları</h2>
        <p className="mt-1 text-sm text-slate-500">
          Platforma ödənişlərinin vergi hesabatı üçün CSV export — ödəniş reyestri, ƏDV satış reyestri və invoys siyahısı.
        </p>
      </div>
      <TaxReportsPanel />
    </div>
  );
}
