"use client";

import { useState, useCallback } from "react";
import { CheckCircle, Loader2, AlertCircle, CalendarClock } from "lucide-react";
import type { AdSlotItem } from "@/lib/ad-slots-config";

interface AdvertiseFormProps {
  slot: AdSlotItem;
  isWaitlist: boolean;
  onClose: () => void;
}

interface FormState {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  message: string;
  budgetAzn: string;
  durationDays: string;
}

export default function AdvertiseForm({ slot, isWaitlist, onClose }: AdvertiseFormProps) {
  const [form, setForm] = useState<FormState>({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    websiteUrl: "",
    message: "",
    budgetAzn: "",
    durationDays: "30"
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = useCallback((field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/ad-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          companyName: form.companyName,
          contactName: form.contactName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone || undefined,
          websiteUrl: form.websiteUrl || undefined,
          message: form.message || undefined,
          budgetAzn: form.budgetAzn ? Number(form.budgetAzn) : undefined,
          durationDays: form.durationDays ? Number(form.durationDays) : undefined,
          isWaitlist
        })
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Xəta baş verdi, yenidən cəhd edin.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Şəbəkə xətası, yenidən cəhd edin.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="rounded-full bg-emerald-100 p-4">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900">Müraciətiniz qeydə alındı!</h3>
        <p className="max-w-sm text-sm text-slate-500 leading-relaxed">
          E-poçtunuza təsdiq göndərildi. Komandamız <strong>1–2 iş günü</strong> ərzində sizinlə əlaqə saxlayacaq.
        </p>
        <button
          onClick={onClose}
          className="mt-2 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
        >
          Bağla
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {isWaitlist && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800 leading-relaxed">
            Bu slot hazırda məşğuldur. Müraciətiniz <strong>gözləmə siyahısına</strong> əlavə ediləcək — slot boşalanda sizi ilk bildirəcəyik.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Seçilmiş slot</p>
        <p className="text-sm font-semibold text-slate-800">{slot.label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{slot.priceNote}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Şirkət adı <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            value={form.companyName}
            onChange={set("companyName")}
            placeholder="OOO Şirkət"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Əlaqə şəxsi <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            value={form.contactName}
            onChange={set("contactName")}
            placeholder="Ad Soyad"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            E-poçt <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="email"
            value={form.contactEmail}
            onChange={set("contactEmail")}
            placeholder="info@sirket.az"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Telefon</label>
          <input
            type="tel"
            value={form.contactPhone}
            onChange={set("contactPhone")}
            placeholder="+994 50 000 00 00"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Veb-sayt</label>
          <input
            type="url"
            value={form.websiteUrl}
            onChange={set("websiteUrl")}
            placeholder="https://sirket.az"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Müddət (gün)</label>
          <select
            value={form.durationDays}
            onChange={set("durationDays")}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          >
            <option value="7">7 gün</option>
            <option value="14">14 gün</option>
            <option value="30">30 gün (1 ay)</option>
            <option value="60">60 gün (2 ay)</option>
            <option value="90">90 gün (3 ay)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Əlavə qeyd</label>
        <textarea
          value={form.message}
          onChange={set("message")}
          rows={3}
          placeholder="Hədəf auditoriya, xüsusi tələblər..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
        />
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        {isWaitlist ? "Gözləmə siyahısına qoşul" : "Müraciət göndər"}
      </button>

      <p className="text-center text-xs text-slate-400">
        Müraciəti göndərdikdən sonra e-poçtunuza təsdiq gələcək. Ödəniş razılaşdırıldıqdan sonra həyata keçirilir.
      </p>
    </form>
  );
}
