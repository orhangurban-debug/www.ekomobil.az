import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requirePageRoles } from "@/lib/rbac";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await requirePageRoles(["admin", "support"]);
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      redirect("/login?next=/admin");
    }
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Admin giriş icazəsi yoxdur</h1>
          <p className="mt-2 text-sm text-slate-500">
            Bu səhifə yalnız admin və dəstək rolları üçün açıqdır.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/" className="btn-secondary">Ana səhifə</Link>
            <Link href="/ops/auctions" className="btn-primary">Əməliyyat konsoluna keç</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0891B2]">Mərkəzləşdirilmiş idarəetmə</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Platforma idarəetməsi</h1>
              <p className="mt-1 text-sm text-slate-500">
                Saytın istifadəçi, elan, auksion, maliyyə və CRM axınlarının vahid idarə paneli.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              Giriş: <span className="font-semibold text-slate-900">{auth.user.email}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <AdminSidebar />
          <section>{children}</section>
        </div>
      </div>
    </div>
  );
}
