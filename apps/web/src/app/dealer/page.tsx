import { requirePageRoles } from "@/lib/rbac";
import { getDealerDashboard } from "@/server/dealer-store";
import { getDealerProfileSettingsForOwner } from "@/server/dealer-store";
import { LeadStageActions } from "@/components/dealer/lead-stage-actions";
import { BoostListingButton } from "@/components/listings/boost-listing-button";
import Link from "next/link";
import { DealerProfileSettingsForm } from "@/components/dealer/dealer-profile-settings-form";
import { getEffectiveBusinessProfileEntitlements, getEffectiveDealerPlan } from "@/server/business-plan-store";

function TrustScorePill({ score }: { score: number }) {
  const cls =
    score >= 80 ? "bg-emerald-100 text-emerald-700" :
    score >= 60 ? "bg-amber-100 text-amber-700" :
    "bg-red-100 text-red-700";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{score}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "badge-verified",
    draft: "badge-neutral",
    sold: "bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-0.5 rounded-full",
    new: "badge-verified",
    contacted: "badge-neutral",
    visit_booked: "bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-0.5 rounded-full",
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
  return <span className="badge-danger">SLA pozulub</span>;
}

export default async function DealerPortalPage() {
  const auth = await requirePageRoles(["admin", "dealer"]);
  if (!auth.ok) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="card p-10 text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="font-bold text-slate-900">Giriş tələb olunur</h2>
          <p className="mt-2 text-sm text-slate-500">Salon paneli yalnız dealer hesabları üçündür.</p>
          <Link href="/login" className="btn-primary mt-6 w-full justify-center">Daxil ol</Link>
        </div>
      </div>
    );
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
          <p className="mt-1 text-xs text-slate-400">
            Aktiv plan: <span className="font-semibold text-slate-600">{dealerPlan.nameAz}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {dealerPlan.analyticsEnabled ? (
            <Link href="/dealer/analytics" className="btn-secondary">Analitika</Link>
          ) : null}
          {dealerPlan.csvImportEnabled ? (
            <Link href="/dealer/import" className="btn-secondary">CSV import</Link>
          ) : (
            <span className="btn-secondary pointer-events-none opacity-60">CSV import (Peşəkar+)</span>
          )}
          <Link href="/publish" className="btn-primary">+ Yeni elan</Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: "Aktiv elan", value: totalActive, icon: "🚗" },
          { label: "Ümumi lead", value: totalLeads, icon: "📋" },
          { label: "Yeni lead", value: newLeads, icon: "🔔" },
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
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Analitika modulu yalnız <strong>Salon Peşəkar</strong> və <strong>Salon Korporativ</strong> planlarında aktivdir.
        </div>
      )}

      {profileSettings && (
        <div className="mb-8">
          <DealerProfileSettingsForm initialProfile={profileSettings} entitlements={profileEntitlements} />
        </div>
      )}

      {/* Inventory */}
      <div className="card overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">İnventar</h2>
          <span className="text-sm text-slate-400">{dashboard.inventory.length} elan</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
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
            <tbody className="divide-y divide-slate-100">
              {dashboard.inventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <Link href={`/listings/${item.id}`} className="hover:text-brand-600">
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-brand-700">{item.priceAzn.toLocaleString()} ₼</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-medium ${item.planType === "vip" ? "text-amber-700" : item.planType === "standard" ? "text-brand-700" : "text-slate-500"}`}>
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
                    <BoostListingButton listingId={item.id} currentPlan={item.planType ?? "free"} variant="compact" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead inbox */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Lead Qutusu</h2>
          {newLeads > 0 && <span className="badge-verified">{newLeads} yeni</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left">Müştəri</th>
                <th className="px-6 py-3 text-left">Elan</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Hərəkət</th>
                <th className="px-6 py-3 text-center">Cavab (dəq)</th>
                <th className="px-6 py-3 text-center">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboard.leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{lead.customerName}</div>
                    {lead.customerPhone && <div className="text-xs text-slate-500">{lead.customerPhone}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/listings/${lead.listingId}`} className="text-slate-600 hover:text-brand-600 text-sm">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
