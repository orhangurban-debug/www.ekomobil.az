import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerSessionUser } from "@/lib/auth";
import { listServiceListingsForUser } from "@/server/service-listing-store";
import { listServiceInquiriesForOwner } from "@/server/service-inquiry-store";
import { getServiceStatsForOwner } from "@/server/service-stats-store";
import { SERVICE_PROVIDER_TYPE_LABELS } from "@/lib/services-marketplace";
import { ServiceInquiriesInbox } from "@/components/partners/service-inquiries-inbox";
import { OwnerServiceActions } from "@/components/partners/owner-service-actions";

export const metadata: Metadata = {
  title: "Servis profillərim | EkoMobil",
};

function statusLabel(status: string): { text: string; cls: string } {
  if (status === "approved") return { text: "Aktiv", cls: "bg-emerald-100 text-emerald-700" };
  if (status === "rejected") return { text: "Rədd edilib", cls: "bg-red-100 text-red-700" };
  if (status === "paused") return { text: "Gizli", cls: "bg-slate-100 text-slate-600" };
  if (status === "archived") return { text: "Silinib", cls: "bg-slate-100 text-slate-500" };
  return { text: "Yoxlamada", cls: "bg-amber-100 text-amber-700" };
}

export default async function MyServicesPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/partners/my-services");

  const [listings, inquiries, stats] = await Promise.all([
    listServiceListingsForUser(user.id),
    listServiceInquiriesForOwner(user.id),
    getServiceStatsForOwner(user.id)
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Servis profillərim</h1>
          <p className="mt-1 text-sm text-slate-500">
            Yaratdığınız servis və ekspertiza profilləri — redaktə, gizlətmə və silmə
          </p>
        </div>
        <Link
          href="/partners/inspection"
          className="rounded-xl bg-[#0057FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004ADF]"
        >
          + Yeni profil
        </Link>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Profil baxışları</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalViews}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Əlaqə klikləri</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalContactClicks}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Açıq sorğular</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {inquiries.filter((item) => item.stage !== "closed").length}
          </p>
        </div>
      </section>

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
          {listings.map((item) => {
            const listingStats = stats.byListing.find((row) => row.id === item.id);
            const status = statusLabel(item.status);
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex items-start gap-4 p-5">
                  {item.imageUrls?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrls[0]}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-900">{item.name}</h2>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.cls}`}>
                        {status.text}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {SERVICE_PROVIDER_TYPE_LABELS[item.providerType as keyof typeof SERVICE_PROVIDER_TYPE_LABELS] ??
                        item.providerType}
                      {" · "}
                      {item.city}
                    </p>
                    {item.about && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.about}</p>
                    )}
                    {item.status === "approved" && listingStats && (
                      <p className="mt-2 text-xs text-slate-500">
                        {listingStats.views} baxış · {listingStats.contacts} əlaqə klikləri
                      </p>
                    )}
                  </div>
                </div>
                <div className="border-t border-slate-100 px-5 py-3">
                  <OwnerServiceActions
                    listing={{
                      id: item.id,
                      name: item.name,
                      city: item.city,
                      address: item.address,
                      mapUrl: item.mapUrl,
                      about: item.about,
                      services: item.services,
                      phone: item.phone,
                      whatsapp: item.whatsapp,
                      status: item.status,
                      slug: item.slug
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Xidmət sorğuları</h2>
        <p className="mt-1 text-sm text-slate-500">İctimai profilinizdən gələn sorğuları idarə edin</p>
        <div className="mt-4">
          <ServiceInquiriesInbox
            inquiries={inquiries.map((item) => ({
              id: item.id,
              serviceName: item.serviceName,
              customerName: item.customerName,
              customerPhone: item.customerPhone,
              customerEmail: item.customerEmail,
              preferredDate: item.preferredDate,
              note: item.note,
              stage: item.stage
            }))}
          />
        </div>
      </section>
    </div>
  );
}
