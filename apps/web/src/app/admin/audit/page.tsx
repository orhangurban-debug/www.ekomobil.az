import Link from "next/link";
import { listAdminAuditLogs } from "@/server/admin-audit-store";

export default async function AdminAuditPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 25);
  const q = typeof params.q === "string" ? params.q : undefined;
  const entityType = typeof params.entityType === "string" ? params.entityType : undefined;
  const actionType = typeof params.actionType === "string" ? params.actionType : undefined;
  const data = await listAdminAuditLogs({ page, pageSize, q, entityType, actionType });
  const qParams = new URLSearchParams();
  if (q) qParams.set("q", q);
  if (entityType) qParams.set("entityType", entityType);
  if (actionType) qParams.set("actionType", actionType);
  qParams.set("pageSize", String(pageSize));
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Admin audit jurnalı</h2>
        <p className="mt-1 text-sm text-slate-500">Bütün admin dəyişiklikləri üçün izləmə jurnalı.</p>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input name="q" defaultValue={q} placeholder="Axtar" className="input-field md:col-span-2" />
        <input name="entityType" defaultValue={entityType} placeholder="Obyekt tipi" className="input-field" />
        <div className="flex gap-2">
          <input type="hidden" name="actionType" value={actionType ?? ""} />
          <input type="hidden" name="pageSize" value={pageSize} />
          <button type="submit" className="btn-primary w-full justify-center">Filtrlə</button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Tarix</th>
              <th className="px-4 py-3 text-left">Əməliyyat</th>
              <th className="px-4 py-3 text-left">Obyekt</th>
              <th className="px-4 py-3 text-left">İcraçı</th>
              <th className="px-4 py-3 text-left">Səbəb</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("az-AZ")}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{item.actionType}</td>
                <td className="px-4 py-3 text-slate-700">{item.entityType}:{item.entityId || "-"}</td>
                <td className="px-4 py-3 text-slate-700">{item.actorRole || "-"} / {item.actorUserId || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{item.reason || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-500">
          Cəmi: <span className="font-semibold text-slate-900">{data.total}</span> | Səhifə {data.page}/{data.totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            href={data.page > 1 ? `/admin/audit?${new URLSearchParams([...qParams.entries(), ["page", String(data.page - 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Geri
          </Link>
          <Link
            href={data.page < data.totalPages ? `/admin/audit?${new URLSearchParams([...qParams.entries(), ["page", String(data.page + 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page >= data.totalPages ? "pointer-events-none opacity-50" : ""}`}
          >
            İrəli
          </Link>
        </div>
      </div>
    </div>
  );
}
