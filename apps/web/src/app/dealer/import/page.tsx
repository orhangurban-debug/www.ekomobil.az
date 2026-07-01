import Link from "next/link";
import { requirePageRoles } from "@/lib/rbac";
import { RoleAccessGate } from "@/components/ui/role-access-gate";
import { DealerImportForm } from "@/components/dealer/dealer-import-form";
import { getEffectiveDealerPlan } from "@/server/business-plan-store";

export default async function DealerImportPage() {
  const auth = await requirePageRoles(["admin", "dealer"]);
  if (!auth.ok) {
    return <RoleAccessGate reason={auth.reason} preset="dealer-import" />;
  }

  const plan = await getEffectiveDealerPlan(auth.user.id);
  if (!plan.csvImportEnabled) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-bold text-amber-900">CSV idxalı bu plan üçün aktiv deyil</h1>
          <p className="mt-2 text-sm text-amber-800">
            Aktiv planınız: <strong>{plan.nameAz}</strong>. CSV idxalı Salon Peşəkar və ya daha yüksək planda açılır.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/pricing#dealer" className="btn-primary">Planı yüksəlt</Link>
            <Link href="/dealer" className="btn-secondary">Salon paneli</Link>
          </div>
        </div>
      </div>
    );
  }

  return <DealerImportForm />;
}
