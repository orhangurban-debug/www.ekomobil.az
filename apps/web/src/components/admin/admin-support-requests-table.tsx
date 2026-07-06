"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useConfirm } from "@/components/ui/confirm-dialog-provider";
import type { AdminSupportRequestRow, AssignableStaff, DealerApplicationMeta } from "@/components/admin/admin-support-types";
import {
  PRIORITY_LABELS,
  REQUEST_TYPE_LABELS,
  STATUS_LABELS
} from "@/lib/support-contact";
import {
  RISK_FLAG_LABELS,
  requestTypeBadgeClass,
  requestTypeGroupLabel,
  riskFlagBadgeClass,
  type SupportRiskFlag
} from "@/lib/support-admin";
import { SUPPORT_ARCHIVE_AFTER_DAYS } from "@/lib/support-retention";

export type { AdminSupportRequestRow, AssignableStaff };

const STATUS_OPTIONS = [
  { value: "new", label: "Yeni" },
  { value: "in_progress", label: "İcrada" },
  { value: "waiting_user", label: "Cavab gözlənilir" },
  { value: "resolved", label: "Həll edilib" },
  { value: "closed", label: "Bağlanıb" },
  { value: "archived", label: "Arxivdə" }
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Aşağı" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Yüksək" },
  { value: "urgent", label: "Təcili" }
];

const RISK_OPTIONS: Array<{ value: SupportRiskFlag; label: string }> = [
  { value: "none", label: RISK_FLAG_LABELS.none },
  { value: "watch", label: RISK_FLAG_LABELS.watch },
  { value: "abuse", label: RISK_FLAG_LABELS.abuse },
  { value: "legal", label: RISK_FLAG_LABELS.legal }
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case "new":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "in_progress":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "waiting_user":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "resolved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "closed":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    case "archived":
      return "bg-slate-50 text-slate-400 ring-slate-100";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case "urgent":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "high":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    case "low":
      return "bg-slate-50 text-slate-500 ring-slate-200";
    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildUserProfileHref(row: AdminSupportRequestRow): string | null {
  const userId = row.reporterUserId ?? row.reporterContext?.matchedUserId;
  if (!userId) return null;
  const params = new URLSearchParams({ from: "support" });
  params.set("requestId", row.id);
  if (row.listingId) params.set("listingId", row.listingId);
  return `/admin/users/${userId}?${params.toString()}`;
}

function staffLabel(staff: AssignableStaff): string {
  const name = staff.fullName?.trim();
  return name ? `${name} (${staff.email})` : staff.email;
}

// ── Smart Action Panel — type-specific context & actions ──────────────────────

function SmartActionPanel({
  row,
  onActivate,
  onReject,
  busy
}: {
  row: AdminSupportRequestRow;
  onActivate: () => void;
  onReject: (note: string) => void;
  busy: boolean;
}) {
  const [rejectNote, setRejectNote] = useState("");
  const [showReject, setShowReject] = useState(false);
  const type = row.requestType;
  const isResolved = row.status === "resolved" || row.status === "closed" || row.status === "archived";

  // ── Servis/Ekspertiza profili ──────────────────────────────────────────────
  if (type === "inspection_partner") {
    const slug = row.metadata?.serviceSlug as string | undefined;
    const svcStatus = row.metadata?.serviceStatus as string | undefined;
    const isActive = svcStatus === "approved";
    return (
      <section className="rounded-xl border border-teal-200 bg-teal-50/50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🛠️</span>
          <div className="flex-1">
            <p className="font-semibold text-teal-800">Ekspertiza / Servis tərəfdaşlığı</p>
            {slug ? (
              isActive ? (
                <p className="mt-1 text-sm text-teal-700">
                  Bu profil müraciət göndəriləndə <strong>avtomatik aktivləşdirildi</strong>.
                  Əlavə admin təsdiqi tələb olunmur.
                </p>
              ) : (
                <p className="mt-1 text-sm text-amber-700">
                  Profil yaradılıb amma <strong>{svcStatus}</strong> statusundadır.
                </p>
              )
            ) : (
              <p className="mt-1 text-sm text-slate-600">
                Müraciət formasında kifayət qədər məlumat olmadığından profil avtomatik yaradılmadı.
                Lazım olarsa aşağıdakı "Mağaza profili yarat" linkinə keçin.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {slug && (
                <Link
                  href={`/services/${slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                >
                  Profili gör →
                </Link>
              )}
              {slug && (
                <Link
                  href={`/admin/services`}
                  className="inline-flex items-center gap-1 rounded-lg border border-teal-300 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100"
                >
                  Admin servis paneli
                </Link>
              )}
              {isActive && !isResolved && (
                <p className="self-center text-xs text-slate-500">
                  Bu müraciəti arxivlə — işiniz bitdi.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Salon müraciəti ────────────────────────────────────────────────────────
  if (type === "dealer_apply" || (type === "partnership" && row.metadata?.dealerApplication)) {
    const app = row.metadata?.dealerApplication as DealerApplicationMeta | undefined;
    return (
      <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🏢</span>
          <div className="flex-1">
            <p className="font-semibold text-blue-800">Salon müraciəti</p>
            {app ? (
              <div className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
                {app.businessName && (
                  <div><span className="text-xs text-slate-500">Salon adı</span><p className="font-medium text-slate-900">{app.businessName}</p></div>
                )}
                {app.city && (
                  <div><span className="text-xs text-slate-500">Şəhər</span><p className="font-medium text-slate-900">{app.city}</p></div>
                )}
                {app.voen && (
                  <div><span className="text-xs text-slate-500">VÖEN</span><p className="font-medium text-slate-900">{app.voen}</p></div>
                )}
                {app.phone && (
                  <div><span className="text-xs text-slate-500">Əlaqə nömrəsi</span><p className="font-medium text-slate-900">{app.phone}</p></div>
                )}
                {app.website && (
                  <div><span className="text-xs text-slate-500">Sayt</span>
                    <a href={app.website} target="_blank" rel="noopener" className="font-medium text-blue-700 hover:underline">{app.website}</a>
                  </div>
                )}
                {app.description && (
                  <div className="sm:col-span-2"><span className="text-xs text-slate-500">Qeyd</span><p className="text-slate-700">{app.description}</p></div>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Strukturlaşmış məlumat yoxdur — yuxarıdakı müraciət mətninə baxın.</p>
            )}
            {!isResolved && (
              <div className="mt-3 space-y-2">
                <div className="rounded-lg bg-blue-100/60 px-3 py-2 text-xs text-blue-800">
                  <strong>Aktivləşdir</strong> düyməsi basdıqda: Salon profili yaradılacaq · İstifadəçi
                  &ldquo;dealer&rdquo; roluna keçiriləcək · 30 günlük pulsuz sınaq abunəsi veriləcək.
                </div>
                {!showReject ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onActivate}
                      disabled={busy}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {busy ? "İşlənir..." : "✅ Müraciəti təsdiqlə & Aktivləşdir"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReject(true)}
                      disabled={busy}
                      className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      ❌ Rədd et
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      className="input-field min-h-16 text-sm"
                      placeholder="Rədd səbəbini yazın (istifadəçiyə göndəriləcək)..."
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onReject(rejectNote)}
                        disabled={busy || !rejectNote.trim()}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        {busy ? "Göndərilir..." : "Rədd et & Cavab göndər"}
                      </button>
                      <button type="button" onClick={() => setShowReject(false)} className="btn-secondary px-3 py-2 text-sm">
                        Geri
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {isResolved && (
              <p className="mt-2 text-sm font-medium text-emerald-700">✓ Bu müraciət həll edilib.</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ── Mağaza müraciəti ───────────────────────────────────────────────────────
  if (type === "parts_apply") {
    const app = row.metadata?.dealerApplication as DealerApplicationMeta | undefined;
    return (
      <section className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔧</span>
          <div className="flex-1">
            <p className="font-semibold text-violet-800">Ehtiyat hissələri mağazası müraciəti</p>
            {app ? (
              <div className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
                {app.businessName && (
                  <div><span className="text-xs text-slate-500">Mağaza adı</span><p className="font-medium text-slate-900">{app.businessName}</p></div>
                )}
                {app.city && (
                  <div><span className="text-xs text-slate-500">Şəhər</span><p className="font-medium text-slate-900">{app.city}</p></div>
                )}
                {app.voen && (
                  <div><span className="text-xs text-slate-500">VÖEN</span><p className="font-medium text-slate-900">{app.voen}</p></div>
                )}
                {app.phone && (
                  <div><span className="text-xs text-slate-500">Əlaqə nömrəsi</span><p className="font-medium text-slate-900">{app.phone}</p></div>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Strukturlaşmış məlumat yoxdur — yuxarıdakı müraciət mətninə baxın.</p>
            )}
            {!isResolved && (
              <div className="mt-3 space-y-2">
                <div className="rounded-lg bg-violet-100/60 px-3 py-2 text-xs text-violet-800">
                  <strong>Aktivləşdir</strong> düyməsi basdıqda: Mağaza abunəliyi aktiv ediləcək ·
                  İstifadəçi ehtiyat hissə elanı verə biləcək.
                </div>
                {!showReject ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onActivate}
                      disabled={busy}
                      className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                    >
                      {busy ? "İşlənir..." : "✅ Müraciəti təsdiqlə & Aktivləşdir"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReject(true)}
                      disabled={busy}
                      className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      ❌ Rədd et
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      className="input-field min-h-16 text-sm"
                      placeholder="Rədd səbəbini yazın..."
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onReject(rejectNote)}
                        disabled={busy || !rejectNote.trim()}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        {busy ? "Göndərilir..." : "Rədd et & Cavab göndər"}
                      </button>
                      <button type="button" onClick={() => setShowReject(false)} className="btn-secondary px-3 py-2 text-sm">
                        Geri
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {isResolved && (
              <p className="mt-2 text-sm font-medium text-emerald-700">✓ Bu müraciət həll edilib.</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ── GDPR / Məxfilik müraciəti ──────────────────────────────────────────────
  if (type.startsWith("data_")) {
    const gdprLabels: Record<string, string> = {
      data_export: "İstifadəçi məlumatlarını toplayan sistemi yoxlayın, ZIP arxiv hazırlayın və cavab göndərin.",
      data_deletion: "İstifadəçi hesabını arxivlə, şəxsi məlumatları sıfırla (ad, telefon, e-poçt) və cavab göndərin.",
      data_rectification: "İstifadəçinin düzəldilməsini istədiyi məlumatı yenilə (admin users paneli) və cavab göndərin.",
      data_processing_objection: "İstifadəçinin emal razılığını ləğv et (məxfilik paneli) və cavab göndərin."
    };
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-800">GDPR / Məxfilik müraciəti</p>
            <p className="mt-1 text-sm text-amber-700">{gdprLabels[type] ?? "Məxfilik sorğusunu yoxlayın və cavab göndərin."}</p>
            {row.reporterUserId && (
              <Link
                href={`/admin/users/${row.reporterUserId}`}
                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
              >
                İstifadəçi profilinə get →
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ── Şikayət ────────────────────────────────────────────────────────────────
  if (type === "complaint") {
    return (
      <section className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-rose-800">Şikayət müraciəti</p>
            <p className="mt-1 text-sm text-rose-700">
              Müraciəti nəzərdən keçirin. Ciddi ihlal varsa <strong>Incident yarat</strong> düyməsindən istifadə edin.
              Cavab göndərərkən həll olunub kimi qeyd edin.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return null;
}

// ── Main table component ───────────────────────────────────────────────────────

export function AdminSupportRequestsTable({
  items,
  assignees,
  canDelete = false
}: {
  items: AdminSupportRequestRow[];
  assignees: AssignableStaff[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [incidentMsg, setIncidentMsg] = useState<string | null>(null);
  const confirm = useConfirm();

  useEffect(() => {
    setRows(items);
  }, [items]);

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId]
  );

  const [draft, setDraft] = useState({
    status: selected?.status ?? "new",
    priority: selected?.priority ?? "normal",
    assignedToUserId: selected?.assignedToUserId ?? "",
    adminResponse: selected?.adminResponse ?? "",
    internalNotes: selected?.internalNotes ?? "",
    riskFlag: (selected?.riskFlag ?? "none") as SupportRiskFlag
  });

  function selectRow(row: AdminSupportRequestRow) {
    setSelectedId(row.id);
    setDraft({
      status: row.status,
      priority: row.priority,
      assignedToUserId: row.assignedToUserId ?? "",
      adminResponse: row.adminResponse ?? "",
      internalNotes: row.internalNotes ?? "",
      riskFlag: (row.riskFlag ?? "none") as SupportRiskFlag
    });
    setError(null);
    setEmailSent(false);
    setEmailError(null);
    setIncidentMsg(null);
  }

  async function patchRequest(payload: Record<string, unknown>): Promise<{ ok: boolean; emailSent?: boolean; emailError?: string; status?: string; partnershipActivated?: boolean; error?: string }> {
    const response = await fetch("/api/admin/support-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return response.json() as Promise<{ ok: boolean; emailSent?: boolean; emailError?: string; status?: string; partnershipActivated?: boolean; error?: string }>;
  }

  async function saveSelected(options?: { resendEmail?: boolean }) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setEmailSent(false);
    setEmailError(null);
    try {
      const result = await patchRequest({
        id: selected.id,
        status: draft.status,
        priority: draft.priority,
        assignedToUserId: draft.assignedToUserId.trim() || null,
        adminResponse: draft.adminResponse.trim() || undefined,
        internalNotes: draft.internalNotes,
        riskFlag: draft.riskFlag,
        resendEmail: options?.resendEmail === true
      });
      if (!result.ok) {
        setError(result.error ?? "Yeniləmə uğursuz oldu.");
        return;
      }
      const savedStatus = result.status ?? draft.status;
      const assignee = assignees.find((a) => a.id === draft.assignedToUserId);
      setDraft((d) => ({ ...d, status: savedStatus }));
      setRows((prev) =>
        prev.map((row) =>
          row.id === selected.id
            ? {
                ...row,
                status: savedStatus,
                priority: draft.priority,
                assignedToUserId: draft.assignedToUserId || undefined,
                assignedToEmail: assignee?.email,
                adminResponse: draft.adminResponse.trim() || row.adminResponse,
                internalNotes: draft.internalNotes,
                riskFlag: draft.riskFlag,
                responseAt: draft.adminResponse.trim() ? new Date().toISOString() : row.responseAt,
                lastActivityAt: new Date().toISOString()
              }
            : row
        )
      );
      router.refresh();
      if (result.emailSent) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 6000);
      }
      if (result.emailError) setEmailError(result.emailError);
      if (result.partnershipActivated) {
        setError(null);
        setTimeout(() => router.refresh(), 800);
      }
    } finally {
      setBusy(false);
    }
  }

  async function activateBusinessRequest() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const activationMsg = selected.requestType === "dealer_apply" || selected.requestType === "partnership"
        ? "Müraciətiniz təsdiqləndi. Salon panelinizə giriş açıldı."
        : "Müraciətiniz təsdiqləndi. Mağaza panelinizə giriş açıldı.";
      const result = await patchRequest({
        id: selected.id,
        status: "resolved",
        priority: "high",
        adminResponse: activationMsg
      });
      if (!result.ok) {
        setError(result.error ?? "Aktivləşdirmə uğursuz oldu.");
        return;
      }
      const savedStatus = result.status ?? "resolved";
      setDraft((d) => ({ ...d, status: savedStatus, adminResponse: activationMsg }));
      setRows((prev) =>
        prev.map((row) =>
          row.id === selected.id
            ? { ...row, status: savedStatus, adminResponse: activationMsg, lastActivityAt: new Date().toISOString() }
            : row
        )
      );
      setEmailSent(result.emailSent ?? false);
      if (result.partnershipActivated) {
        setTimeout(() => router.refresh(), 600);
      }
    } finally {
      setBusy(false);
    }
  }

  async function rejectBusinessRequest(note: string) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const result = await patchRequest({
        id: selected.id,
        status: "closed",
        priority: draft.priority,
        adminResponse: note.trim() || "Müraciətiniz rədd edildi."
      });
      if (!result.ok) {
        setError(result.error ?? "Rədd uğursuz oldu.");
        return;
      }
      const savedStatus = result.status ?? "closed";
      setDraft((d) => ({ ...d, status: savedStatus, adminResponse: note.trim() }));
      setRows((prev) =>
        prev.map((row) =>
          row.id === selected.id
            ? { ...row, status: savedStatus, adminResponse: note.trim(), lastActivityAt: new Date().toISOString() }
            : row
        )
      );
      if (result.emailSent) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 6000);
      }
    } finally {
      setBusy(false);
    }
  }

  async function createIncidentFromRequest() {
    if (!selected) return;
    setBusy(true);
    setIncidentMsg(null);
    try {
      const response = await fetch("/api/admin/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectType: selected.reporterUserId ? "user" : "system",
          subjectId: selected.reporterUserId ?? selected.id,
          category: selected.requestType === "complaint" ? "complaint" : "abuse",
          severity: draft.riskFlag === "legal" || draft.riskFlag === "abuse" ? "high" : "medium",
          title: `Müraciət: ${selected.subject}`,
          description: selected.message,
          reporterUserId: selected.reporterUserId,
          metadata: {
            supportRequestId: selected.id,
            reporterEmail: selected.reporterEmail,
            reporterIp: selected.reporterIp
          }
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; incident?: { id: string } };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Incident yaradıla bilmədi.");
        return;
      }
      setIncidentMsg(`Incident yaradıldı: ${payload.incident?.id.slice(0, 8)}`);
    } finally {
      setBusy(false);
    }
  }

  function openPrintExport(format: "html" | "json") {
    if (!selected) return;
    if (format === "html") {
      window.open(`/api/admin/support-requests/${selected.id}/export?format=html`, "_blank", "noopener,noreferrer");
      return;
    }
    window.open(`/api/admin/support-requests/${selected.id}/export?format=json`, "_blank", "noopener,noreferrer");
  }

  async function archiveSelected() {
    if (!selected || selected.status === "archived") return;
    setBusy(true);
    setError(null);
    try {
      setDraft((d) => ({ ...d, status: "archived" }));
      const response = await fetch("/api/admin/support-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, status: "archived" })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Arxivləmə uğursuz oldu.");
        setDraft((d) => ({ ...d, status: selected.status }));
        return;
      }
      setRows((prev) => prev.filter((row) => row.id !== selected.id));
      setSelectedId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelected() {
    if (!selected || selected.status !== "archived") return;
    const confirmed = await confirm({
      title: "Arxiv müraciətini sil",
      message: "Bu arxiv müraciəti həmişəlik silinsin? Geri qaytarmaq mümkün deyil.",
      confirmLabel: "Sil",
      danger: true
    });
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/support-requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [selected.id], reason: "Admin arxiv silməsi" })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Silmə uğursuz oldu.");
        return;
      }
      setRows((prev) => prev.filter((row) => row.id !== selected.id));
      setSelectedId(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const isArchived = selected?.status === "archived";

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
        <p className="text-sm font-medium text-slate-700">Müraciət tapılmadı</p>
        <p className="mt-1 text-xs text-slate-400">Filterləri dəyişin və ya yeni müraciət gözləyin.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid min-h-[620px] lg:grid-cols-[360px_1fr]">
        <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inbox</p>
            <p className="text-sm text-slate-700">{rows.length} müraciət</p>
          </div>
          <ul className="max-h-[580px] divide-y divide-slate-100 overflow-y-auto">
            {rows.map((row) => {
              const active = row.id === selectedId;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => selectRow(row)}
                    className={`w-full px-4 py-3 text-left transition ${
                      active ? "bg-[#0891B2]/5 border-l-2 border-[#0891B2]" : "hover:bg-slate-50 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`line-clamp-1 text-sm font-semibold ${active ? "text-[#0891B2]" : "text-slate-900"}`}>
                        {row.subject}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        {(row.requestType === "dealer_apply" || row.requestType === "parts_apply" || row.requestType === "inspection_partner") && row.status === "new" && (
                          <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-white">Aksiya</span>
                        )}
                        {row.status === "new" && <span className="mt-0.5 h-2 w-2 rounded-full bg-sky-500" />}
                      </div>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${requestTypeBadgeClass(row.requestType)}`}>
                        {REQUEST_TYPE_LABELS[row.requestType] ?? row.requestType}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${statusBadgeClass(row.status)}`}>
                        {STATUS_LABELS[row.status] ?? row.status}
                      </span>
                      {row.riskFlag !== "none" && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${riskFlagBadgeClass(row.riskFlag as SupportRiskFlag)}`}>
                          {RISK_FLAG_LABELS[row.riskFlag as SupportRiskFlag]}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{formatWhen(row.createdAt)}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {selected ? (
          <div className="flex flex-col">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{selected.subject}</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {REQUEST_TYPE_LABELS[selected.requestType] ?? selected.requestType} ·{" "}
                    {requestTypeGroupLabel(selected.requestType)} · ID {selected.id.slice(0, 8)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${requestTypeBadgeClass(selected.requestType)}`}>
                    {REQUEST_TYPE_LABELS[selected.requestType] ?? selected.requestType}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusBadgeClass(selected.status)}`}>
                    {STATUS_LABELS[selected.status] ?? selected.status}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${priorityBadgeClass(selected.priority)}`}>
                    {PRIORITY_LABELS[selected.priority] ?? selected.priority}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Müraciətçi</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Ad</p>
                    {buildUserProfileHref(selected) ? (
                      <Link href={buildUserProfileHref(selected)!} className="font-semibold text-[#0891B2] hover:underline">
                        {selected.reporterName ?? "Anonim"} →
                      </Link>
                    ) : (
                      <p className="font-medium text-slate-900">{selected.reporterName ?? "Anonim"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">E-poçt</p>
                    {buildUserProfileHref(selected) ? (
                      <Link href={buildUserProfileHref(selected)!} className="font-semibold text-[#0891B2] hover:underline">
                        {selected.reporterEmail}
                      </Link>
                    ) : (
                      <p className="font-medium text-slate-900">{selected.reporterEmail ?? "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Telefon</p>
                    <p className="font-medium text-slate-900">{selected.reporterPhone ?? "—"}</p>
                  </div>
                  {buildUserProfileHref(selected) && (
                    <div className="sm:col-span-2">
                      <Link
                        href={buildUserProfileHref(selected)!}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#0891B2] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0e7490]"
                      >
                        Platforma üzvlüyünə bax — elanlar, planlar, ödənişlər
                      </Link>
                    </div>
                  )}
                  {selected.listingId && (
                    <div>
                      <p className="text-xs text-slate-400">Elan ID</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-xs text-slate-700">{selected.listingId}</p>
                        <Link href={`/admin/listings?q=${selected.listingId}`} className="text-xs font-medium text-[#0891B2] hover:underline">
                          Elana bax
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Texniki / hüquqi iz</p>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-amber-700/80">IP ünvanı</p>
                    <p className="font-mono text-xs text-slate-800">{selected.reporterIp ?? "Qeydə alınmayıb (köhnə müraciət)"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-amber-700/80">User-Agent</p>
                    <p className="break-all font-mono text-[11px] text-slate-700">{selected.reporterUserAgent ?? "—"}</p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-amber-800/80">
                  Problemli davranış halında bu məlumatlar hüquq mühafizə orqanlarına təqdim oluna bilər.
                </p>
              </section>

              {selected.reporterContext && (
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">İstifadəçi konteksti</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Digər müraciətlər</p>
                      <p className="font-semibold text-slate-900">{selected.reporterContext.otherRequestCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Açıq incident</p>
                      <p className="font-semibold text-slate-900">{selected.reporterContext.openIncidentCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Hesab statusu</p>
                      <p className="font-semibold text-slate-900">{selected.reporterContext.accountStatus ?? "—"}</p>
                    </div>
                    {selected.reporterContext.penaltyBalanceAzn != null && selected.reporterContext.penaltyBalanceAzn > 0 && (
                      <div>
                        <p className="text-xs text-slate-400">Cərimə balansı</p>
                        <p className="font-semibold text-rose-700">{selected.reporterContext.penaltyBalanceAzn} ₼</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <SmartActionPanel
                row={selected}
                onActivate={() => void activateBusinessRequest()}
                onReject={(note) => void rejectBusinessRequest(note)}
                busy={busy}
              />

              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Müraciət mətni</p>
                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {selected.message}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Yaradılıb: {formatWhen(selected.createdAt)} · Son aktivlik: {formatWhen(selected.lastActivityAt)}
                  {selected.archivedAt && <> · Arxiv: {formatWhen(selected.archivedAt)}</>}
                </p>
              </section>

              {!isArchived && (
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                  <select className="input-field" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prioritet</span>
                  <select className="input-field" value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk</span>
                  <select className="input-field" value={draft.riskFlag} onChange={(e) => setDraft((d) => ({ ...d, riskFlag: e.target.value as SupportRiskFlag }))}>
                    {RISK_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Təhkim et</span>
                  <select className="input-field" value={draft.assignedToUserId} onChange={(e) => setDraft((d) => ({ ...d, assignedToUserId: e.target.value }))}>
                    <option value="">Təhkim olunmayıb</option>
                    {assignees.map((staff) => (
                      <option key={staff.id} value={staff.id}>{staffLabel(staff)} · {staff.role}</option>
                    ))}
                  </select>
                </label>
              </section>
              )}

              {!isArchived && (
              <>
              <section>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cavab (istifadəçiyə e-poçt)</span>
                  <textarea
                    className="input-field min-h-32"
                    value={draft.adminResponse}
                    onChange={(e) => setDraft((d) => ({ ...d, adminResponse: e.target.value }))}
                    placeholder="Cavabınızı yazın..."
                  />
                </label>
                {selected.reporterEmail ? (
                  <p className="mt-1.5 text-xs text-slate-400">Göndəriləcək: {selected.reporterEmail}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-amber-600">E-poçt yoxdur — cavab yalnız sistemdə saxlanılacaq.</p>
                )}
              </section>

              <section>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Daxili qeydlər (yalnız admin)</span>
                  <textarea
                    className="input-field min-h-24"
                    value={draft.internalNotes}
                    onChange={(e) => setDraft((d) => ({ ...d, internalNotes: e.target.value }))}
                    placeholder="Daxili qeydlər istifadəçiyə göndərilmir."
                  />
                </label>
              </section>
              </>
              )}

              {isArchived && (
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Bu müraciət arxivdədir. Həll edilmiş/bağlanmış müraciətlər {SUPPORT_ARCHIVE_AFTER_DAYS} gündən sonra avtomatik arxivlənir.
                  Yalnız admin arxiv müraciətlərini silə bilər.
                </section>
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                {!isArchived && (
                <>
                <button type="button" onClick={() => void saveSelected()} disabled={busy} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60">
                  {busy ? "Saxlanılır..." : "Saxla və cavab göndər"}
                </button>
                {draft.adminResponse.trim() && selected.reporterEmail && (
                  <button type="button" onClick={() => void saveSelected({ resendEmail: true })} disabled={busy} className="btn-secondary px-4 py-2.5 text-sm disabled:opacity-60">
                    E-poçtu yenidən göndər
                  </button>
                )}
                {(selected.status === "resolved" || selected.status === "closed") && (
                  <button type="button" onClick={() => void archiveSelected()} disabled={busy} className="btn-secondary px-4 py-2.5 text-sm disabled:opacity-60">
                    Arxivlə
                  </button>
                )}
                <button type="button" onClick={() => openPrintExport("html")} className="btn-secondary px-4 py-2.5 text-sm">
                  Çap / PDF
                </button>
                <button type="button" onClick={() => openPrintExport("json")} className="btn-secondary px-4 py-2.5 text-sm">
                  JSON export
                </button>
                <button type="button" onClick={() => void createIncidentFromRequest()} disabled={busy} className="btn-secondary px-4 py-2.5 text-sm disabled:opacity-60">
                  Incident yarat
                </button>
                </>
                )}
                {isArchived && canDelete && (
                <>
                <button type="button" onClick={() => openPrintExport("html")} className="btn-secondary px-4 py-2.5 text-sm">
                  Çap / PDF
                </button>
                <button type="button" onClick={() => openPrintExport("json")} className="btn-secondary px-4 py-2.5 text-sm">
                  JSON export
                </button>
                <button type="button" onClick={() => void deleteSelected()} disabled={busy} className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-60">
                  {busy ? "Silinir..." : "Arxivi sil"}
                </button>
                </>
                )}
                {emailSent && <span className="text-sm font-medium text-emerald-600">E-poçt göndərildi</span>}
                {emailError && <span className="text-sm text-amber-700">E-poçt xətası: {emailError}</span>}
                {incidentMsg && <span className="text-sm text-emerald-700">{incidentMsg}</span>}
                {error && <span className="text-sm text-rose-600">{error}</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-10 text-sm text-slate-400">Müraciət seçin</div>
        )}
      </div>
    </div>
  );
}
