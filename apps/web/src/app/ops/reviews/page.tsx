import { listManualReviews } from "@/server/review-store";
import { requirePageRoles } from "@/lib/rbac";
import Link from "next/link";

function SeverityBadge({ code }: { code: string }) {
  if (code.includes("HIGH_RISK")) return <span className="badge-danger">Yüksək risk</span>;
  if (code.includes("PARTIAL")) return <span className="badge-warning">Qismən uyğunsuzluq</span>;
  return <span className="badge-neutral">{code}</span>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "open") return <span className="badge-warning">Açıq</span>;
  if (status === "in_review") return <span className="badge-neutral">Baxılır</span>;
  if (status === "rejected") return <span className="badge-danger">Rədd edildi</span>;
  return <span className="badge-verified">Təsdiqləndi</span>;
}

export default async function ReviewQueuePage() {
  const auth = await requirePageRoles(["admin", "support"]);
  if (!auth.ok) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="card p-10 text-center max-w-sm">
          <h2 className="font-bold text-slate-900">Giriş tələb olunur</h2>
          <p className="mt-2 text-sm text-slate-500">Bu səhifə admin/support rolları üçündür.</p>
          <Link href="/login" className="btn-primary mt-6 w-full justify-center">Daxil ol</Link>
        </div>
      </div>
    );
  }

  const items = await listManualReviews();
  const openCount = items.filter((i) => i.status === "open" || i.status === "in_review").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manual Baxış Növbəsi</h1>
          <p className="text-slate-500 mt-1">Yüksək risk etibarı əl ilə yoxlama tələb edir</p>
        </div>
        {openCount > 0 && (
          <span className="badge-warning text-sm px-3 py-1">{openCount} açıq case</span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900">Növbə boşdur</h3>
          <p className="mt-1 text-sm text-slate-500">Hazırda yoxlanılacaq case yoxdur.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left">Case ID</th>
                  <th className="px-6 py-3 text-left">Elan</th>
                  <th className="px-6 py-3 text-left">Səbəb</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-left">SLA</th>
                  <th className="px-6 py-3 text-left">Yaranma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.id.slice(0, 8)}…</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{item.listingId}</td>
                    <td className="px-6 py-4">
                      <SeverityBadge code={item.reasonCode} />
                      <p className="mt-1 text-xs text-slate-400 max-w-xs truncate">{item.message}</p>
                    </td>
                    <td className="px-6 py-4 text-center"><StatusBadge status={item.status} /></td>
                    <td className="px-6 py-4 text-slate-500">
                      {item.slaDueAt ? new Date(item.slaDueAt).toLocaleDateString("az-AZ") : "24 saat"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString("az-AZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
