"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";

interface Props {
  listingId: string;
  currentStatus: string;
  listingTitle: string;
  ownerUserId?: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  pending_review: "Yoxlamada",
  rejected: "Rədd edilib",
  archived: "Arxivdədir",
  inactive: "Deaktiv",
  draft: "Qaralama",
};

const STATUS_CLS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  archived: "bg-slate-100 text-slate-500 border-slate-200",
  inactive: "bg-violet-50 text-violet-700 border-violet-200",
  draft: "bg-slate-100 text-slate-600 border-slate-200",
};

type ModalType = "reject" | "return" | "block" | null;

export function AdminListingActions({ listingId, currentStatus, listingTitle, ownerUserId }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [noteText, setNoteText] = useState("");
  const toast = useToast();

  async function patchListing(body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await res.json()) as { ok: boolean; error?: string };
    if (!payload.ok) throw new Error(payload.error ?? "Xəta baş verdi");
  }

  async function updateStatus(newStatus: string, note?: string) {
    if (busy) return;
    setBusy(true);
    try {
      await patchListing({ status: newStatus, rejectionNote: note ?? null });
      setStatus(newStatus);
      router.refresh();
      toast.success(`Status yeniləndi: ${STATUS_LABELS[newStatus] ?? newStatus}`);
    } catch {
      toast.error("Status yenilənmədi");
    } finally {
      setBusy(false);
      setModal(null);
      setNoteText("");
    }
  }

  async function extendPlan() {
    if (busy) return;
    setBusy(true);
    try {
      await patchListing({ action: "extend" });
      toast.success("Elanın müddəti uzadıldı");
      router.refresh();
    } catch {
      toast.error("Müddət uzadılmadı");
    } finally {
      setBusy(false);
    }
  }

  const handleModalConfirm = () => {
    if (modal === "reject") void updateStatus("rejected", noteText);
    else if (modal === "return") void updateStatus("pending_review");
    else if (modal === "block") void updateStatus("inactive", noteText);
  };

  const modalConfig: Record<NonNullable<ModalType>, {
    title: string;
    body: string;
    showNote: boolean;
    notePlaceholder?: string;
    confirmLabel: string;
    confirmCls: string;
  }> = {
    reject: {
      title: "Elanı Rədd Et",
      body: "Elan rədd ediləcək. İstifadəçi bildiriş alacaq. Rədd etmə səbəbini göstərin:",
      showNote: true,
      notePlaceholder: "Məs: Şəkil keyfiyyəti aşağıdır, əsas məlumatlar doldurulmayıb...",
      confirmLabel: "Rədd et",
      confirmCls: "bg-red-600 text-white hover:bg-red-700"
    },
    return: {
      title: "Redaktəyə Göndər",
      body: "Elan sahibinə geri qaytarılacaq (yoxlamaya göndər). Sahibi düzəliş edib yenidən göndərə bilər.",
      showNote: false,
      confirmLabel: "Geri qaytar",
      confirmCls: "bg-amber-600 text-white hover:bg-amber-700"
    },
    block: {
      title: "Elanı Blokla",
      body: "Elan deaktiv ediləcək və ictimai axtarışdan gizlədilcək. Blok səbəbini göstərin:",
      showNote: true,
      notePlaceholder: "Məs: Qaydaları pozur, şübhəli qiymət...",
      confirmLabel: "Blokla",
      confirmCls: "bg-violet-600 text-white hover:bg-violet-700"
    }
  };

  const cfg = modal ? modalConfig[modal] : null;

  return (
    <>
      {/* Confirmation Modal */}
      {modal && cfg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">{cfg.title}</h3>
            <p className="mb-4 text-sm text-slate-600">{cfg.body}</p>
            {cfg.showNote && (
              <textarea
                className="input-field min-h-[80px] w-full resize-none text-sm"
                placeholder={cfg.notePlaceholder}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                autoFocus
              />
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary px-4 py-2 text-sm"
                onClick={() => { setModal(null); setNoteText(""); }}
                disabled={busy}
              >
                Ləğv et
              </button>
              <button
                type="button"
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${cfg.confirmCls}`}
                onClick={handleModalConfirm}
                disabled={busy || (cfg.showNote && noteText.trim().length < 5)}
              >
                {busy ? "..." : cfg.confirmLabel}
              </button>
            </div>
            {cfg.showNote && noteText.trim().length < 5 && noteText.length > 0 && (
              <p className="mt-2 text-xs text-red-500">Ən azı 5 simvol lazımdır</p>
            )}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="mb-6 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Admin moderasiya
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
              {STATUS_LABELS[status] ?? status}
            </span>
            <span className="hidden max-w-[200px] truncate text-sm text-slate-600 sm:block">{listingTitle}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Approve */}
            {status !== "active" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void updateStatus("active")}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Təsdiqlə
              </button>
            )}
            {/* Reject */}
            {status !== "rejected" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setModal("reject")}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Rədd et
              </button>
            )}
            {/* Return for edit */}
            {status !== "pending_review" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setModal("return")}
                className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                Geri qaytar
              </button>
            )}
            {/* Block */}
            {status !== "inactive" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setModal("block")}
                className="flex items-center gap-1.5 rounded-xl border border-violet-300 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-60"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Blokla
              </button>
            )}
            {/* Extend plan */}
            <button
              type="button"
              disabled={busy}
              onClick={() => void extendPlan()}
              title="Elanın aktivlik müddətini uzadır"
              className="flex items-center gap-1.5 rounded-xl border border-[#0057FF]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#0057FF] hover:bg-[#0057FF]/5 disabled:opacity-60"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Müddəti uzat
            </button>
            {/* Archive */}
            {status !== "archived" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void updateStatus("archived")}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Arxivlə
              </button>
            )}
            {ownerUserId && (
              <a
                href={`/admin/users/${ownerUserId}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                İstifadəçi ↗
              </a>
            )}
            <a
              href="/admin/listings"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              ← Admin
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
