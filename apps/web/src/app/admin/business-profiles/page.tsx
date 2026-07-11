import Link from "next/link";
import { AdminBusinessProfilesTable } from "@/components/admin/admin-business-profiles-table";
import { requirePageRoles } from "@/lib/rbac";
import { listAdminBusinessProfilesPaged } from "@/server/admin-store";

function statHref(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) q.set(key, value);
  });
  const query = q.toString();
  return query ? `/admin/business-profiles?${query}` : "/admin/business-profiles";
}

export default async function AdminBusinessProfilesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const auth = await requirePageRoles(["admin", "support"]);
  const canEdit = auth.ok && auth.user.role === "admin";
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 25);
  const q = typeof params.q === "string" ? params.q : undefined;
  const profileType = typeof params.profileType === "string" ? (params.profileType as "dealer" | "store") : undefined;
  const verified = typeof params.verified === "string" ? (params.verified as "yes" | "no") : undefined;

  const data = await listAdminBusinessProfilesPaged({ page, pageSize, q, profileType, verified });
  const { summary } = data;

  const qParams = new URLSearchParams();
  if (q) qParams.set("q", q);
  if (profileType) qParams.set("profileType", profileType);
  if (verified) qParams.set("verified", verified);
  qParams.set("pageSize", String(pageSize));

  const stats = [
    { label: "Cəmi", value: data.total, href: statHref({ q }) },
    { label: "Salon", value: summary.dealerCount, href: statHref({ profileType: "dealer", q }) },
    { label: "Mağaza", value: summary.storeCount, href: statHref({ profileType: "store", q }) },
    { label: "Təsdiqlənib", value: summary.verifiedCount, href: statHref({ verified: "yes", q }) },
    { label: "Gözləyir", value: summary.pendingDealerCount, href: statHref({ verified: "no", q }) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0891B2]">Biznes hesabları</p>
          <h2 className="text-2xl font-bold text-slate-900">Salon / Mağaza profilləri</h2>
          <p className="mt-1 text-sm text-slate-500">
            Aktiv biznes hesablarının moderasiyası, abunə idarəetməsi və sahib profilinə keçid.
          </p>
        </div>
        <Link href="/admin/business-applications" className="btn-secondary text-sm">
          Yeni biznes müraciətləri →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-sm"
          >
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="text-2xl font-bold text-slate-900">{item.value}</p>
          </Link>
        ))}
      </div>

      <form className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            name="q"
            defaultValue={q}
            placeholder="Axtar: profil adı, şəhər, owner email"
            className="input-field md:col-span-2"
          />
          <select name="profileType" defaultValue={profileType ?? ""} className="input-field">
            <option value="">Tip — hamısı</option>
            <option value="dealer">Salon</option>
            <option value="store">Mağaza</option>
          </select>
          <select name="verified" defaultValue={verified ?? ""} className="input-field">
            <option value="">Təsdiq — hamısı</option>
            <option value="yes">Təsdiqlənib</option>
            <option value="no">Gözləyir</option>
          </select>
          <input type="hidden" name="pageSize" value={pageSize} />
          <button type="submit" className="btn-primary w-full justify-center">
            Filtrlə
          </button>
        </div>
      </form>

      <AdminBusinessProfilesTable items={data.items} readOnly={!canEdit} />

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
