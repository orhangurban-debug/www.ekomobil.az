"use client";

import { useState } from "react";

interface SupportRequestFormProps {
  listingId?: string;
}

const REQUEST_TYPES: Array<{ value: string; label: string }> = [
  { value: "question", label: "Sual" },
  { value: "problem", label: "Problem" },
  { value: "complaint", label: "Şikayət" },
  { value: "partnership", label: "Tərəfdaşlıq" },
  { value: "other", label: "Digər" }
];

export function SupportRequestForm({ listingId }: SupportRequestFormProps) {
  const [requestType, setRequestType] = useState("question");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setIsError(true);
      setFeedback("Mövzu və müraciət mətni mütləqdir.");
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    setIsError(false);
    try {
      const response = await fetch("/api/support/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType,
          subject: subject.trim(),
          message: message.trim(),
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          listingId
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; message?: string };
      if (!response.ok || !payload.ok) {
        setIsError(true);
        setFeedback(payload.error ?? "Müraciət göndərilə bilmədi.");
        return;
      }
      setFeedback(payload.message ?? "Müraciətiniz qəbul edildi.");
      setSubject("");
      setMessage("");
      setName("");
      setEmail("");
      setPhone("");
      setRequestType("question");
      setIsError(false);
    } catch {
      setIsError(true);
      setFeedback("Server xətası baş verdi. Zəhmət olmasa yenidən cəhd edin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-base font-semibold text-slate-900">Müraciət göndər</h3>
      <p className="mt-1 text-sm text-slate-500">
        Sualınız, probleminiz və ya şikayətiniz varsa formu doldurun. Dəstək komandası qısa zamanda cavab verəcək.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Müraciət tipi</span>
          <select className="input-field" value={requestType} onChange={(e) => setRequestType(e.target.value)}>
            {REQUEST_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adınız</span>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad Soyad" />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mövzu</span>
          <input className="input-field" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Mövzunu qısa yazın" />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mesaj</span>
          <textarea
            className="input-field min-h-32"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Problemi və ya sualınızı detallı yazın"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
          <input className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ad@example.com" />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telefon</span>
          <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+994..." />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Göndərilir..." : "Müraciəti göndər"}
        </button>
        {feedback && (
          <span className={`text-sm ${isError ? "text-rose-600" : "text-emerald-700"}`}>
            {feedback}
          </span>
        )}
      </div>
    </form>
  );
}
