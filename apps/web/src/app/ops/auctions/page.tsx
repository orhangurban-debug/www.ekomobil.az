import Link from "next/link";
import { OpsDocumentReviewButtons } from "@/components/auction/ops-document-review-buttons";
import { AUCTION_DOCUMENT_TYPE_LABELS } from "@/lib/auction-documents";
import { requirePageRoles } from "@/lib/rbac";
import { getAuctionServiceTelemetry, listAuctionAuditLogs, listAuctionOpsCases } from "@/server/auction-ops-store";
import { listPendingAuctionDocuments } from "@/server/auction-document-store";

function CaseBadge({ code }: { code: string }) {
  if (code === "DISPUTE") return <span className="badge-danger">Dispute</span>;
  if (code === "NO_SHOW") return <span className="badge-warning">No-show</span>;
  if (code === "SAME_DEVICE_MULTI_ACCOUNT") return <span className="badge-warning">Risk</span>;
  return <span className="badge-neutral">Ops review</span>;
}

export default async function AuctionOpsPage() {
  const auth = await requirePageRoles(["admin", "support"]);
  if (!auth.ok) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="card max-w-sm p-10 text-center">
          <h2 className="font-bold text-slate-900">Giriş tələb olunur</h2>
          <p className="mt-2 text-sm text-slate-500">Bu səhifə admin/support rolları üçündür.</p>
          <Link href="/login" className="btn-primary mt-6 w-full justify-center">Daxil ol</Link>
        </div>
      </div>
    );
  }

  const [cases, auditLogs, telemetry, pendingDocs] = await Promise.all([
    listAuctionOpsCases(),
    listAuctionAuditLogs(80),
    getAuctionServiceTelemetry(),
    listPendingAuctionDocuments(50)
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Auction Ops Console</h1>
        <p className="mt-1 text-slate-500">Dispute, no-show, outcome confirmation və audit axını</p>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-5">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">Service health</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{telemetry.healthOk ? "Healthy" : telemetry.connected ? "Degraded" : "Local only"}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">Accepted bids</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{telemetry.metrics?.bids?.accepted ?? 0}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">Rejected bids</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{telemetry.metrics?.bids?.rejected ?? 0}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">Viewer count</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{telemetry.metrics?.realtime?.viewerCount ?? 0}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wider text-slate-400">Lock wait avg</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{telemetry.metrics?.bids?.lockWait?.avg ?? 0} ms</div>
        </div>
      </section>

      <section className="card mb-6 overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Lot sənədləri — yoxlama gözləyir</h2>
          <p className="mt-1 text-xs text-slate-500">Satıcı yükləyib; ops təsdiqi / rəddi</p>
        </div>
        {pendingDocs.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">Gözləmədə sənəd yoxdur.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left">Lot</th>
                  <th className="px-6 py-3 text-left">Növ</th>
                  <th className="px-6 py-3 text-left">Fayl</th>
                  <th className="px-6 py-3 text-left">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{doc.titleSnapshot}</div>
                      <div className="font-mono text-xs text-slate-400">{doc.auctionId}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{AUCTION_DOCUMENT_TYPE_LABELS[doc.docType]}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px] truncate text-slate-700">{doc.originalFilename}</div>
                      <div className="text-xs text-slate-400">{(doc.byteSize / 1024).toFixed(1)} KB</div>
                    </td>
                    <td className="px-6 py-4">
                      <OpsDocumentReviewButtons docId={doc.id} auctionId={doc.auctionId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Açıq case-lər</h2>
          </div>
          {cases.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Hazırda açıq auksion case-i yoxdur.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Lot</th>
                    <th className="px-6 py-3 text-left">Səbəb</th>
                    <th className="px-6 py-3 text-left">Mesaj</th>
                    <th className="px-6 py-3 text-left">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map((item) => (
                    <tr key={`${item.auctionId}-${item.reasonCode}`} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{item.titleSnapshot}</div>
                        <div className="mt-1 font-mono text-xs text-slate-400">{item.auctionId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <CaseBadge code={item.reasonCode} />
                      </td>
                      <td className="px-6 py-4 text-slate-600">{item.message}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {item.slaDueAt ? new Date(item.slaDueAt).toLocaleString("az-AZ") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Audit timeline</h2>
          </div>
          {auditLogs.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">Hələ audit log yoxdur.</div>
          ) : (
            <div className="max-h-[720px] overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {auditLogs.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">{entry.titleSnapshot ?? entry.auctionId}</div>
                        <div className="mt-1 text-xs uppercase tracking-wider text-slate-400">{entry.actionType}</div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(entry.createdAt).toLocaleString("az-AZ")}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{entry.detail}</p>
                    {entry.actorUserId && (
                      <p className="mt-2 font-mono text-xs text-slate-400">actor: {entry.actorUserId}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
