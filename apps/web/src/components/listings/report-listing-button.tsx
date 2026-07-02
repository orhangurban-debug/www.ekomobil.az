"use client";

import { FormEvent, useState } from "react";
import { USER_REPORT_REASON_LABELS, type UserReportReason } from "@/lib/user-reports";

export function ReportListingButton({
  listingId,
  listingTitle,
  reportedUserId
}: {
  listingId: string;
  listingTitle: string;
  reportedUserId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<UserReportReason>("misleading");
  const [description, setDescription] = useState("");
  const [reporterEvidence, setReporterEvidence] = useState("");
  const [ackLiability, setAckLiability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ackLiability) {
      setError("Yalan şikayət məsuliyyətini qəbul etməlisiniz.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          reportedUserId,
          reasonCode,
          description,
          reporterEvidence,
          ackFalseReportLiability: true as const
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; message?: string };
      if (!payload.ok) {
        setError(payload.error || "Şikayət göndərilmədi.");
        return;
      }
      setMessage(
        payload.message ||
          "Şikayət qeydə alındı. Satıcıya 7 gün müdafiə sübutu təqdim etmək üçün vaxt verilir."
      );
      setDescription("");
      setReporterEvidence("");
      setAckLiability(false);
      setTimeout(() => setOpen(false), 2000);
    } catch {
      setError("Şəbəkə xətası baş verdi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary text-sm">
        Elanı şikayət et
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Elanı şikayət et</h3>
            <p className="mt-1 text-sm text-slate-500">{listingTitle}</p>

            <div className="mt-3 rounded-xl alert-warning border p-3 text-xs leading-relaxed text-amber-700">
              Şikayət yalnız sübutla qəbul edilir. Yalan və ya əsassız şikayətə görə məsuliyyət daşıyırsınız.
              Satıcı haqlıdırsa, 7 gün ərzində müdafiə sübutu təqdim edə bilər; sübut verməsə, iş hüquq-mühafizə
              orqanlarına ötürülə bilər.
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div>
                <label className="label">Səbəb</label>
                <select
                  className="input-field"
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value as UserReportReason)}
                >
                  {Object.entries(USER_REPORT_REASON_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Qısa təsvir</label>
                <textarea
                  className="input-field min-h-24"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nə səhvdir?"
                  minLength={20}
                  maxLength={4000}
                  required
                />
              </div>
              <div>
                <label className="label">Sübutunuz (məcburi)</label>
                <textarea
                  className="input-field min-h-28"
                  value={reporterEvidence}
                  onChange={(e) => setReporterEvidence(e.target.value)}
                  placeholder="Hansı fakt, foto, sənəd, yazışma və ya yoxlama nəticəsinə əsaslanırsınız?"
                  minLength={30}
                  maxLength={4000}
                  required
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={ackLiability}
                  onChange={(e) => setAckLiability(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                />
                <span>
                  Təsdiq edirəm ki, şikayətim sübuta əsaslanır. Yalan və ya qəsdən yanıldıcı şikayətə görə
                  platforma qaydalarına və qanunvericiliyə uyğun məsuliyyət daşıyacağımı bilirəm.
                </span>
              </label>

              {error && (
                <div className="rounded-xl alert-danger border px-3 py-2 text-sm text-red-700">{error}</div>
              )}
              {message && (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setOpen(false)}>
                  Bağla
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-50">
                  {loading ? "Göndərilir..." : "Şikayət göndər"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
