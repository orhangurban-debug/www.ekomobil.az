import Link from "next/link";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { getServerSessionUser } from "@/lib/auth";
import { listAdminUsersPaged } from "@/server/admin-store";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 25);
  const q = typeof params.q === "string" ? params.q : undefined;
  const role = typeof params.role === "string" ? params.role : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const sortBy = typeof params.sortBy === "string" ? params.sortBy : undefined;
  const sortDir = typeof params.sortDir === "string" ? params.sortDir : undefined;
  const [user, data] = await Promise.all([
    getServerSessionUser(),
    listAdminUsersPaged({
      page,
      pageSize,
      q,
      role,
      status,
      sortBy: sortBy as "created_at" | "email" | "penalty_balance_azn" | undefined,
      sortDir: sortDir as "asc" | "desc" | undefined
    })
  ]);
  const qParams = new URLSearchParams();
  if (q) qParams.set("q", q);
  if (role) qParams.set("role", role);
  if (status) qParams.set("status", status);
  qParams.set("pageSize", String(pageSize));
  const canEditRoles = user?.role === "admin";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">İstifadəçilərin idarə olunması</h2>
        <p className="mt-1 text-sm text-slate-500">
          Rolların və hesab statuslarının canlı dəyişdirilməsi. Dəyişikliklər dərhal tətbiq olunur.
        </p>
      </div>
      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-5">
        <input name="q" defaultValue={q} placeholder="Axtar: email/ad/şəhər" className="input-field md:col-span-2" />
        <select name="role" defaultValue={role ?? ""} className="input-field">
          <option value="">Bütün rollar</option>
          <option value="admin">admin</option>
          <option value="support">support</option>
          <option value="dealer">dealer</option>
          <option value="viewer">viewer</option>
        </select>
        <select name="status" defaultValue={status ?? ""} className="input-field">
          <option value="">Bütün statuslar</option>
          <option value="active">active</option>
          <option value="review">review</option>
          <option value="suspended">suspended</option>
        </select>
        <div className="flex gap-2">
          <input type="hidden" name="pageSize" value={pageSize} />
          <button type="submit" className="btn-primary w-full justify-center">Filter</button>
        </div>
      </form>

      <UserManagementTable users={data.items} canEditRoles={canEditRoles} />
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <p className="text-slate-500">
          Toplam: <span className="font-semibold text-slate-900">{data.total}</span> | Səhifə {data.page}/{data.totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            href={data.page > 1 ? `/admin/users?${new URLSearchParams([...qParams.entries(), ["page", String(data.page - 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Geri
          </Link>
          <Link
            href={data.page < data.totalPages ? `/admin/users?${new URLSearchParams([...qParams.entries(), ["page", String(data.page + 1)]])}` : "#"}
            className={`btn-secondary px-3 py-1.5 text-xs ${data.page >= data.totalPages ? "pointer-events-none opacity-50" : ""}`}
          >
            İrəli
          </Link>
        </div>
      </div>
    </div>
  );
}
