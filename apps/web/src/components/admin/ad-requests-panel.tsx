"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock, CheckCircle, XCircle, MessageSquare,
  Building2, Mail, Phone, Globe, Calendar,
  ChevronDown, ChevronUp, Loader2, RefreshCw
} from "lucide-react";
import type { AdRequestRecord, AdRequestStatus } from "@/server/ad-request-store";

const STATUS_LABELS: Record<AdRequestStatus, { label: string; color: string }> = {
  pending:   { label: "Gözləyir",    color: "bg-amber-100 text-amber-700" },
  contacted: { label: "Əlaqə saxlandı", color: "bg-blue-100 text-blue-700" },
  approved:  { label: "Təsdiqləndi", color: "bg-emerald-100 text-emerald-700" },
  declined:  { label: "Rədd edildi", color: "bg-red-100 text-red-700" },
  cancelled: { label: "Ləğv edildi", color: "bg-slate-100 text-slate-500" }
};

const FILTER_OPTIONS: Array<{ value: AdRequestStatus | "all"; label: string }> = [
  { value: "all",       label: "Hamısı" },
  { value: "pending",   label: "Gözləyir" },
  { value: "contacted", label: "Əlaqə saxlandı" },
  { value: "approved",  label: "Təsdiqləndi" },
  { value: "declined",  label: "Rədd edildi" },
  { value: "cancelled", label: "Ləğv edildi" }
];

interface ApiResponse {
  ok: boolean;
  items?: AdRequestRecord[];
  total?: number;
  error?: string;
}

function RequestRow({ req, onUpdate }: { req: AdRequestRecord; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<AdRequestStatus>(req.status);
  const [note, setNote] = useState(req.adminNote ?? "");
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/ad-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: req.id, status, adminNote: note || undefined })
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) { setErr(data.error ?? "Xəta baş verdi"); return; }
      onUpdate();
    } catch {
      setErr("Şəbəkə xətası");
    } finally {
      setSaving(false);
    }
  }

  const st = STATUS_LABELS[req.status];
  const dateStr = new Date(req.createdAt).toLocaleDateString("az-AZ", {
    day: "numeric", month: "short", year: "numeric"
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${st.color}`}>
          {st.label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{req.companyName}</p>
          <p className="text-xs text-slate-500 truncate">{req.contactName} · {req.contactEmail}</p>
        </div>
        <div className="hidden sm:block text-right shrink-0">
          <p className="text-xs font-medium text-slate-700">{req.slotId}</p>
          <p className="text-xs text-slate-400">{dateStr}</p>
        </div>
        {req.isWaitlist && (
          <span className="shrink-0 rounded-full bg-purple-100 text-purple-600 px-2 py-0.5 text-xs font-medium">
            Gözləmə
          </span>
        )}
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-5 space-y-5">
          {/* Details grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { icon: <Building2 className="h-3.5 w-3.5" />, label: "Şirkət", value: req.companyName },
              { icon: <Mail className="h-3.5 w-3.5" />,     label: "E-poçt", value: req.contactEmail },
              { icon: <Phone className="h-3.5 w-3.5" />,    label: "Telefon", value: req.contactPhone ?? "—" },
              { icon: <Globe className="h-3.5 w-3.5" />,    label: "Veb-sayt", value: req.websiteUrl ?? "—" },
              { icon: <Calendar className="h-3.5 w-3.5" />, label: "Müddət", value: req.durationDays ? `${req.durationDays} gün` : "—" },
              { icon: <Clock className="h-3.5 w-3.5" />,    label: "Büdcə", value: req.budgetAzn ? `${req.budgetAzn} ₼` : "—" }
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-2">
                <span className="mt-0.5 text-slate-400">{row.icon}</span>
                <div>
                  <p className="text-xs text-slate-400">{row.label}</p>
                  <p className="text-sm text-slate-800">{row.value}</p>
                </div>
              </div>
            ))}
          </div>

          {req.message && (
            <div className="flex items-start gap-2">
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 text-slate-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 mb-1">Mesaj</p>
                <p className="text-sm text-slate-700 leading-relaxed">{req.message}</p>
              </div>
            </div>
          )}

          {/* Admin action */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AdRequestStatus)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
                >
                  {FILTER_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Admin qeydi</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Qiymət razılaşdırıldı, ödəniş gözlənir..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
            </div>
            {err && <p className="text-xs text-red-500">{err}</p>}
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Saxla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdRequestsPanel() {
  const [filter, setFilter] = useState<AdRequestStatus | "all">("pending");
  const [items, setItems] = useState<AdRequestRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const url = filter === "all"
        ? "/api/ad-requests"
        : `/api/ad-requests?status=${filter}`;
      const res = await fetch(url);
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok) { setErr(data.error ?? "Yükləmə xətası"); return; }
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setErr("Şəbəkə xətası");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  const pending = items.filter((i) => i.status === "pending").length;
  const waitlist = items.filter((i) => i.isWaitlist).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: <Clock className="h-5 w-5 text-amber-500" />,    label: "Gözləyir",    value: pending,   bg: "bg-amber-50" },
          { icon: <CheckCircle className="h-5 w-5 text-emerald-500" />, label: "Cəmi müraciət", value: total, bg: "bg-emerald-50" },
          { icon: <Calendar className="h-5 w-5 text-purple-500" />, label: "Gözləmə siy.", value: waitlist, bg: "bg-purple-50" },
          { icon: <XCircle className="h-5 w-5 text-slate-400" />,   label: "Göstərilən",  value: items.length, bg: "bg-slate-50" }
        ].map((card) => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4 flex items-center gap-3`}>
            {card.icon}
            <div>
              <p className="text-xl font-bold text-slate-900">{card.value}</p>
              <p className="text-xs text-slate-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === opt.value
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => void load()}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Yenilə
        </button>
      </div>

      {/* List */}
      {err && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{err}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <p className="text-slate-400 text-sm">
            {filter === "pending" ? "Gözləyən müraciət yoxdur." : "Bu filtrdə müraciət tapılmadı."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((req) => (
            <RequestRow key={req.id} req={req} onUpdate={() => void load()} />
          ))}
        </div>
      )}
    </div>
  );
}
