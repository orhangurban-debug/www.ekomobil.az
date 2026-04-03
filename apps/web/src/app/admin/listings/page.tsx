import Link from "next/link";
import { AdminListingsTable } from "@/components/admin/admin-listings-table";
import { listAdminListingsPaged } from "@/server/admin-store";

export default async function AdminListingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 25);
  const q = typeof params.q === "string" ? params.q : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const listingKind = typeof params.listingKind === "string" ? params.listingKind : undefined;
  const sellerType = typeof params.sellerType === "string" ? params.sellerType : undefined;
  const city = typeof params.city === "string" ? params.city : undefined;
  const data = await listAdminListingsPaged({
    page,
    pageSize,
    q,
    status,
    listingKind,
    sellerType,
    city
  });
  const qParams = new URLSearchParams();
  if (q) qParams.set("q", q);
  if (status) qParams.set("status", status);
  if (listingKind) qParams.set("listingKind", listingKind);
  if (sellerType) qParams.set("sellerType", sellerType);
  if (city) qParams.set("city", city);
  qParams.set("pageSize", String(pageSize));
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Elan idarəetməsi</h2>
        <p className="mt-1 text-sm text-slate-500">
          Elan statusları, plan növü və satıcı tipinə görə moderasiya görünüşü.
        </p>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-6">
        <input name="q" defaultValue={q} placeholder="Axtar: başlıq/marka/model/VIN" className="input-field md:col-span-2" />
        <select name="status" defaultValue={status ?? ""} className="input-field">
          <option value="">Status (hamısı)</option>
          <option value="active">Aktiv</option>
          <option value="pending_review">Yoxlamada</option>
          <option value="rejected">Rədd edilib</option>
          <option value="archived">Arxivdədir</option>
        </select>
        <select name="listingKind" defaultValue={listingKind ?? ""} className="input-field">
          <option value="">Növ (hamısı)</option>
          <option value="vehicle">Nəqliyyat vasitəsi</option>
          <option value="part">Ehtiyat hissə</option>
        </select>
        <select name="sellerType" defaultValue={sellerType ?? ""} className="input-field">
          <option value="">Satıcı (hamısı)</option>
          <option value="private">Fərdi</option>
          <option value="dealer">Diler</option>
        </select>
        <input name="city" defaultValue={city} placeholder="Şəhər" className="input-field" />
        <div className="flex gap-2">
          <input type="hidden" name="pageSize" value={pageSize} />
          <button type="submit" className="btn-primary w-full justify-center">Filtrlə</button>
        </div>
      </form>

      <AdminListingsTable items={data.items} />
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-500">
          Cəmi: <span className="font-semibold text-slate-900">{data.total}</span> | Səhifə {data.page}/{data.totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            href={data.page > 1 ? `/admin/listings?${new URLSearchParams([...qParams.entries(), ["page", String(data.page - 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Geri
          </Link>
          <Link
            href={data.page < data.totalPages ? `/admin/listings?${new URLSearchParams([...qParams.entries(), ["page", String(data.page + 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page >= data.totalPages ? "pointer-events-none opacity-50" : ""}`}
          >
            İrəli
          </Link>
        </div>
      </div>
    </div>
  );
}
