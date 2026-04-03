"use client";

import { useState } from "react";

export function AdminCreateIncidentForm() {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    subjectType: "listing",
    subjectId: "",
    category: "complaint",
    severity: "medium",
    title: "",
    description: ""
  });

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error || "Hal yaradılmadı");
      setForm({
        subjectType: "listing",
        subjectId: "",
        category: "complaint",
        severity: "medium",
        title: "",
        description: ""
      });
      window.location.reload();
    } catch {
      alert("Hal yaradılmadı");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Yeni insident aç</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-6">
        <select className="input-field" value={form.subjectType} onChange={(e) => setForm((p) => ({ ...p, subjectType: e.target.value }))}>
          <option value="listing">Elan</option>
          <option value="user">İstifadəçi</option>
          <option value="lead">Sorğu</option>
          <option value="auction">Auksion</option>
          <option value="kyc">KYC</option>
          <option value="system">Sistem</option>
        </select>
        <input className="input-field md:col-span-2" placeholder="Obyekt ID-si" value={form.subjectId} onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))} />
        <select className="input-field" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
          <option value="complaint">Şikayət</option>
          <option value="fraud">Dələduzluq</option>
          <option value="policy_violation">Qayda pozuntusu</option>
          <option value="false_info">Yalan məlumat</option>
          <option value="abuse">Sui-istifadə</option>
          <option value="technical">Texniki problem</option>
        </select>
        <select className="input-field" value={form.severity} onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))}>
          <option value="low">Aşağı</option>
          <option value="medium">Orta</option>
          <option value="high">Yüksək</option>
          <option value="critical">Kritik</option>
        </select>
        <button type="button" onClick={() => void submit()} disabled={busy} className="btn-primary justify-center disabled:opacity-60">
          {busy ? "Yaradılır..." : "Hal aç"}
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <input className="input-field md:col-span-2" placeholder="Qısa başlıq" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
        <input className="input-field" placeholder="Qeyd (opsional)" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
      </div>
    </div>
  );
}
