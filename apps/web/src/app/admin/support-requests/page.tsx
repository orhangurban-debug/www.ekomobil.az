import Link from "next/link";
import { AdminSupportRequestsTable } from "@/components/admin/admin-support-requests-table";
import {
  getAdminSupportSnapshot,
  listAdminSupportRequestsPaged,
  listSupportAssignableStaff
} from "@/server/admin-store";

export default async function AdminSupportRequestsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 25);
  const q = typeof params.q === "string" ? params.q : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const priority = typeof params.priority === "string" ? params.priority : undefined;
  const requestType = typeof params.requestType === "string" ? params.requestType : undefined;
  const assigned = typeof params.assigned === "string" ? (params.assigned as "yes" | "no") : undefined;
  const [snapshot, data, assignees] = await Promise.all([
    getAdminSupportSnapshot(),
    listAdminSupportRequestsPaged({ page, pageSize, q, status, priority, requestType, assigned }),
    listSupportAssignableStaff()
  ]);
  const qParams = new URLSearchParams();
  if (q) qParams.set("q", q);
  if (status) qParams.set("status", status);
  if (priority) qParams.set("priority", priority);
  if (requestType) qParams.set("requestType", requestType);
  if (assigned) qParams.set("assigned", assigned);
  qParams.set("pageSize", String(pageSize));

  const stats = [
    { label: "Cəmi", value: snapshot.total, accent: false },
    { label: "Yeni", value: snapshot.newCount, accent: snapshot.newCount > 0 },
    { label: "İcrada", value: snapshot.inProgressCount, accent: false },
    { label: "Cavab gözlənilir", value: snapshot.waitingUserCount, accent: false },
    { label: "Həll edilib", value: snapshot.resolvedCount, accent: false },
    { label: "Təcili", value: snapshot.urgentCount, accent: snapshot.urgentCount > 0, urgent: true }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Müraciət inbox</h2>
          <p className="mt-1 text-sm text-slate-500">
            İstifadəçi sorğularını idarə edin, təhkim edin və e-poçtla cavablandırın.
          </p>
        </div>
        {assignees.length > 0 && (
          <p className="text-xs text-slate-400">
            {assignees.length} admin/dəstək işçisi təhkim üçün mövcuddur
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl border p-4 ${
              item.urgent ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"
            }`}
          >
            <p className={`text-xs ${item.urgent ? "text-rose-600" : "text-slate-500"}`}>{item.label}</p>
            <p className={`text-2xl font-bold ${item.urgent ? "text-rose-700" : item.accent ? "text-[#0891B2]" : "text-slate-900"}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <form className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-6">
          <input
            name="q"
            defaultValue={q}
            placeholder="Axtar: mövzu, mətn, email..."
            className="input-field md:col-span-2"
          />
          <select name="status" defaultValue={status ?? ""} className="input-field">
            <option value="">Status — hamısı</option>
            <option value="new">Yeni</option>
            <option value="in_progress">İcrada</option>
            <option value="waiting_user">Cavab gözlənilir</option>
            <option value="resolved">Həll edilib</option>
            <option value="closed">Bağlanıb</option>
          </select>
          <select name="priority" defaultValue={priority ?? ""} className="input-field">
            <option value="">Prioritet — hamısı</option>
            <option value="low">Aşağı</option>
            <option value="normal">Normal</option>
            <option value="high">Yüksək</option>
            <option value="urgent">Təcili</option>
          </select>
          <select name="requestType" defaultValue={requestType ?? ""} className="input-field">
            <option value="">Tip — hamısı</option>
            <option value="question">Sual</option>
            <option value="problem">Problem</option>
            <option value="complaint">Şikayət</option>
            <option value="partnership">Tərəfdaşlıq</option>
            <option value="inspection_partner">Ekspertiza/Servis</option>
            <option value="other">Digər</option>
          </select>
          <select name="assigned" defaultValue={assigned ?? ""} className="input-field">
            <option value="">Təhkim — hamısı</option>
            <option value="yes">Təhkim olunub</option>
            <option value="no">Təhkim olunmayıb</option>
          </select>
          <input type="hidden" name="pageSize" value={pageSize} />
          <button type="submit" className="btn-primary w-full justify-center md:col-span-6 xl:col-span-1">
            Filtrlə
          </button>
        </div>
      </form>

      <AdminSupportRequestsTable items={data.items} assignees={assignees} />

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
