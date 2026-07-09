import Link from "next/link";
import { AdminSupportRequestsTable } from "@/components/admin/admin-support-requests-table";
import { requirePageRoles } from "@/lib/rbac";
import {
  REQUEST_TYPE_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS
} from "@/lib/support-contact";
import { REQUEST_TYPE_GROUPS } from "@/lib/support-admin";
import {
  getAdminSupportSnapshot,
  listAdminSupportRequestsPaged,
  listSupportAssignableStaff
} from "@/server/admin-store";
import { getAdminPendingCounts } from "@/server/admin-counts-store";

function statHref(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams({ requestGroup: "business_apply" });
  Object.entries(params).forEach(([key, value]) => {
    if (value) q.set(key, value);
  });
  return `/admin/business-applications?${q.toString()}`;
}

export default async function AdminBusinessApplicationsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const auth = await requirePageRoles(["admin", "support"]);
  const canDelete = auth.ok && auth.user.role === "admin";
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 25);
  const q = typeof params.q === "string" ? params.q : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const priority = typeof params.priority === "string" ? params.priority : undefined;
  const requestType = typeof params.requestType === "string" ? params.requestType : undefined;
  const riskFlag = typeof params.riskFlag === "string" ? params.riskFlag : undefined;
  const assigned = typeof params.assigned === "string" ? (params.assigned as "yes" | "no") : undefined;

  const businessGroup = REQUEST_TYPE_GROUPS.find((g) => g.id === "business_apply");
  const businessTypes = businessGroup?.types ?? [];

  const [snapshot, data, assignees, pendingCounts] = await Promise.all([
    getAdminSupportSnapshot(),
    listAdminSupportRequestsPaged({
      page,
      pageSize,
      q,
      status,
      priority,
      requestType,
      requestGroup: "business_apply",
      riskFlag,
      assigned
    }),
    listSupportAssignableStaff(),
    getAdminPendingCounts()
  ]);

  const qParams = new URLSearchParams({ requestGroup: "business_apply" });
  if (q) qParams.set("q", q);
  if (status) qParams.set("status", status);
  if (priority) qParams.set("priority", priority);
  if (requestType) qParams.set("requestType", requestType);
  if (riskFlag) qParams.set("riskFlag", riskFlag);
  if (assigned) qParams.set("assigned", assigned);
  qParams.set("pageSize", String(pageSize));

  const businessByType = snapshot.byType.filter((item) => businessTypes.includes(item.requestType));

  const stats = [
    { label: "Cəmi", value: data.total, href: statHref({}) },
    { label: "Yeni", value: pendingCounts.newBusinessApplications, href: statHref({ status: "new" }), accent: true },
    { label: "Salon", value: businessByType.find((t) => t.requestType === "dealer_apply")?.count ?? 0, href: statHref({ requestType: "dealer_apply" }) },
    { label: "Mağaza", value: businessByType.find((t) => t.requestType === "parts_apply")?.count ?? 0, href: statHref({ requestType: "parts_apply" }) },
    { label: "Servis", value: businessByType.find((t) => t.requestType === "inspection_partner")?.count ?? 0, href: statHref({ requestType: "inspection_partner" }) },
    { label: "Həll edilib", value: snapshot.resolvedCount, href: statHref({ status: "resolved" }) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Biznes onboarding</p>
          <h2 className="text-2xl font-bold text-slate-900">Biznes müraciətləri</h2>
          <p className="mt-1 text-sm text-slate-500">
            Salon, mağaza və servis profili müraciətləri. Təsdiq etdikdən sonra istifadəçinin hesabı avtomatik aktivləşir.
          </p>
        </div>
        <Link href="/admin/support-requests" className="btn-secondary text-sm">
          Ümumi müraciətlər →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`rounded-2xl border p-4 transition hover:shadow-sm ${
              item.accent ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className={`text-2xl font-bold ${item.accent ? "text-violet-700" : "text-slate-900"}`}>{item.value}</p>
          </Link>
        ))}
      </div>

      <form className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
          <input name="q" defaultValue={q} placeholder="Axtar: salon adı, email..." className="input-field md:col-span-2" />
          <select name="status" defaultValue={status ?? ""} className="input-field">
            <option value="">Status — hamısı</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select name="requestType" defaultValue={requestType ?? ""} className="input-field">
            <option value="">Tip — hamısı</option>
            {businessTypes.map((type) => (
              <option key={type} value={type}>{REQUEST_TYPE_LABELS[type] ?? type}</option>
            ))}
          </select>
          <select name="priority" defaultValue={priority ?? ""} className="input-field">
            <option value="">Prioritet</option>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select name="assigned" defaultValue={assigned ?? ""} className="input-field">
            <option value="">Təhkim</option>
            <option value="yes">Təhkim olunub</option>
            <option value="no">Təhkim olunmayıb</option>
          </select>
          <input type="hidden" name="pageSize" value={pageSize} />
          <button type="submit" className="btn-primary w-full justify-center">Filtrlə</button>
        </div>
      </form>

      <AdminSupportRequestsTable
        items={data.items}
        assignees={assignees}
        canDelete={canDelete}
        mode="business"
      />

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-500">
          Cəmi <span className="font-semibold text-slate-900">{data.total}</span> · Səhifə {data.page}/{data.totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            href={data.page > 1 ? `/admin/business-applications?${new URLSearchParams([...qParams.entries(), ["page", String(data.page - 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Geri
          </Link>
          <Link
            href={data.page < data.totalPages ? `/admin/business-applications?${new URLSearchParams([...qParams.entries(), ["page", String(data.page + 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page >= data.totalPages ? "pointer-events-none opacity-50" : ""}`}
          >
            İrəli
          </Link>
        </div>
      </div>
    </div>
  );
}
