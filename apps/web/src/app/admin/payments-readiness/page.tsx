import { getPaymentIntegrationReadiness, listBankPaymentOrders } from "@/server/payment-readiness-store";

function HealthBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {label}
    </span>
  );
}

export default async function AdminPaymentsReadinessPage() {
  const [readiness, orders] = await Promise.all([
    Promise.resolve(getPaymentIntegrationReadiness()),
    listBankPaymentOrders(120)
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Bank ödəniş sistemi test hazırlığı</h2>
        <p className="mt-1 text-sm text-slate-500">
          Bank əməkdaşlarının yoxlaması üçün texniki readiness, callback URL-lər və Order ID siyahısı.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Provider rejimi</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{readiness.mode}</p>
          <div className="mt-2">
            <HealthBadge
              ok={readiness.liveReady}
              label={
                readiness.productionReady
                  ? "Production hazırdır"
                  : readiness.liveReady
                    ? "Bank test/UAT hazırdır"
                    : "Checkout hazır deyil"
              }
            />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Gateway</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{readiness.gatewayLabel}</p>
          <p className="mt-2 text-xs text-slate-500">Merchant: {readiness.merchantId ?? "—"}</p>
          <p className="mt-2 text-xs text-slate-500">Terminal: {readiness.terminalId ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">API host</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 break-all">{readiness.apiBaseUrl}</p>
          {readiness.usesSandboxEndpoint && (
            <p className="mt-2 text-xs font-medium text-amber-700">
              Live rejim üçün xəbərdarlıq: test/sandbox endpoint istifadə olunur.
            </p>
          )}
        </div>
      </div>

      {readiness.readinessWarnings.length > 0 && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <h3 className="text-base font-semibold text-sky-900">Gateway qeydləri</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-sky-800">
            {readiness.readinessWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {readiness.liveReadinessIssues.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h3 className="text-base font-semibold text-amber-900">Checkout üçün çatışmayanlar</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {readiness.liveReadinessIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {readiness.liveReady && !readiness.productionReady && readiness.productionReadinessIssues.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h3 className="text-base font-semibold text-amber-900">Production go-live üçün qalanlar</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {readiness.productionReadinessIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">Banka veriləcək callback/webhook URL-lər</h3>
        <div className="mt-3 grid gap-2 text-sm text-slate-700">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <strong>Listing callback:</strong> <span className="font-mono">{readiness.callbackUrls.listingPlan}</span>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <strong>Business plan callback:</strong> <span className="font-mono">{readiness.callbackUrls.businessPlan}</span>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <strong>Auction deposit callback:</strong> <span className="font-mono">{readiness.callbackUrls.auctionDeposit}</span>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <strong>Auction service callback:</strong> <span className="font-mono">{readiness.callbackUrls.auctionService}</span>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <strong>Preauth callback:</strong> <span className="font-mono">{readiness.callbackUrls.preauth}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Webhook event-lər: {readiness.webhookEvents.join(", ")}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Order ID və payment mapping</h3>
          <a
            href="/api/admin/payments-readiness/orders?format=csv&limit=2000"
            className="btn-secondary text-xs"
          >
            CSV export (banka göndərmək üçün)
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Channel</th>
                <th className="px-3 py-2 text-left">Internal ID</th>
                <th className="px-3 py-2 text-left">Order ID</th>
                <th className="px-3 py-2 text-left">Remote ID</th>
                <th className="px-3 py-2 text-left">Məbləğ</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Tarix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((row) => (
                <tr key={`${row.channel}-${row.internalPaymentId}`}>
                  <td className="px-3 py-2">{row.channel}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">{row.internalPaymentId}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">{row.orderId}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">{row.remoteOrderId ?? "—"}</td>
                  <td className="px-3 py-2">{row.amountAzn} ₼</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{new Date(row.createdAt).toLocaleString("az-AZ")}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-slate-400" colSpan={7}>
                    Hələ payment order tapılmadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">Bank test checklist (P1.1–P1.4)</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>P1.1 — Create payment, redirect checkout, ödənişi tamamlama axını.</li>
          <li>
            P1.2 — Payment status yoxlaması (<code>GET /v1/payments/{"{paymentId}"}</code>).
          </li>
          <li>P1.3 — Refund yaradılması (`POST /v1/refunds`).</li>
          <li>
            P1.4 — Refund status yoxlaması (<code>GET /v1/refunds/{"{refundId}"}</code>).
          </li>
          <li>Hər idempotent API üçün `X-Idempotency-Key` və callback imza doğrulaması.</li>
        </ul>
      </div>
    </div>
  );
}
