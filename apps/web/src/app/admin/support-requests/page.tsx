import Link from "next/link";
import { AdminSupportRequestsTable } from "@/components/admin/admin-support-requests-table";
import { requirePageRoles } from "@/lib/rbac";
import {
  REQUEST_TYPE_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS
} from "@/lib/support-contact";
import {
  REQUEST_TYPE_GROUPS,
  RISK_FLAG_LABELS,
  requestTypeBadgeClass
} from "@/lib/support-admin";
import {
  getAdminSupportSnapshot,
  listAdminSupportRequestsPaged,
  listSupportAssignableStaff
} from "@/server/admin-store";
import { SUPPORT_ARCHIVE_AFTER_DAYS } from "@/lib/support-retention";

function statHref(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) q.set(key, value);
  });
  const query = q.toString();
  return query ? `/admin/support-requests?${query}` : "/admin/support-requests";
}

export default async function AdminSupportRequestsPage({
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
  const requestGroup = typeof params.requestGroup === "string" ? params.requestGroup : undefined;
  const riskFlag = typeof params.riskFlag === "string" ? params.riskFlag : undefined;
  const assigned = typeof params.assigned === "string" ? (params.assigned as "yes" | "no") : undefined;
  const [snapshot, data, assignees] = await Promise.all([
    getAdminSupportSnapshot(),
    listAdminSupportRequestsPaged({
      page,
      pageSize,
      q,
      status,
      priority,
      requestType,
      requestGroup,
      riskFlag,
      assigned
    }),
    listSupportAssignableStaff()
  ]);
  const qParams = new URLSearchParams();
  if (q) qParams.set("q", q);
  if (status) qParams.set("status", status);
  if (priority) qParams.set("priority", priority);
  if (requestType) qParams.set("requestType", requestType);
  if (requestGroup) qParams.set("requestGroup", requestGroup);
  if (riskFlag) qParams.set("riskFlag", riskFlag);
  if (assigned) qParams.set("assigned", assigned);
  qParams.set("pageSize", String(pageSize));

  const stats = [
    { label: "Cəmi", value: snapshot.total, href: statHref({}) },
    { label: "Yeni", value: snapshot.newCount, href: statHref({ status: "new" }), accent: snapshot.newCount > 0 },
    { label: "İcrada", value: snapshot.inProgressCount, href: statHref({ status: "in_progress" }) },
    { label: "Cavab gözlənilir", value: snapshot.waitingUserCount, href: statHref({ status: "waiting_user" }) },
    { label: "Həll edilib", value: snapshot.resolvedCount, href: statHref({ status: "resolved" }) },
    { label: "Arxiv", value: snapshot.archivedCount, href: statHref({ status: "archived" }) },
    { label: "Risk / nəzarət", value: snapshot.riskCount, href: statHref({ riskFlag: "watch" }), urgent: snapshot.riskCount > 0 },
    { label: "Şikayət", value: snapshot.complaintCount, href: statHref({ requestType: "complaint" }) },
    {
      label: "Ort. cavab",
      value: snapshot.avgResponseHours > 0 ? String(snapshot.avgResponseHours) : "—",
      href: statHref({ status: "resolved" }),
      sub: "saat"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Müraciət inbox</h2>
          <p className="mt-1 text-sm text-slate-500">
            Kateqoriyalaşdırılmış sorğular, müştəri konteksti və hüquqi arxiv üçün export.
            Həll edilmiş müraciətlər {SUPPORT_ARCHIVE_AFTER_DAYS} gündən sonra avtomatik arxivlənir.
          </p>
        </div>
        {assignees.length > 0 && (
          <p className="text-xs text-slate-400">
            {assignees.length} admin/dəstək işçisi təhkim üçün mövcuddur
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {stats.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`rounded-2xl border p-4 transition hover:shadow-sm ${
              item.urgent ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"
            }`}
          >
            <p className={`text-xs ${item.urgent ? "text-rose-600" : "text-slate-500"}`}>{item.label}</p>
            <p className={`text-2xl font-bold ${item.urgent ? "text-rose-700" : item.accent ? "text-[#0891B2]" : "text-slate-900"}`}>
              {item.value}
              {item.sub && <span className="ml-1 text-xs font-normal text-slate-400">{item.sub}</span>}
            </p>
          </Link>
        ))}
      </div>

      {snapshot.byType.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {snapshot.byType.map((item) => (
            <Link
              key={item.requestType}
              href={statHref({ requestType: item.requestType })}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition hover:opacity-80 ${requestTypeBadgeClass(item.requestType)}`}
            >
              {REQUEST_TYPE_LABELS[item.requestType] ?? item.requestType} · {item.count}
            </Link>
          ))}
        </div>
      )}

      <form className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
          <input
            name="q"
            defaultValue={q}
            placeholder="Axtar: mövzu, mətn, email..."
            className="input-field md:col-span-2 xl:col-span-2"
          />
          <select name="status" defaultValue={status ?? ""} className="input-field">
            <option value="">Status — hamısı</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select name="priority" defaultValue={priority ?? ""} className="input-field">
            <option value="">Prioritet — hamısı</option>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select name="requestGroup" defaultValue={requestGroup ?? ""} className="input-field">
            <option value="">Kateqoriya — hamısı</option>
            {REQUEST_TYPE_GROUPS.map((group) => (
              <option key={group.id} value={group.id}>{group.label}</option>
            ))}
          </select>
          <select name="requestType" defaultValue={requestType ?? ""} className="input-field">
            <option value="">Tip — hamısı</option>
            {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select name="riskFlag" defaultValue={riskFlag ?? ""} className="input-field">
            <option value="">Risk — hamısı</option>
            {Object.entries(RISK_FLAG_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select name="assigned" defaultValue={assigned ?? ""} className="input-field">
            <option value="">Təhkim — hamısı</option>
            <option value="yes">Təhkim olunub</option>
            <option value="no">Təhkim olunmayıb</option>
          </select>
          <input type="hidden" name="pageSize" value={pageSize} />
          <button type="submit" className="btn-primary w-full justify-center xl:col-span-1">
            Filtrlə
          </button>
        </div>
      </form>

      <AdminSupportRequestsTable items={data.items} assignees={assignees} canDelete={canDelete} />

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-500">
          Cəmi <span className="font-semibold text-slate-900">{data.total}</span> · Səhifə {data.page}/{data.totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            href={data.page > 1 ? `/admin/support-requests?${new URLSearchParams([...qParams.entries(), ["page", String(data.page - 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Geri
          </Link>
          <Link
            href={data.page < data.totalPages ? `/admin/support-requests?${new URLSearchParams([...qParams.entries(), ["page", String(data.page + 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page >= data.totalPages ? "pointer-events-none opacity-50" : ""}`}
          >
            İrəli
          </Link>
        </div>
      </div>
    </div>
  );
}
