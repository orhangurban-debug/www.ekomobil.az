import Link from "next/link";
import { AdminBusinessProfilesTable } from "@/components/admin/admin-business-profiles-table";
import { listAdminBusinessProfilesPaged } from "@/server/admin-store";

type BusinessProfileType = "dealer" | "store";

const PAGE_META: Record<
  BusinessProfileType,
  {
    basePath: string;
    title: string;
    description: string;
    accent: string;
    applicationsLabel: string;
  }
> = {
  dealer: {
    basePath: "/admin/salon-profiles",
    title: "Salon profilləri",
    description: "Avtosalon profillərinin moderasiyası, təsdiqi, abunə idarəetməsi və sahib profilinə keçid.",
    accent: "Salon",
    applicationsLabel: "Salon müraciətləri"
  },
  store: {
    basePath: "/admin/magaza-profiles",
    title: "Mağaza profilləri",
    description: "Ehtiyat hissəsi mağazalarının moderasiyası, abunə idarəetməsi və sahib profilinə keçid.",
    accent: "Mağaza",
    applicationsLabel: "Mağaza müraciətləri"
  }
};

function statHref(basePath: string, params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) q.set(key, value);
  });
  const query = q.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export async function BusinessProfilesScreen({
  profileType,
  searchParams,
  canEdit
}: {
  profileType: BusinessProfileType;
  searchParams: Record<string, string | string[] | undefined>;
  canEdit: boolean;
}) {
  const meta = PAGE_META[profileType];
  const page = Number(searchParams.page || 1);
  const pageSize = Number(searchParams.pageSize || 25);
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const verified = typeof searchParams.verified === "string" ? (searchParams.verified as "yes" | "no") : undefined;

  const data = await listAdminBusinessProfilesPaged({
    page,
    pageSize,
    q,
    profileType,
    verified: profileType === "dealer" ? verified : verified === "yes" ? "yes" : undefined
  });
  const { summary } = data;

  const qParams = new URLSearchParams();
  if (q) qParams.set("q", q);
  if (verified) qParams.set("verified", verified);
  qParams.set("pageSize", String(pageSize));

  const stats =
    profileType === "dealer"
      ? [
          { label: "Cəmi salon", value: summary.dealerCount, href: statHref(meta.basePath, { q }) },
          { label: "Təsdiqlənib", value: summary.verifiedDealerCount, href: statHref(meta.basePath, { verified: "yes", q }) },
          { label: "Gözləyir", value: summary.pendingDealerCount, href: statHref(meta.basePath, { verified: "no", q }) }
        ]
      : [
          { label: "Cəmi mağaza", value: summary.storeCount, href: statHref(meta.basePath, { q }) },
          { label: "Aktiv abunə", value: summary.storeCount, href: statHref(meta.basePath, { q }) }
        ];

  const otherProfilesHref = profileType === "dealer" ? "/admin/magaza-profiles" : "/admin/salon-profiles";
  const otherProfilesLabel = profileType === "dealer" ? "Mağaza profilləri" : "Salon profilləri";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0891B2]">Biznes hesabları · {meta.accent}</p>
          <h2 className="text-2xl font-bold text-slate-900">{meta.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={otherProfilesHref} className="btn-secondary text-sm">
            {otherProfilesLabel} →
          </Link>
          <Link href="/admin/business-applications" className="btn-secondary text-sm">
            {meta.applicationsLabel} →
          </Link>
        </div>
      </div>

      <div className={`grid gap-3 ${profileType === "dealer" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
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
        <div className={`grid gap-3 ${profileType === "dealer" ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Axtar: profil adı, şəhər, owner email"
            className={`input-field ${profileType === "dealer" ? "md:col-span-2" : "md:col-span-2"}`}
          />
          {profileType === "dealer" && (
            <select name="verified" defaultValue={verified ?? ""} className="input-field">
              <option value="">Təsdiq — hamısı</option>
              <option value="yes">Təsdiqlənib</option>
              <option value="no">Gözləyir</option>
            </select>
          )}
          <input type="hidden" name="pageSize" value={pageSize} />
          <button type="submit" className="btn-primary w-full justify-center">
            Filtrlə
          </button>
        </div>
      </form>

      <AdminBusinessProfilesTable items={data.items} readOnly={!canEdit} />

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-500">
          Cəmi: <span className="font-semibold text-slate-900">{data.total}</span> | Səhifə {data.page}/{data.totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            href={
              data.page > 1
                ? `${meta.basePath}?${new URLSearchParams([...qParams.entries(), ["page", String(data.page - 1)]])}`
                : "#"
            }
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Geri
          </Link>
          <Link
            href={
              data.page < data.totalPages
                ? `${meta.basePath}?${new URLSearchParams([...qParams.entries(), ["page", String(data.page + 1)]])}`
                : "#"
            }
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page >= data.totalPages ? "pointer-events-none opacity-50" : ""}`}
          >
            İrəli
          </Link>
        </div>
      </div>
    </div>
  );
}
