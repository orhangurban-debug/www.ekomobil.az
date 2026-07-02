"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { USER_REPORT_REASON_LABELS, type UserReportReason } from "@/lib/user-reports";
import type { UserReportRecord } from "@/server/user-report-store";

export function ReportDefensePanel({ reports }: { reports: UserReportRecord[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submitDefense(reportId: string, event: FormEvent) {
    event.preventDefault();
    const defense = drafts[reportId]?.trim() ?? "";
    if (defense.length < 30) {
      setError("Müdafiə sübutu ən az 30 simvol olmalıdır.");
      return;
    }
    setLoadingId(reportId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/reports/${reportId}/defense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defense })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error || "Müdafiə göndərilmədi.");
        return;
      }
      setMessage("Müdafiə qeydə alındı. Komanda hər iki tərəfin sübutunu yoxlayacaq.");
      router.refresh();
    } catch {
      setError("Şəbəkə xətası baş verdi.");
    } finally {
      setLoadingId(null);
    }
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Hazırda cavab gözləyən şikayət yoxdur.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl alert-danger border px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {reports.map((report) => (
        <div key={report.id} className="rounded-2xl border border-slate-900/10 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {USER_REPORT_REASON_LABELS[report.reasonCode as UserReportReason]}
              </p>
              {report.listingId && (
                <Link href={`/listings/${report.listingId}`} className="text-xs text-[#0057FF] hover:underline">
                  Elana bax →
                </Link>
              )}
            </div>
            {report.defenseDueAt && (
              <p className="text-xs text-amber-700">
                Son müdafiə tarixi:{" "}
                {new Date(report.defenseDueAt).toLocaleString("az-AZ", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            )}
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl bg-white/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Şikayət</p>
              <p className="mt-1 text-slate-700">{report.description}</p>
            </div>
            {report.reporterEvidence && (
              <div className="rounded-xl bg-amber-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Şikayət edənin sübutu</p>
                <p className="mt-1 text-slate-700">{report.reporterEvidence}</p>
              </div>
            )}
          </div>

          <form onSubmit={(event) => void submitDefense(report.id, event)} className="mt-4 space-y-3">
            <div>
              <label className="label">Müdafiə sübutunuz (məcburi)</label>
              <textarea
                className="input-field min-h-28"
                value={drafts[report.id] ?? ""}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [report.id]: e.target.value }))}
                placeholder="Mülkiyyət sənədi, VIN yoxlaması, real foto, yazışma və s."
                minLength={30}
                required
              />
            </div>
            <p className="text-xs text-slate-500">
              Müdafiə sübutu təqdim etməsəniz, şikayət müddət bitdikdən sonra hüquq-mühafizə orqanlarına ötürülə bilər.
            </p>
            <button
              type="submit"
              disabled={loadingId === report.id}
              className="btn-primary disabled:opacity-50"
            >
              {loadingId === report.id ? "Göndərilir..." : "Müdafiəni göndər"}
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
