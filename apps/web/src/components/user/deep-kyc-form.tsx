"use client";

import { FormEvent, useState } from "react";

interface Props {
  initialStatus: string;
  initialLegalName?: string;
  initialNationalIdLast4?: string;
  initialDocumentRef?: string;
  reviewNote?: string;
}

export function DeepKycForm(props: Props) {
  const [legalName, setLegalName] = useState(props.initialLegalName ?? "");
  const [nationalIdLast4, setNationalIdLast4] = useState(props.initialNationalIdLast4 ?? "");
  const [documentRef, setDocumentRef] = useState(props.initialDocumentRef ?? "");
  const [status, setStatus] = useState(props.initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/kyc/deep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legalName, nationalIdLast4, documentRef: documentRef || undefined })
    });
    const payload = (await res.json()) as {
      ok: boolean;
      error?: string;
      profile?: { status?: string };
    };

    if (!payload.ok) {
      setError(payload.error ?? "KYC göndərilməsi alınmadı");
    } else {
      setStatus(payload.profile?.status ?? "submitted");
      setMessage("Deep KYC müraciəti göndərildi. Ops yoxlamasından sonra status yenilənəcək.");
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Deep KYC müraciəti</h2>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            status === "approved"
              ? "bg-emerald-100 text-emerald-700"
              : status === "rejected"
                ? "bg-rose-100 text-rose-700"
                : status === "submitted"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-700"
          }`}
        >
          {status}
        </span>
      </div>

      <p className="text-sm text-slate-600">
        Yüksək dəyərli lotlarda satıcı bond tələbindən azad olmaq üçün deep KYC təsdiqi lazımdır.
      </p>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="label">Hüquqi ad (tam)</label>
          <input
            className="input-field"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="Ad Soyad / Şirkət adı"
            required
          />
        </div>
        <div>
          <label className="label">Ş/V və ya VÖEN-in son 4 rəqəmi</label>
          <input
            className="input-field"
            value={nationalIdLast4}
            onChange={(e) => setNationalIdLast4(e.target.value)}
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            required
          />
        </div>
        <div>
          <label className="label">Sənəd istinadı (opsional)</label>
          <input
            className="input-field"
            value={documentRef}
            onChange={(e) => setDocumentRef(e.target.value)}
            placeholder="Məs: daxili ticket ID və ya sənəd link adı"
          />
        </div>
        <button className="btn-primary w-full justify-center" disabled={submitting} type="submit">
          {submitting ? "Göndərilir..." : "Deep KYC müraciətini göndər"}
        </button>
      </form>

      {props.reviewNote && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Son ops qeydi: {props.reviewNote}
        </div>
      )}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    </div>
  );
}
