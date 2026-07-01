"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function PlatformConsentForm({
  nextPath = "/me",
  source = "oauth"
}: {
  nextPath?: string;
  source?: "oauth" | "reaccept";
}) {
  const router = useRouter();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acceptTerms || !acceptPrivacy) {
      setError("Davam etmək üçün hər iki razılaşmanı qəbul edin.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/consent/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error || "Razılaşma qeydə alınmadı.");
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Şəbəkə xətası baş verdi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-8">
      <div className="rounded-xl alert-warning border p-4 text-sm text-amber-200">
        Platformadan istifadə etmək üçün İstifadəçi Razılaşması və Məxfilik Siyasətini qəbul etməlisiniz.
        Bu, fırıldaqçılıq hallarında hüquqi qorunma və məlumatların qanuni paylaşımı üçün vacibdir.
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-white/80">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300"
        />
        <span>
          <Link href="/terms" className="font-medium text-[#0057FF] hover:underline" target="_blank">
            İstifadəçi Razılaşmasını
          </Link>{" "}
          oxudum və qəbul edirəm.
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-white/80">
        <input
          type="checkbox"
          checked={acceptPrivacy}
          onChange={(e) => setAcceptPrivacy(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300"
        />
        <span>
          <Link href="/privacy" className="font-medium text-[#0057FF] hover:underline" target="_blank">
            Məxfilik Siyasətini
          </Link>{" "}
          oxudum və qəbul edirəm.
        </span>
      </label>

      {error && (
        <div className="rounded-xl alert-danger border px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50">
        {loading ? "Qeydə alınır..." : "Qəbul et və davam et"}
      </button>
    </form>
  );
}
