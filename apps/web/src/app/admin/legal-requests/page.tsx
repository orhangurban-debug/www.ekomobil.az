import Link from "next/link";
import { requirePageRoles } from "@/lib/rbac";
import { AdminLegalRequestsPanel } from "@/components/admin/admin-legal-requests-panel";
import { listLegalDataRequests } from "@/server/legal-request-store";

export const metadata = {
  title: "Hüquqi sorğular | EkoMobil Admin",
  description: "Hüquq-mühafizə orqanlarından daxil olan rəsmi sorğuların qeydiyyatı"
};

export default async function AdminLegalRequestsPage() {
  await requirePageRoles(["admin"]);
  const requests = await listLegalDataRequests(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hüquqi sorğular</h1>
        <p className="mt-2 text-sm text-slate-600">
          Rəsmi sorğuları qeyd edin, status izləyin və subyekt istifadəçilər üzrə{" "}
          <Link href="/admin/users" className="text-[#0891B2] hover:underline">
            araşdırma exportu
          </Link>{" "}
          alın.
        </p>
      </div>

      <AdminLegalRequestsPanel initialRequests={requests} />
    </div>
  );
}
