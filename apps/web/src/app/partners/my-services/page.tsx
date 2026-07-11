import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerSessionUser } from "@/lib/auth";
import { listServiceListingsForUser } from "@/server/service-listing-store";
import { SERVICE_PROVIDER_TYPE_LABELS } from "@/lib/services-marketplace";

export const metadata: Metadata = {
  title: "Servis profillərim | EkoMobil",
};

export default async function MyServicesPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/partners/my-services");

  const listings = await listServiceListingsForUser(user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Servis profillərim</h1>
          <p className="mt-1 text-sm text-slate-500">
            Yaratdığınız servis və ekspertiza profilləri
          </p>
        </div>
        <Link
          href="/partners/inspection"
          className="rounded-xl bg-[#0057FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004ADF]"
        >
          + Yeni profil
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <span className="text-5xl">🔧</span>
          <div>
            <p className="font-semibold text-slate-800">Hələ servis profiliniz yoxdur</p>
            <p className="mt-1 text-sm text-slate-500">Profil yaradın — admin təsdiqindən sonra aktiv olur</p>
          </div>
          <Link
            href="/partners/inspection"
            className="rounded-xl bg-[#0057FF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004ADF]"
          >
            Servis profili yarat
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {listings.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-start gap-4 p-5">
                {item.imageUrls?.[0] && (
                  <img
                    src={item.imageUrls[0]}
                    alt={item.name}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{item.name}</h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status === "approved" ? "Aktiv" : item.status === "rejected" ? "Rədd edilib" : "Gözləmədə"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {SERVICE_PROVIDER_TYPE_LABELS[item.providerType as keyof typeof SERVICE_PROVIDER_TYPE_LABELS] ?? item.providerType}
                    {" · "}{item.city}
                  </p>
                  {item.about && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.about}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 border-t border-slate-100 px-5 py-3">
                {item.status === "approved" && (
                  <Link
                    href={`/services/${item.slug}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    İctimai profilə bax →
                  </Link>
                )}
                <Link
                  href={`/partners/inspection?edit=${item.id}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Redaktə et
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
