import Link from "next/link";
import { AdminServiceListingsTable } from "@/components/admin/admin-service-listings-table";
import { requirePageRoles } from "@/lib/rbac";
import {
  getServiceListingStatusCounts,
  listServiceListingsForAdmin,
  type ServiceListingStatus
} from "@/server/service-listing-store";

const STATUS_TABS: Array<{ value: ServiceListingStatus | "all"; label: string }> = [
  { value: "pending", label: "Gözləyir" },
  { value: "approved", label: "Təsdiqlənib" },
  { value: "rejected", label: "Rədd edilib" },
  { value: "paused", label: "Gizli" },
  { value: "archived", label: "Silinib" },
  { value: "all", label: "Hamısı" }
];

function tabHref(value: ServiceListingStatus | "all"): string {
  if (value === "all") return "/admin/service-listings?status=all";
  return `/admin/service-listings?status=${value}`;
}

export default async function AdminServiceListingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const auth = await requirePageRoles(["admin", "support"]);
  const canEdit = auth.ok && auth.user.role === "admin";
  const counts = await getServiceListingStatusCounts();

  const rawStatus = typeof params.status === "string" ? params.status : undefined;
  const activeTab: ServiceListingStatus | "all" =
    rawStatus === "all" ||
    rawStatus === "pending" ||
    rawStatus === "approved" ||
    rawStatus === "rejected" ||
    rawStatus === "paused" ||
    rawStatus === "archived"
      ? rawStatus
      : counts.pending > 0
        ? "pending"
        : "all";

  const statusFilter = activeTab === "all" ? undefined : activeTab;
  const items = await listServiceListingsForAdmin({ status: statusFilter });

  const tabCount = (value: ServiceListingStatus | "all"): number => {
    if (value === "all") return counts.total;
    return counts[value];
  };

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
        {STATUS_TABS.map((tab) => {
          const count = tabCount(tab.value);
          return (
            <Link
              key={tab.value}
              href={tabHref(tab.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activeTab === tab.value
                  ? "bg-[#0891B2] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
              {count > 0 ? ` (${count})` : ""}
            </Link>
          );
        })}
      </div>

      <AdminServiceListingsTable
        items={items}
        readOnly={!canEdit}
        activeTab={activeTab}
        counts={counts}
      />
    </div>
  );
}
