import { redirect } from "next/navigation";
import { TaxReportsPanel } from "@/components/admin/tax-reports-panel";
import { requirePageAdminCapability } from "@/lib/rbac";

export default async function AdminTaxReportsPage() {
  const auth = await requirePageAdminCapability("finance.manage");
  if (!auth.ok) redirect(auth.reason === "unauthenticated" ? "/login?next=/admin/tax-reports" : "/admin");
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
