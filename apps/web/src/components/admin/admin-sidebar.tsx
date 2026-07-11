"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminPendingCounts } from "@/server/admin-counts-store";

interface NavItem {
  href: string;
  label: string;
  badgeKey?: keyof AdminPendingCounts;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function buildSections(counts: AdminPendingCounts): NavSection[] {
  return [
    {
      title: "İcmal",
      items: [
        { href: "/admin", label: "İcmal paneli" }
      ]
    },
    {
      title: "Moderasiya",
      items: [
        { href: "/admin/listings",         label: "Elanlar",           badgeKey: "pendingListings" },
        { href: "/admin/users",            label: "İstifadəçilər" },
        { href: "/admin/incidents",        label: "İnsidentlər",       badgeKey: "openIncidents" },
        { href: "/admin/support-requests", label: "Müraciətlər", badgeKey: "newSupportRequests" },
        { href: "/admin/business-applications", label: "Biznes müraciətləri", badgeKey: "newBusinessApplications" },
        { href: "/admin/legal-requests",   label: "Hüquqi sorğular" }
      ]
    },
    {
      title: "Biznes hesabları",
      items: [
        { href: "/admin/salon-profiles",   label: "Salon profilləri" },
        { href: "/admin/magaza-profiles",  label: "Mağaza profilləri" },
        { href: "/admin/service-listings",  label: "Servis elanları", badgeKey: "pendingServiceListings" },
        { href: "/admin/business-plans",    label: "Plan abunələri" }
      ]
    },
    {
      title: "Maliyyə",
      items: [
        { href: "/admin/finance",            label: "Maliyyə" },
        { href: "/admin/invoices",           label: "İnvoyslar" },
        { href: "/admin/tax-reports",        label: "Vergi hesabatları" },
        { href: "/admin/payments-readiness", label: "Ödəniş hazırlığı" }
      ]
    },
    {
      title: "Platforma",
      items: [
        { href: "/admin/home-content", label: "Ana səhifə məzmunu" },
        { href: "/admin/ad-slots",     label: "Reklam yerləri" },
        { href: "/admin/ad-requests",  label: "Reklam müraciətləri", badgeKey: "pendingAdRequests" },
        { href: "/admin/auctions",     label: "Auksion" },
        { href: "/admin/brand-kit",    label: "Brend Kit" }
      ]
    },
    {
      title: "Sistem",
      items: [
        { href: "/admin/crm",     label: "CRM" },
        { href: "/admin/audit",   label: "Audit jurnalı" },
        { href: "/admin/settings",label: "Sistem parametrləri" }
      ]
    }
  ];
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AdminSidebar({ counts }: { counts: AdminPendingCounts }) {
  const pathname = usePathname();
  const sections = buildSections(counts);

  // Total moderation work badge for section header
  const moderationTotal =
    counts.pendingListings +
    counts.openIncidents +
    counts.newSupportRequests +
    counts.newBusinessApplications;

  return (
    <aside className="w-full rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-20 lg:h-fit">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#0891B2]">İdarəetmə konsolu</p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">EkoMobil idarə paneli</h2>
      </div>

      <nav className="space-y-5">
        {sections.map((section) => {
          const isModeration = section.title === "Moderasiya";
          return (
            <div key={section.title}>
              <div className="mb-2 flex items-center gap-1.5 px-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {section.title}
                </p>
                {isModeration && moderationTotal > 0 && (
                  <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                    {moderationTotal > 99 ? "99+" : moderationTotal}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
                  const badgeCount = item.badgeKey ? counts[item.badgeKey] : 0;

                  return (
                    <Link
                      key={`${section.title}-${item.label}`}
                      href={item.href}
                      className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? "bg-[#0891B2]/10 text-[#0891B2]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className="flex-1 truncate">{item.label}</span>
                      {badgeCount > 0 && <Badge count={badgeCount} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* External ops links */}
        <div>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Əməliyyatlar
          </p>
          <div className="space-y-0.5">
            {[
              { href: "/ops/reviews",   label: "Əməliyyat baxışları" },
              { href: "/ops/auctions",  label: "Əməliyyat auksionları" },
              { href: "/ops/analytics", label: "Analitika" }
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <span className="flex-1 truncate">{item.label}</span>
                <span className="text-[10px] text-slate-300">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
