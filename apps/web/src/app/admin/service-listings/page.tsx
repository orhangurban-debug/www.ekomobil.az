import Link from "next/link";
import { AdminServiceListingsTable } from "@/components/admin/admin-service-listings-table";
import { requirePageRoles } from "@/lib/rbac";
import { listServiceListingsForAdmin, type ServiceListingStatus } from "@/server/service-listing-store";

const STATUS_TABS: Array<{ value: ServiceListingStatus | "all"; label: string }> = [
  { value: "pending", label: "Gözləyir" },
  { value: "approved", label: "Təsdiqlənib" },
  { value: "rejected", label: "Rədd edilib" },
  { value: "all", label: "Hamısı" }
];

export default async function AdminServiceListingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const auth = await requirePageRoles(["admin", "support"]);
  const canEdit = auth.ok && auth.user.role === "admin";
  const statusParam = typeof params.status === "string" ? params.status : "pending";
  const status = (["pending", "approved", "rejected"] as const).includes(statusParam as ServiceListingStatus)
    ? (statusParam as ServiceListingStatus)
    : undefined;
  const items = await listServiceListingsForAdmin({ status });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Servis partnyor müraciətləri</h2>
        <p className="mt-1 text-sm text-slate-500">
          Servis/ekspertiza/usta partnyor müraciətlərini təsdiqləyərək canlı, axtarıla bilən{" "}
          <Link href="/services" className="text-[#0057FF] hover:underline" target="_blank">
            /services
          </Link>{" "}
          səhifəsində göstərin.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "pending" ? "/admin/service-listings" : `/admin/service-listings?status=${tab.value}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              (statusParam || "pending") === tab.value
                ? "bg-[#0891B2] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <AdminServiceListingsTable items={items} readOnly={!canEdit} />
    </div>
  );
}
