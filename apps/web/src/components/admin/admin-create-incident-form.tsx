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
      if (!payload.ok) throw new Error(payload.error || "Case yaradılmadı");
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
      alert("Case yaradılmadı");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Yeni incident aç</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-6">
        <select className="input-field" value={form.subjectType} onChange={(e) => setForm((p) => ({ ...p, subjectType: e.target.value }))}>
          <option value="listing">listing</option>
          <option value="user">user</option>
          <option value="lead">lead</option>
          <option value="auction">auction</option>
          <option value="kyc">kyc</option>
          <option value="system">system</option>
        </select>
        <input className="input-field md:col-span-2" placeholder="subject ID" value={form.subjectId} onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))} />
        <select className="input-field" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
          <option value="complaint">complaint</option>
          <option value="fraud">fraud</option>
          <option value="policy_violation">policy_violation</option>
          <option value="false_info">false_info</option>
          <option value="abuse">abuse</option>
          <option value="technical">technical</option>
        </select>
        <select className="input-field" value={form.severity} onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))}>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>
        <button type="button" onClick={() => void submit()} disabled={busy} className="btn-primary justify-center disabled:opacity-60">
          {busy ? "Yaradılır..." : "Case aç"}
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <input className="input-field md:col-span-2" placeholder="Qısa başlıq" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
        <input className="input-field" placeholder="Qeyd (opsional)" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
      </div>
    </div>
  );
}
