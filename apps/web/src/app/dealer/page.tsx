import { requirePageRoles } from "@/lib/rbac";
import { getDealerDashboard } from "@/server/dealer-store";
import { getDealerProfileSettingsForOwner } from "@/server/dealer-store";
import { LeadStageActions } from "@/components/dealer/lead-stage-actions";
import { BoostListingButton } from "@/components/listings/boost-listing-button";
import Link from "next/link";
import { DealerProfileSettingsForm } from "@/components/dealer/dealer-profile-settings-form";
import { getEffectiveBusinessProfileEntitlements, getEffectiveDealerPlan } from "@/server/business-plan-store";
import { RoleAccessGate } from "@/components/ui/role-access-gate";

function TrustScorePill({ score }: { score: number }) {
  const cls =
    score >= 80 ? "bg-emerald-100 text-emerald-700" :
    score >= 60 ? "bg-amber-100 text-amber-700" :
    "bg-red-500/15 text-red-700";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{score}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "badge-verified",
    draft: "badge-neutral",
    sold: "bg-white/63 text-slate-500 text-xs font-semibold px-2.5 py-0.5 rounded-full",
    new: "badge-verified",
    contacted: "badge-neutral",
    visit_booked: "bg-[#0057FF]/10 text-[#0057FF] text-xs font-semibold px-2.5 py-0.5 rounded-full",
    closed: "badge-neutral"
  };
  const labels: Record<string, string> = {
    active: "Aktiv", draft: "Qaralama", sold: "Satılıb",
    new: "Yeni", contacted: "Əlaqə qurulub", visit_booked: "Baxış var", closed: "Bağlı"
  };
  return <span className={map[status] || "badge-neutral"}>{labels[status] || status}</span>;
}

function SlaBadge({ minutes }: { minutes: number }) {
  if (minutes <= 15) return <span className="badge-verified">Norma</span>;
  if (minutes <= 30) return <span className="badge-warning">Yavaş</span>;
  return <span className="badge-danger">Cavab müddəti aşılıb</span>;
}

export default async function DealerPortalPage() {
  const auth = await requirePageRoles(["admin", "dealer"]);
  if (!auth.ok) {
    return <RoleAccessGate reason={auth.reason} preset="dealer-panel" />;
  }

  const [dashboard, dealerPlan, profileSettings, profileEntitlements] = await Promise.all([
    getDealerDashboard(auth.user.id),
    getEffectiveDealerPlan(auth.user.id),
    getDealerProfileSettingsForOwner(auth.user.id),
    getEffectiveBusinessProfileEntitlements(auth.user.id)
  ]);
  const totalActive = dashboard.inventory.filter((i) => i.status === "active").length;
  const totalLeads = dashboard.leads.length;
  const newLeads = dashboard.leads.filter((l) => l.stage === "new").length;
  const avgResponse = dashboard.leads.length > 0
    ? Math.round(dashboard.leads.reduce((s, l) => s + (l.responseTimeMinutes ?? 0), 0) / dashboard.leads.length)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Salon Paneli</h1>
          <p className="text-slate-500 mt-1">{dashboard.dealerName} • {dashboard.city}</p>
        </div>
        <div className="flex gap-2">
          {dealerPlan.analyticsEnabled ? (
            <Link href="/dealer/analytics" className="btn-secondary">Analitika</Link>
          ) : null}
          {dealerPlan.csvImportEnabled ? (
            <Link href="/dealer/import" className="btn-secondary">CSV idxalı</Link>
          ) : (
            <span className="btn-secondary pointer-events-none opacity-60">CSV idxalı (Peşəkar+)</span>
          )}
        </div>
      </div>

      {/* Abunə upgrade banner */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-900/10 bg-white/60 px-6 py-4">
        <div>
          <p className="text-sm font-medium text-slate-900">
            Aktiv plan: <span className="font-semibold text-[#0057FF]">{dealerPlan.nameAz}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Plan yüksəltmə, aylıq yeniləmə və tam qiymət cədvəli üçün Qiymətlər səhifəsinə keçin.
          </p>
        </div>
        <Link href="/pricing#dealer" className="shrink-0 rounded-xl border border-[#0057FF]/30 bg-[#0057FF]/5 px-4 py-2 text-sm font-semibold text-[#0057FF] transition hover:bg-[#0057FF]/10">
          Planları gör →
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-200 bg-violet-50/70 px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-violet-900">AI ilə avtomobil elanı</p>
          <p className="mt-1 text-xs text-violet-800/80">
            Hər elan = <strong>1 avtomobil</strong>. Elan başına {dealerPlan.perListingMaxImages} şəkil, gündə{" "}
            {Math.min(40, Math.max(8, Math.ceil(dealerPlan.maxActiveListings / 4)))} AI analiz ({dealerPlan.nameAz} planı).
            Bir neçə avtomobil üçün ayrı elan və ya CSV idxalı istifadə edin.
          </p>
        </div>
        <Link href="/publish" className="shrink-0 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
          Yeni elan + AI →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: "Aktiv elan", value: totalActive, icon: "🚗" },
          { label: "Ümumi sorğu", value: totalLeads, icon: "📋" },
          { label: "Yeni sorğu", value: newLeads, icon: "🔔" },
          {
            label: dealerPlan.analyticsEnabled ? "Ort. cavab (dəq)" : "Analitika",
            value: dealerPlan.analyticsEnabled ? avgResponse : "—",
            icon: "⏱"
          }
        ].map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <div className="text-2xl mb-1">{kpi.icon}</div>
            <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>
      {!dealerPlan.analyticsEnabled && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl alert-warning border px-4 py-3 text-sm text-amber-700">
          <span>Analitika modulu yalnız <strong>Salon Peşəkar</strong> və <strong>Salon Korporativ</strong> planlarında aktivdir.</span>
          <Link href="/pricing#dealer" className="shrink-0 text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-700">
            Plana bax →
          </Link>
        </div>
      )}

      {profileSettings && (
        <div className="mb-8">
          <DealerProfileSettingsForm initialProfile={profileSettings} entitlements={profileEntitlements} />
        </div>
      )}

      {/* Inventory */}
      <div className="card overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900/10">
          <h2 className="font-semibold text-slate-900">İnventar</h2>
          <span className="text-sm text-slate-400">{dashboard.inventory.length} elan</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left">Elan</th>
                <th className="px-6 py-3 text-right">Qiymət</th>
                <th className="px-6 py-3 text-center">Plan</th>
                <th className="px-6 py-3 text-center">Etibar</th>
                <th className="px-6 py-3 text-center">Media</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Hərəkət</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/10">
              {dashboard.inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                    Hələ elan yoxdur.{" "}
                    <Link href="/publish" className="font-medium text-[#0057FF] hover:underline">İlk elanı yerləşdir →</Link>
                  </td>
                </tr>
              ) : (
                dashboard.inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/5 transition">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <Link href={`/listings/${item.id}`} className="hover:text-[#0057FF]">
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-[#0057FF]">{item.priceAzn.toLocaleString()} ₼</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-medium ${item.planType === "vip" ? "text-amber-700" : item.planType === "standard" ? "text-[#0057FF]" : "text-slate-500"}`}>
                        {item.planType === "vip" ? "VIP" : item.planType === "standard" ? "Standart" : "Pulsuz"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center"><TrustScorePill score={item.trustScore} /></td>
                    <td className="px-6 py-4 text-center">
                      {item.mediaComplete
                        ? <span className="badge-verified">Tam</span>
                        : <span className="badge-warning">Çatışmır</span>}
                    </td>
                    <td className="px-6 py-4 text-center"><StatusBadge status={item.status} /></td>
                    <td className="px-6 py-4 text-center">
                      <BoostListingButton listingId={item.id} currentPlan={item.planType ?? "free"} listingPriceAzn={item.priceAzn} variant="compact" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead inbox */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900/10">
          <h2 className="font-semibold text-slate-900">Lead Qutusu</h2>
          {newLeads > 0 && <span className="badge-verified">{newLeads} yeni</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left">Müştəri</th>
                <th className="px-6 py-3 text-left">Elan</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Hərəkət</th>
                <th className="px-6 py-3 text-center">Cavab (dəq)</th>
                <th className="px-6 py-3 text-center">Cavab müddəti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/10">
              {dashboard.leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    Hələ müştəri sorğusu yoxdur.
                  </td>
                </tr>
              ) : (
                dashboard.leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-900/5 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{lead.customerName}</div>
                      {lead.customerPhone && <div className="text-xs text-slate-500">{lead.customerPhone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/listings/${lead.listingId}`} className="text-slate-600 hover:text-[#0057FF] text-sm">
                        #{lead.listingId.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center"><StatusBadge status={lead.stage} /></td>
                    <td className="px-6 py-4">
                      <LeadStageActions leadId={lead.id} currentStage={lead.stage} />
                    </td>
                    <td className="px-6 py-4 text-center text-slate-700">{lead.responseTimeMinutes ?? 0}</td>
                    <td className="px-6 py-4 text-center"><SlaBadge minutes={lead.responseTimeMinutes ?? 0} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
