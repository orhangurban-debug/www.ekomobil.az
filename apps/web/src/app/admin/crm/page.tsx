import { getCrmSnapshot, listAdminLeads } from "@/server/admin-store";

export default async function AdminCrmPage() {
  const [snapshot, leads] = await Promise.all([getCrmSnapshot(), listAdminLeads(120)]);
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

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Müştəri</th>
              <th className="px-4 py-3 text-left">Elan</th>
              <th className="px-4 py-3 text-left">Mərhələ</th>
              <th className="px-4 py-3 text-left">SLA</th>
              <th className="px-4 py-3 text-left">Tarix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{lead.customerName}</div>
                  <div className="text-xs text-slate-500">{lead.customerPhone || lead.customerEmail || "-"}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{lead.listingTitle || "-"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {lead.stage}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{lead.responseTimeMinutes ?? "-"} dəq</td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(lead.createdAt).toLocaleString("az-AZ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
