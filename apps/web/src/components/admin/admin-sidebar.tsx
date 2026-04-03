"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections: Array<{
  title: string;
  items: Array<{ href: string; label: string }>;
}> = [
  {
    title: "İdarəetmə",
    items: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/users", label: "İstifadəçilər & Rollar" },
      { href: "/admin/listings", label: "Elanlar" },
      { href: "/admin/auctions", label: "Auksion" },
      { href: "/admin/incidents", label: "Incidents & Moderation" },
    ]
  },
  {
    title: "Biznes",
    items: [
      { href: "/admin/finance", label: "Maliyyə" },
      { href: "/admin/crm", label: "CRM" },
      { href: "/admin/audit", label: "Audit log" },
      { href: "/admin/settings", label: "Sistem ayarları" }
    ]
  },
  {
    title: "Ops keçidləri",
    items: [
      { href: "/ops/reviews", label: "Ops Reviews" },
      { href: "/ops/auctions", label: "Ops Auctions" },
      { href: "/ops/analytics", label: "Ops Analytics" }
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-full rounded-2xl border border-slate-200 bg-white p-4 lg:w-72 lg:sticky lg:top-20 lg:h-fit">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#0891B2]">Admin Console</p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">EkoMobil idarə paneli</h2>
      </div>

      <nav className="space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-[#0891B2]/10 text-[#0891B2]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
