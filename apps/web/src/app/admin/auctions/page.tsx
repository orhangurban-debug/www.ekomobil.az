import Link from "next/link";
import { AdminAuctionsTable } from "@/components/admin/admin-auctions-table";
import { listAdminAuctionsPaged } from "@/server/admin-store";

export default async function AdminAuctionsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 25);
  const q = typeof params.q === "string" ? params.q : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const mode = typeof params.mode === "string" ? params.mode : undefined;
  const freezeBidding = typeof params.freezeBidding === "string" ? (params.freezeBidding as "true" | "false") : undefined;
  const data = await listAdminAuctionsPaged({ page, pageSize, q, status, mode, freezeBidding });
  const qParams = new URLSearchParams();
  if (q) qParams.set("q", q);
  if (status) qParams.set("status", status);
  if (mode) qParams.set("mode", mode);
  if (freezeBidding) qParams.set("freezeBidding", freezeBidding);
  qParams.set("pageSize", String(pageSize));
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

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-6">
        <input name="q" defaultValue={q} placeholder="Axtar: lot ID/ad/satıcı" className="input-field md:col-span-2" />
        <input name="status" defaultValue={status} placeholder="Status filter" className="input-field" />
        <input name="mode" defaultValue={mode} placeholder="Mode filter" className="input-field" />
        <select name="freezeBidding" defaultValue={freezeBidding ?? ""} className="input-field">
          <option value="">Freeze (hamısı)</option>
          <option value="true">Frozen</option>
          <option value="false">Not frozen</option>
        </select>
        <div className="flex gap-2">
          <input type="hidden" name="pageSize" value={pageSize} />
          <button type="submit" className="btn-primary w-full justify-center">Filter</button>
        </div>
      </form>

      <AdminAuctionsTable items={data.items} />
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-500">
          Toplam: <span className="font-semibold text-slate-900">{data.total}</span> | Səhifə {data.page}/{data.totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            href={data.page > 1 ? `/admin/auctions?${new URLSearchParams([...qParams.entries(), ["page", String(data.page - 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Geri
          </Link>
          <Link
            href={data.page < data.totalPages ? `/admin/auctions?${new URLSearchParams([...qParams.entries(), ["page", String(data.page + 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page >= data.totalPages ? "pointer-events-none opacity-50" : ""}`}
          >
            İrəli
          </Link>
        </div>
      </div>
    </div>
  );
}
