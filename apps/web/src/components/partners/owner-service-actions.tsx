"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AZERBAIJAN_CITIES } from "@/lib/car-data";

interface Props {
  listing: {
    id: string;
    name: string;
    city: string;
    address?: string;
    mapUrl?: string;
    about: string;
    services: string[];
    phone: string;
    whatsapp?: string;
    status: string;
    slug: string;
  };
}

export function OwnerServiceActions({ listing }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"hide" | "unhide" | "delete" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: listing.name,
    city: listing.city,
    address: listing.address ?? "",
    mapUrl: listing.mapUrl ?? "",
    about: listing.about,
    services: listing.services.join(", "),
    phone: listing.phone,
    whatsapp: listing.whatsapp ?? ""
  });

  async function runLifecycle(action: "hide" | "unhide" | "delete", confirmMessage?: string) {
    if (busy) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setBusy(action);
    setError(null);
    try {
      const response = await fetch(`/api/service-listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Əməliyyat uğursuz oldu.");
        return;
      }
      router.refresh();
    } catch {
      setError("Əməliyyat uğursuz oldu.");
    } finally {
      setBusy(null);
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy("save");
    setError(null);
    try {
      const response = await fetch(`/api/service-listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          city: form.city.trim(),
          address: form.address.trim() || null,
          mapUrl: form.mapUrl.trim() || null,
          about: form.about.trim(),
          services: form.services
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim() || null
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Yenilənmə uğursuz oldu.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Yenilənmə uğursuz oldu.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {listing.status === "approved" && (
        <a
          href={`/services/${listing.slug}`}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
        >
          İctimai profilə bax →
        </a>
      )}
      {listing.status !== "archived" && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Redaktə et
        </button>
      )}
      {listing.status === "approved" && (
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void runLifecycle("hide")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {busy === "hide" ? "..." : "Gizlət"}
        </button>
      )}
      {listing.status === "paused" && (
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void runLifecycle("unhide")}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
        >
          {busy === "unhide" ? "..." : "Yenidən aç"}
        </button>
      )}
      {listing.status !== "archived" && (
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() =>
            void runLifecycle("delete", "Servis profilini silmək istəyirsiniz? Profil arxivə köçürüləcək.")
          }
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
        >
          {busy === "delete" ? "..." : "Sil"}
        </button>
      )}
      {error && !open && <p className="w-full text-xs text-red-600">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Servis profilini redaktə et</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500 hover:text-slate-800">
                Bağla
              </button>
            </div>
            <form className="space-y-3" onSubmit={(e) => void onSave(e)}>
              <div>
                <label className="label">Ad</label>
                <input
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Şəhər</label>
                <select
                  className="input-field"
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  required
                >
                  {AZERBAIJAN_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Ünvan</label>
                <input
                  className="input-field"
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Xəritə linki</label>
                <input
                  className="input-field"
                  value={form.mapUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, mapUrl: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Haqqında</label>
                <textarea
                  className="input-field min-h-[96px]"
                  value={form.about}
                  onChange={(e) => setForm((prev) => ({ ...prev, about: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Xidmətlər (vergüllə)</label>
                <input
                  className="input-field"
                  value={form.services}
                  onChange={(e) => setForm((prev) => ({ ...prev, services: e.target.value }))}
                  placeholder="Diaqnostika, yağ dəyişimi"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Telefon</label>
                  <input
                    className="input-field"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">WhatsApp</label>
                  <input
                    className="input-field"
                    value={form.whatsapp}
                    onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-amber-700">
                Aktiv profili redaktə etdikdə yenidən admin yoxlamasına düşür.
              </p>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  Ləğv et
                </button>
                <button type="submit" disabled={busy === "save"} className="btn-primary">
                  {busy === "save" ? "Saxlanılır..." : "Yadda saxla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
