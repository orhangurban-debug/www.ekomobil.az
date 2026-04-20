import { getCapacitySnapshot } from "@/server/capacity-monitor-store";

function toneClasses(tone: "slate" | "brand" | "warning" | "danger") {
  if (tone === "brand") return "text-[#0891B2]";
  if (tone === "warning") return "text-amber-700";
  if (tone === "danger") return "text-rose-700";
  return "text-slate-500";
}

function StatCard({
  label,
  value,
  tone = "slate",
  hint
}: {
  label: string;
  value: string;
  tone?: "slate" | "brand" | "warning" | "danger";
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className={`text-xs font-semibold uppercase tracking-wide ${toneClasses(tone)}`}>{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function AlertBox({
  severity,
  title,
  message,
  recommendation
}: {
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  recommendation: string;
}) {
  const classes =
    severity === "critical"
      ? "border-rose-200 bg-rose-50"
      : severity === "warning"
        ? "border-amber-200 bg-amber-50"
        : "border-sky-200 bg-sky-50";

  const badgeClasses =
    severity === "critical"
      ? "bg-rose-100 text-rose-700"
      : severity === "warning"
        ? "bg-amber-100 text-amber-700"
        : "bg-sky-100 text-sky-700";

  return (
    <div className={`rounded-2xl border p-4 ${classes}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${badgeClasses}`}>
          {severity === "critical" ? "Kritik" : severity === "warning" ? "Xəbərdarlıq" : "Məlumat"}
        </span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-slate-700">{message}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">Tövsiyə: {recommendation}</p>
    </div>
  );
}

export default async function AdminSystemPage() {
  const snapshot = await getCapacitySnapshot();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sistem monitorinqi və growth advisor</h2>
            <p className="mt-1 text-sm text-slate-500">
              Trafik proxy-ləri, qorunan API təzyiqi, auction service telemetriyası və DB health əsasında admin üçün
              növbəti mərhələ xəbərdarlıqları.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm">
            <div className="text-slate-500">Yekun qərar</div>
            <div className="font-semibold text-slate-900">{snapshot.recommendation.label}</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">{snapshot.recommendation.detail}</p>
        <p className="mt-3 text-xs text-slate-400">Yenilənib: {new Date(snapshot.generatedAt).toLocaleString("az-AZ")}</p>
      </div>

      {snapshot.alerts.length > 0 ? (
        <section className="space-y-3">
          {snapshot.alerts.map((alert) => (
            <AlertBox key={alert.id} {...alert} />
          ))}
        </section>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Hazırda kritik və ya xəbərdarlıq səviyyəli capacity siqnalı görünmür. Neon Launch ilə davam etmək normaldır.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Database health"
          value={snapshot.database.healthy ? "Healthy" : "Down"}
          tone={snapshot.database.healthy ? "brand" : "danger"}
          hint={snapshot.database.latencyMs !== null ? `${snapshot.database.latencyMs} ms probe` : "Probe failed"}
        />
        <StatCard
          label="Auction service"
          value={snapshot.auction.connected ? (snapshot.auction.healthOk ? "Healthy" : "Degraded") : "Offline"}
          tone={!snapshot.auction.connected ? "danger" : snapshot.auction.healthOk ? "brand" : "warning"}
          hint={`Viewer ${snapshot.auction.viewerCount}, lock wait avg ${snapshot.auction.lockWaitAvgMs} ms`}
        />
        <StatCard
          label="Traffic proxy 1h"
          value={snapshot.traffic.analytics1h.toLocaleString("az-AZ")}
          tone={snapshot.traffic.analytics1h >= 800 ? "warning" : "slate"}
          hint={`24 saat: ${snapshot.traffic.analytics24h.toLocaleString("az-AZ")} analytics event`}
        />
        <StatCard
          label="Protected API 15m"
          value={snapshot.protectedApi.protectedRequests15m.toLocaleString("az-AZ")}
          tone={snapshot.protectedApi.protectedRequests15m >= 3000 ? "warning" : "slate"}
          hint={`${snapshot.protectedApi.distinctKeys15m.toLocaleString("az-AZ")} fərqli limit açarı`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-bold text-slate-900">Traffic və API proxy-ləri</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 text-slate-500">Analytics events (15 dəqiqə)</td>
                  <td className="py-3 text-right font-semibold text-slate-900">{snapshot.traffic.analytics15m.toLocaleString("az-AZ")}</td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-500">Analytics events (1 saat)</td>
                  <td className="py-3 text-right font-semibold text-slate-900">{snapshot.traffic.analytics1h.toLocaleString("az-AZ")}</td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-500">Analytics events (24 saat)</td>
                  <td className="py-3 text-right font-semibold text-slate-900">{snapshot.traffic.analytics24h.toLocaleString("az-AZ")}</td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-500">Lead event-lər (24 saat)</td>
                  <td className="py-3 text-right font-semibold text-slate-900">{snapshot.traffic.leads24h.toLocaleString("az-AZ")}</td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-500">Listing publish proxy (24 saat)</td>
                  <td className="py-3 text-right font-semibold text-slate-900">{snapshot.traffic.listings24h.toLocaleString("az-AZ")}</td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-500">Protected API counts (15 dəqiqə)</td>
                  <td className="py-3 text-right font-semibold text-slate-900">{snapshot.protectedApi.protectedRequests15m.toLocaleString("az-AZ")}</td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-500">OAuth start counts (15 dəqiqə)</td>
                  <td className="py-3 text-right font-semibold text-slate-900">{snapshot.protectedApi.oauth15m.toLocaleString("az-AZ")}</td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-500">Login attempts (15 dəqiqə)</td>
                  <td className="py-3 text-right font-semibold text-slate-900">{snapshot.protectedApi.login15m.toLocaleString("az-AZ")}</td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-500">Bid pressure (15 dəqiqə)</td>
                  <td className="py-3 text-right font-semibold text-slate-900">{snapshot.protectedApi.bid15m.toLocaleString("az-AZ")}</td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-500">Payment pressure (15 dəqiqə)</td>
                  <td className="py-3 text-right font-semibold text-slate-900">{snapshot.protectedApi.payment15m.toLocaleString("az-AZ")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-bold text-slate-900">Runtime və upgrade siqnalları</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-slate-500">Web DB pool</div>
              <div className="mt-1 font-semibold text-slate-900">PG_POOL_MAX={snapshot.database.poolMax}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-slate-500">Rate limit fail-open</div>
              <div className="mt-1 font-semibold text-slate-900">{snapshot.database.rateLimitFailOpen ? "Aktiv" : "Bağlı"}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-slate-500">Canlı auksionlar</div>
              <div className="mt-1 font-semibold text-slate-900">{snapshot.overview.liveAuctions.toLocaleString("az-AZ")}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-slate-500">Aktiv elanlar</div>
              <div className="mt-1 font-semibold text-slate-900">{snapshot.overview.activeListings.toLocaleString("az-AZ")}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-slate-500">Bid accepted / rejected</div>
              <div className="mt-1 font-semibold text-slate-900">
                {snapshot.auction.acceptedBids.toLocaleString("az-AZ")} / {snapshot.auction.rejectedBids.toLocaleString("az-AZ")}
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-slate-200 p-3 text-slate-600">
              Bu panel host CPU/RAM deyil, tətbiq daxilində görünən traffic proxy və service health siqnallarını göstərir.
              Neon, Vercel və Redis provider dashboard-ları ilə birlikdə izlənməlidir.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
