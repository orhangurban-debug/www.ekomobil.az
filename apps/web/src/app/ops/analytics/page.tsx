import { listAnalyticsEvents } from "@/server/analytics-store";
import { requirePageRoles } from "@/lib/rbac";
import Link from "next/link";

function EventBadge({ name }: { name: string }) {
  const colors: Record<string, string> = {
    listing_published: "badge-verified",
    listing_publish_attempted: "bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-0.5 rounded-full",
    vin_check_completed: "badge-verified",
    vin_check_failed: "badge-danger",
    mileage_flag_generated: "badge-warning",
    lead_created: "bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded-full",
    deal_marked_sold: "badge-verified"
  };
  return <span className={colors[name] || "badge-neutral"}>{name.replaceAll("_", " ")}</span>;
}

export default async function AnalyticsMonitorPage() {
  const auth = await requirePageRoles(["admin", "support", "viewer"]);
  if (!auth.ok) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="card p-10 text-center max-w-sm">
          <h2 className="font-bold text-slate-900">Giriş tələb olunur</h2>
          <p className="mt-2 text-sm text-slate-500">Bu səhifə analytics rolları üçündür.</p>
          <Link href="/login" className="btn-primary mt-6 w-full justify-center">Daxil ol</Link>
        </div>
      </div>
    );
  }

  const events = await listAnalyticsEvents(100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Monitor</h1>
          <p className="text-slate-500 mt-1">North Star və əməliyyat event axını</p>
        </div>
        <span className="badge-neutral text-sm px-3 py-1">{events.length} event</span>
      </div>

      {events.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-3xl">📊</div>
          <h3 className="font-semibold text-slate-900">Hələ event yoxdur</h3>
          <p className="mt-1 text-sm text-slate-500">İstifadəçilər elan yerləşdirdikcə eventlər burada görünəcək.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left">Event</th>
                  <th className="px-6 py-3 text-left">Zaman</th>
                  <th className="px-6 py-3 text-left">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((entry, idx) => (
                  <tr key={`${entry.eventName}-${idx}`} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <EventBadge name={entry.eventName} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleDateString("az-AZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4">
                      <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap max-w-xs">
                        {JSON.stringify(entry.payload, null, 2)}
                      </pre>
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
