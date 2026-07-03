import { Metadata } from "next";
import { requirePageRoles } from "@/lib/rbac";
import AdRequestsPanel from "@/components/admin/ad-requests-panel";

export const metadata: Metadata = {
  title: "Reklam Müraciətləri — Admin"
};

export const dynamic = "force-dynamic";

export default async function AdminAdRequestsPage() {
  await requirePageRoles(["admin", "support"]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Reklam Müraciətləri</h1>
        <p className="text-sm text-slate-500 mt-1">
          İstifadəçilərin /advertise səhifəsindən göndərdiyi banner reklam sorğuları.
        </p>
      </div>
      <AdRequestsPanel />
    </div>
  );
}
