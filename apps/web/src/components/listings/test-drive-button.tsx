"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function TestDriveButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerEmail: "" });
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("idle");
    const res = await fetch(`/api/listings/${listingId}/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim() || undefined,
        customerEmail: form.customerEmail.trim() || undefined,
        note: "Test sürüşü sifarişi",
        source: "test_drive"
      })
    });
    setState(res.ok ? "saved" : "error");
    if (res.ok) {
      setTimeout(() => {
        setOpen(false);
        setForm({ customerName: "", customerPhone: "", customerEmail: "" });
        router.refresh();
      }, 1500);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary w-full justify-center py-3"
      >
        Test sürüşü sifariş et
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Test sürüşü sifariş et</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3">
              <input
                className="input-field"
                placeholder="Adınız *"
                value={form.customerName}
                onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                required
              />
              <input
                className="input-field"
                type="tel"
                placeholder="Telefon *"
                value={form.customerPhone}
                onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))}
              />
              <input
                className="input-field"
                type="email"
                placeholder="Email"
                value={form.customerEmail}
                onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))}
              />
              {state === "saved" && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  Sorğunuz qeydə alındı. Satıcı sizinlə əlaqə saxlayacaq.
                </div>
              )}
              {state === "error" && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  Xəta baş verdi. Yenidən cəhd edin.
                </div>
              )}
              <button type="submit" className="btn-primary w-full justify-center py-3">
                Sifariş göndər
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
