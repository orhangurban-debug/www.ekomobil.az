"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminReadOnlyBanner } from "@/components/admin/admin-read-only-banner";
import { SERVICE_PROVIDER_TYPE_LABELS, type ServiceProviderType } from "@/lib/services-marketplace";

interface ServiceListingItem {
  id: string;
  slug: string;
  name: string;
  providerType: ServiceProviderType;
  city: string;
  phone: string;
  whatsapp: string;
  about: string;
  services: string[];
  certifications?: string[];
  imageUrls?: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const STATUS_LABELS: Record<ServiceListingItem["status"], string> = {
  pending: "Gözləyir",
  approved: "Təsdiqlənib",
  rejected: "Rədd edilib"
};

const STATUS_STYLES: Record<ServiceListingItem["status"], string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200"
};

export function AdminServiceListingsTable({
  items,
  readOnly = false
}: {
  items: ServiceListingItem[];
  readOnly?: boolean;
}) {
  const [localItems, setLocalItems] = useState(items);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStatus(id: string, status: ServiceListingItem["status"]) {
    setBusyId(id);
    try {
      const response = await fetch("/api/admin/service-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        alert(payload.error ?? "Status yenilənə bilmədi.");
        return;
      }
      setLocalItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    } finally {
      setBusyId(null);
    }
  }

  if (localItems.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Bu filtrə uyğun servis müraciəti tapılmadı.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {readOnly && <AdminReadOnlyBanner />}
      {localItems.map((item) => (
        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{item.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_STYLES[item.status]}`}>
                  {STATUS_LABELS[item.status]}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {SERVICE_PROVIDER_TYPE_LABELS[item.providerType]} • {item.city} • {item.phone}
              </p>
              {item.status === "approved" && (
                <Link href={`/services/${item.slug}`} target="_blank" className="mt-1 inline-block text-xs text-[#0057FF] hover:underline">
                  Canlı profilə bax →
                </Link>
              )}
            </div>
            {!readOnly && (
              <div className="flex gap-2">
                {item.status !== "approved" && (
                  <button
                    type="button"
                    className="btn-primary px-3 py-1.5 text-xs"
                    disabled={busyId === item.id}
                    onClick={() => setStatus(item.id, "approved")}
                  >
                    Təsdiqlə
                  </button>
                )}
                {item.status !== "rejected" && (
                  <button
                    type="button"
                    className="btn-secondary px-3 py-1.5 text-xs"
                    disabled={busyId === item.id}
                    onClick={() => setStatus(item.id, "rejected")}
                  >
                    Rədd et
                  </button>
                )}
                {item.status !== "pending" && (
                  <button
                    type="button"
                    className="btn-secondary px-3 py-1.5 text-xs"
                    disabled={busyId === item.id}
                    onClick={() => setStatus(item.id, "pending")}
                  >
                    Gözləməyə qaytar
                  </button>
                )}
              </div>
            )}
          </div>

          {item.about && <p className="mt-3 text-sm text-slate-600">{item.about}</p>}

          {item.services.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.services.map((service) => (
                <span key={service} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                  {service}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
