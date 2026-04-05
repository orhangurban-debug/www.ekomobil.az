import Link from "next/link";
import { AdminBusinessProfilesTable } from "@/components/admin/admin-business-profiles-table";
import { listAdminBusinessProfilesPaged } from "@/server/admin-store";

export default async function AdminBusinessProfilesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 25);
  const q = typeof params.q === "string" ? params.q : undefined;
  const data = await listAdminBusinessProfilesPaged({ page, pageSize, q });
  const qParams = new URLSearchParams();
  if (q) qParams.set("q", q);
  qParams.set("pageSize", String(pageSize));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Biznes profil moderasiyası</h2>
        <p className="mt-1 text-sm text-slate-500">
          Mağaza və salon profilinin görünürlüğünü, təsdiq statusunu və kontakt yayımlanmasını idarə edin.
        </p>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Axtar: profil adı, şəhər, owner email"
          className="input-field md:col-span-4"
        />
        <div className="flex gap-2">
          <input type="hidden" name="pageSize" value={pageSize} />
          <button type="submit" className="btn-primary w-full justify-center">
            Filtrlə
          </button>
        </div>
      </form>

      <AdminBusinessProfilesTable items={data.items} />

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-500">
          Cəmi: <span className="font-semibold text-slate-900">{data.total}</span> | Səhifə {data.page}/
          {data.totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            href={
              data.page > 1
                ? `/admin/business-profiles?${new URLSearchParams([
                    ...qParams.entries(),
                    ["page", String(data.page - 1)]
                  ])}`
                : "#"
            }
            className={`btn-secondary px-3 py-1.5 text-xs ${
              data.page <= 1 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Geri
          </Link>
          <Link
            href={
              data.page < data.totalPages
                ? `/admin/business-profiles?${new URLSearchParams([
                    ...qParams.entries(),
                    ["page", String(data.page + 1)]
                  ])}`
                : "#"
            }
            className={`btn-secondary px-3 py-1.5 text-xs ${
              data.page >= data.totalPages ? "pointer-events-none opacity-50" : ""
            }`}
          >
            İrəli
          </Link>
        </div>
      </div>
    </div>
  );
}
