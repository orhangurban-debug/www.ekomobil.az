"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function OwnerEditListingButton(props: {
  listingId: string;
  title: string;
  description: string;
  city: string;
  priceAzn: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: props.title,
    description: props.description,
    city: props.city,
    priceAzn: props.priceAzn
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/listings/${props.listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          city: form.city.trim(),
          priceAzn: Number(form.priceAzn)
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Yenilənmə uğursuz oldu.");
        setBusy(false);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Yenilənmə uğursuz oldu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn-secondary w-full justify-center py-3"
        onClick={() => setOpen(true)}
      >
        Elanı redaktə et
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Elanı redaktə et</h3>
            <p className="mt-1 text-sm text-slate-500">
              Saxlandıqdan sonra elan avtomatik yenidən yoxlamaya göndəriləcək.
            </p>

            <form className="mt-4 space-y-3" onSubmit={onSubmit}>
              <input
                className="input-field"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Başlıq"
                required
              />
              <textarea
                className="input-field min-h-[120px]"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Təsvir"
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input-field"
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Şəhər"
                  required
                />
                <input
                  className="input-field"
                  type="number"
                  min={1}
                  value={form.priceAzn}
                  onChange={(e) => setForm((prev) => ({ ...prev, priceAzn: Number(e.target.value) }))}
                  placeholder="Qiymət"
                  required
                />
              </div>
              {error && <p className="text-xs text-red-700">{error}</p>}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                >
                  Ləğv et
                </button>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? "Saxlanılır..." : "Yadda saxla və yoxlamaya göndər"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
