import Link from "next/link";
import { AdminCreateIncidentForm } from "@/components/admin/admin-create-incident-form";
import { AdminIncidentsTable } from "@/components/admin/admin-incidents-table";
import { listIncidentInbox } from "@/server/admin-incident-store";

export default async function AdminIncidentsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 25);
  const q = typeof params.q === "string" ? params.q : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const severity = typeof params.severity === "string" ? params.severity : undefined;
  const sourceType = typeof params.sourceType === "string" ? (params.sourceType as "incident" | "manual_review" | "auction_case" | "all") : "all";
  const data = await listIncidentInbox({ page, pageSize, q, status, severity, sourceType });
  const qParams = new URLSearchParams();
  if (q) qParams.set("q", q);
  if (status) qParams.set("status", status);
  if (severity) qParams.set("severity", severity);
  if (sourceType) qParams.set("sourceType", sourceType);
  qParams.set("pageSize", String(pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Incident & Moderation Inbox</h2>
          <p className="mt-1 text-sm text-slate-500">
            Şikayətlər, qayda pozuntuları, saxta/yalan məlumatlar və risk case-lər.
          </p>
        </div>
        <Link href="/ops/reviews" className="btn-secondary">Ops reviews</Link>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-5">
        <input name="q" defaultValue={q} placeholder="Axtar: case, subject, title" className="input-field md:col-span-2" />
        <select name="sourceType" defaultValue={sourceType ?? "all"} className="input-field">
          <option value="all">Mənbə (hamısı)</option>
          <option value="incident">incident</option>
          <option value="manual_review">manual_review</option>
          <option value="auction_case">auction_case</option>
        </select>
        <select name="status" defaultValue={status ?? ""} className="input-field">
          <option value="">Status (hamısı)</option>
          <option value="open">open</option>
          <option value="triage">triage</option>
          <option value="in_review">in_review</option>
          <option value="actioned">actioned</option>
          <option value="resolved">resolved</option>
          <option value="dismissed">dismissed</option>
        </select>
        <div className="flex gap-2">
          <input type="hidden" name="severity" value={severity ?? ""} />
          <input type="hidden" name="pageSize" value={pageSize} />
          <button type="submit" className="btn-primary w-full justify-center">Filter</button>
        </div>
      </form>

      <AdminCreateIncidentForm />
      <AdminIncidentsTable items={data.items} />
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-500">
          Toplam: <span className="font-semibold text-slate-900">{data.total}</span> | Səhifə {data.page}/{data.totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            href={data.page > 1 ? `/admin/incidents?${new URLSearchParams([...qParams.entries(), ["page", String(data.page - 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Geri
          </Link>
          <Link
            href={data.page < data.totalPages ? `/admin/incidents?${new URLSearchParams([...qParams.entries(), ["page", String(data.page + 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page >= data.totalPages ? "pointer-events-none opacity-50" : ""}`}
          >
            İrəli
          </Link>
        </div>
      </div>
    </div>
  );
}
