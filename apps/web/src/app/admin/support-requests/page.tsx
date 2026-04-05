import Link from "next/link";
import { AdminSupportRequestsTable } from "@/components/admin/admin-support-requests-table";
import { getAdminSupportSnapshot, listAdminSupportRequestsPaged } from "@/server/admin-store";

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
  const [snapshot, data] = await Promise.all([
    getAdminSupportSnapshot(),
    listAdminSupportRequestsPaged({ page, pageSize, q, status, priority, requestType, assigned })
  ]);
  const qParams = new URLSearchParams();
  if (q) qParams.set("q", q);
  if (status) qParams.set("status", status);
  if (priority) qParams.set("priority", priority);
  if (requestType) qParams.set("requestType", requestType);
  if (assigned) qParams.set("assigned", assigned);
  qParams.set("pageSize", String(pageSize));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Müraciətlər və dəstək sorğuları</h2>
        <p className="mt-1 text-sm text-slate-500">
          İstifadəçi sualları, problemlər və şikayətlərin mərkəzi inbox idarə paneli.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Cəmi</p><p className="text-2xl font-bold">{snapshot.total}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Yeni</p><p className="text-2xl font-bold">{snapshot.newCount}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">İcrada</p><p className="text-2xl font-bold">{snapshot.inProgressCount}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">İstifadəçi cavabı</p><p className="text-2xl font-bold">{snapshot.waitingUserCount}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Həll olunan</p><p className="text-2xl font-bold">{snapshot.resolvedCount}</p></div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="text-xs text-rose-600">Təcili</p><p className="text-2xl font-bold text-rose-700">{snapshot.urgentCount}</p></div>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-6">
        <input name="q" defaultValue={q} placeholder="Axtar: mövzu, mətn, email, telefon" className="input-field md:col-span-2" />
        <select name="status" defaultValue={status ?? ""} className="input-field">
          <option value="">Status (hamısı)</option>
          <option value="new">Yeni</option>
          <option value="in_progress">İcrada</option>
          <option value="waiting_user">İstifadəçi cavabı gözlənilir</option>
          <option value="resolved">Həll edilib</option>
          <option value="closed">Bağlanıb</option>
        </select>
        <select name="priority" defaultValue={priority ?? ""} className="input-field">
          <option value="">Prioritet (hamısı)</option>
          <option value="low">Aşağı</option>
          <option value="normal">Normal</option>
          <option value="high">Yüksək</option>
          <option value="urgent">Təcili</option>
        </select>
        <select name="requestType" defaultValue={requestType ?? ""} className="input-field">
          <option value="">Müraciət tipi (hamısı)</option>
          <option value="question">Sual</option>
          <option value="problem">Problem</option>
          <option value="complaint">Şikayət</option>
          <option value="partnership">Tərəfdaşlıq</option>
          <option value="other">Digər</option>
        </select>
        <div className="flex gap-2">
          <input type="hidden" name="pageSize" value={pageSize} />
          <button type="submit" className="btn-primary w-full justify-center">Filtrlə</button>
        </div>
        <select name="assigned" defaultValue={assigned ?? ""} className="input-field md:col-span-2">
          <option value="">Təhkim (hamısı)</option>
          <option value="yes">Təhkim olunub</option>
          <option value="no">Təhkim olunmayıb</option>
        </select>
      </form>

      <AdminSupportRequestsTable items={data.items} />

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-500">
          Cəmi: <span className="font-semibold text-slate-900">{data.total}</span> | Səhifə {data.page}/{data.totalPages}
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
