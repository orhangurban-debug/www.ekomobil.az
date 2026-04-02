import Link from "next/link";
import { listAuctionOpsCases } from "@/server/auction-ops-store";

export default async function AdminAuctionsPage() {
  const cases = await listAuctionOpsCases();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Auksion nəzarəti</h2>
          <p className="mt-1 text-sm text-slate-500">
            Riskli lotlar və operativ müdaxilə tələb edən halların prioritet görünüşü.
          </p>
        </div>
        <Link href="/ops/auctions" className="btn-secondary">
          Ops panelini aç
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Case</th>
              <th className="px-4 py-3 text-left">Kod</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">SLA</th>
              <th className="px-4 py-3 text-left">Keçid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.map((item) => (
              <tr key={`${item.reasonCode}-${item.auctionId}-${item.createdAt}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{item.titleSnapshot}</p>
                  <p className="text-xs text-slate-500">{item.message}</p>
                </td>
                <td className="px-4 py-3"><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{item.reasonCode}</span></td>
                <td className="px-4 py-3 text-slate-700">{item.status}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {item.slaDueAt ? new Date(item.slaDueAt).toLocaleString("az-AZ") : "-"}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/auction/${item.auctionId}`} className="text-sm font-semibold text-[#0891B2] hover:underline">
                    Lotu aç
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
