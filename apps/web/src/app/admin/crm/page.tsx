import Link from "next/link";
import { AdminLeadsTable } from "@/components/admin/admin-leads-table";
import { getCrmSnapshot, listAdminLeadsPaged } from "@/server/admin-store";

export default async function AdminCrmPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 25);
  const q = typeof params.q === "string" ? params.q : undefined;
  const stage = typeof params.stage === "string" ? params.stage : undefined;
  const source = typeof params.source === "string" ? params.source : undefined;
  const [snapshot, data] = await Promise.all([
    getCrmSnapshot(),
    listAdminLeadsPaged({ page, pageSize, q, stage, source })
  ]);
  const qParams = new URLSearchParams();
  if (q) qParams.set("q", q);
  if (stage) qParams.set("stage", stage);
  if (source) qParams.set("source", source);
  qParams.set("pageSize", String(pageSize));
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">CRM idarə paneli</h2>
        <p className="mt-1 text-sm text-slate-500">
          Lead status-ları, cavab SLA metrikası və müştəri əlaqələrinin mərkəzi görünüşü.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Total lead</p><p className="text-2xl font-bold">{snapshot.totalLeads}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Yeni</p><p className="text-2xl font-bold">{snapshot.newLeads}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Prosesdə</p><p className="text-2xl font-bold">{snapshot.inProgressLeads}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Orta cavab (dəq)</p><p className="text-2xl font-bold">{snapshot.avgResponseMinutes}</p></div>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-5">
        <input name="q" defaultValue={q} placeholder="Axtar: müştəri/telefon/email/elan" className="input-field md:col-span-2" />
        <select name="stage" defaultValue={stage ?? ""} className="input-field">
          <option value="">Mərhələ (hamısı)</option>
          <option value="new">new</option>
          <option value="in_progress">in_progress</option>
          <option value="test_drive">test_drive</option>
          <option value="offer">offer</option>
          <option value="won">won</option>
          <option value="closed">closed</option>
        </select>
        <input name="source" defaultValue={source} placeholder="Mənbə (source)" className="input-field" />
        <div className="flex gap-2">
          <input type="hidden" name="pageSize" value={pageSize} />
          <button type="submit" className="btn-primary w-full justify-center">Filter</button>
        </div>
      </form>

      <AdminLeadsTable items={data.items} />
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-500">
          Toplam: <span className="font-semibold text-slate-900">{data.total}</span> | Səhifə {data.page}/{data.totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            href={data.page > 1 ? `/admin/crm?${new URLSearchParams([...qParams.entries(), ["page", String(data.page - 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Geri
          </Link>
          <Link
            href={data.page < data.totalPages ? `/admin/crm?${new URLSearchParams([...qParams.entries(), ["page", String(data.page + 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page >= data.totalPages ? "pointer-events-none opacity-50" : ""}`}
          >
            İrəli
          </Link>
        </div>
      </div>
    </div>
  );
}
